import type { VercelRequest, VercelResponse } from '@vercel/node';
import { deliverContactJobs } from '../_contact.js';
export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'GET') return res.status(405).json({ ok: false });
  if (!process.env.CRON_SECRET || req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) return res.status(401).json({ ok: false });
  try { await deliverContactJobs(); return res.status(200).json({ ok: true }); }
  catch { return res.status(503).json({ ok: false }); }
}
