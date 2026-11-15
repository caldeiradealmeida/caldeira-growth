import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createHmac } from 'node:crypto';
import { contactDb, contactSchema, deliverContactJobs } from './_contact.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method === 'GET') {
    if (!process.env.CRON_SECRET || req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
      return res.status(401).json({ ok: false, error: 'unauthorized' });
    }
    try { await deliverContactJobs(); return res.status(200).json({ ok: true }); }
    catch { return res.status(503).json({ ok: false, error: 'delivery_unavailable' }); }
  }
  if (req.method !== 'POST') return res.status(405).json({ ok: false, error: 'method_not_allowed' });
  try {
    const raw = typeof req.body === 'string' ? req.body : JSON.stringify(req.body ?? {});
    if (Buffer.byteLength(raw) > 16000) return res.status(413).json({ ok: false, error: 'payload_too_large' });
    let body;
    try { body = JSON.parse(raw); } catch { return res.status(400).json({ ok: false, error: 'invalid_payload' }); }
    // Honeypot: no persistence or notifications.
    if (typeof body?.website === 'string' && body.website.trim()) return res.status(200).json({ ok: true });
    const parsed = contactSchema.safeParse(body);
    if (!parsed.success) return res.status(400).json({ ok: false, error: 'validation' });
    const secret = process.env.CONTACT_TURNSTILE_SECRET;
    const rateSecret = process.env.CONTACT_RATE_SECRET;
    if (!secret || !rateSecret) return res.status(503).json({ ok: false, error: 'not_configured' });
    const origin = req.headers.origin;
    const allowedHosts = ['www.caldeiragrowth.com', 'caldeiragrowth.com'];
    if (origin && !allowedHosts.includes(new URL(origin).hostname)) return res.status(403).json({ ok: false, error: 'origin_rejected' });
    const verification = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST', signal: AbortSignal.timeout(8000),
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ secret, response: parsed.data.turnstile_token }),
    });
    const result = await verification.json();
    if (!verification.ok || !result.success || !allowedHosts.includes(result.hostname) || result.action !== 'contact') return res.status(403).json({ ok: false, error: 'verification_failed' });
    const { request_id } = parsed.data;
    const lead = { nome: parsed.data.nome, email: parsed.data.email, empresa: parsed.data.empresa,
      cargo: parsed.data.cargo, tema: parsed.data.tema, mensagem: parsed.data.mensagem, source_url: parsed.data.source_url };
    const ip = String(req.headers['x-vercel-forwarded-for'] ?? req.headers['x-forwarded-for'] ?? req.socket?.remoteAddress ?? 'unknown').split(',')[0].trim();
    const hash = (value: string) => createHmac('sha256', rateSecret).update(value).digest('hex');
    const db = contactDb();
    const { data, error } = await db.rpc('submit_contact', { p_request_id: request_id, p_payload: lead, p_ip_hash: hash(ip), p_email_hash: hash(lead.email) });
    if (error) throw new Error('contact_persistence_failed');
    if (data.error === 'rate_limited') { res.setHeader('Retry-After', '900'); return res.status(429).json({ ok: false, error: 'rate_limited' }); }
    // Delivery failure never loses an accepted lead; cron processes the outbox.
    try { await deliverContactJobs(data.id); } catch { console.error('[contact] delivery deferred'); }
    return res.status(200).json({ ok: true });
  } catch {
    console.error('[contact] request failed');
    return res.status(503).json({ ok: false, error: 'temporarily_unavailable' });
  }
}
