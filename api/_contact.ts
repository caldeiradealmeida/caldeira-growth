import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';

export const contactSchema = z.object({
  nome: z.string().trim().min(2).max(160),
  email: z.string().trim().email().max(254).transform(v => v.toLowerCase()),
  empresa: z.string().trim().max(200).default(''),
  cargo: z.string().trim().max(160).default(''),
  tema: z.string().trim().min(1).max(160),
  mensagem: z.string().trim().min(20).max(6000),
  request_id: z.string().uuid(),
  website: z.string().max(200).default(''),
  turnstile_token: z.string().min(1).max(2048),
  source_url: z.string().max(1000).default(''),
});

export function contactDb() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('contact_database_not_configured');
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

// Every destination has a durable job and a stable event ID for deduplication.
export async function deliverContactJobs(leadId?: string) {
  const db = contactDb();
  const { data: jobs, error } = await db.rpc('claim_contact_deliveries', { p_lead_id: leadId ?? null });
  if (error) throw new Error('contact_delivery_claim_failed');
  const deliver = async (job: { id: string; lead_id: string; destination: string; attempts: number }) => {
    try {
      const { data: lead, error: readError } = await db.from('contact_submissions').select('*').eq('id', job.lead_id).single();
      if (readError || !lead) throw new Error('lead_read_failed');
      const isChief = job.destination === 'chief_of_staff';
      const botToken = process.env.CONTACT_COS_TELEGRAM_BOT_TOKEN;
      const chatId = process.env.CONTACT_COS_TELEGRAM_CHAT_ID;
      const telegram = isChief && Boolean(botToken && chatId);
      const url = telegram ? `https://api.telegram.org/bot${botToken}/sendMessage`
        : isChief ? process.env.CONTACT_COS_WEBHOOK_URL : process.env.CONTACT_FORM_URL;
      const token = telegram ? botToken : isChief ? process.env.CONTACT_COS_WEBHOOK_TOKEN : process.env.CONTACT_RELAY_TOKEN;
      if (!url || !token || !url.startsWith('https://')) throw new Error('destination_not_configured');
      const eventLead = { id: lead.id, created_at: lead.created_at, nome: lead.nome, email: lead.email,
        empresa: lead.empresa, cargo: lead.cargo, tema: lead.tema, mensagem: lead.mensagem, source_url: lead.source_url };
      const response = await fetch(url, {
        method: 'POST', signal: AbortSignal.timeout(12000),
        headers: { 'Content-Type': 'application/json', ...(isChief && !telegram ? { Authorization: `Bearer ${token}`, 'Idempotency-Key': job.id } : {}) },
        body: JSON.stringify(telegram
          ? { chat_id: chatId, text: ['Novo lead | Caldeira Growth', `Tema: ${lead.tema}`,
              'Ação: revisar o e-mail de novo contato e responder ao interessado.', `Referência: ${lead.id}`].join('\n') }
          : isChief ? { event: 'contact.lead_created', event_id: job.id, lead: eventLead }
          : { action: 'contact_delivery', token, event_id: job.id, destination: job.destination, lead: eventLead }),
      });
      if (!response.ok) throw new Error('destination_http_error');
      if ((!isChief || telegram) && (await response.json()).ok !== true) throw new Error('relay_rejected');
      const { error: updateError } = await db.from('contact_deliveries').update({ status: 'sent', sent_at: new Date().toISOString(), last_error: null }).eq('id', job.id).eq('attempts', job.attempts);
      if (updateError) throw new Error('delivery_receipt_failed');
    } catch {
      await db.from('contact_deliveries').update({ status: 'pending', last_error: 'delivery_failed_or_unconfigured', available_at: new Date(Date.now() + 15 * 60000).toISOString() }).eq('id', job.id).eq('attempts', job.attempts);
    }
  };
  const claimed = jobs ?? [];
  for (let i = 0; i < claimed.length; i += 3) {
    await Promise.all(claimed.slice(i, i + 3).map(deliver));
  }
}
