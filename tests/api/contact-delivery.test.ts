import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
const mock = vi.hoisted(() => ({ rpc: vi.fn(), single: vi.fn(), update: vi.fn(), eq: vi.fn() }));
vi.mock('@supabase/supabase-js', () => ({ createClient: () => ({ rpc: mock.rpc, from: () => ({ select: () => ({ eq: () => ({ single: mock.single }) }), update: mock.update }) }) }));
import { deliverContactJobs } from '../../api/_contact.js';
const job = { id: 'event-id', lead_id: 'lead-id', destination: 'email', attempts: 1 };
beforeEach(() => {
  vi.stubEnv('SUPABASE_URL', 'https://db.example'); vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', 'secret');
  vi.stubEnv('CONTACT_FORM_URL', 'https://relay.example/exec'); vi.stubEnv('CONTACT_RELAY_TOKEN', 'relay-secret');
  mock.rpc.mockReset().mockResolvedValue({ data: [job], error: null });
  mock.single.mockReset().mockResolvedValue({ data: { id: 'lead-id', nome: 'Pessoa', tema: 'Consultoria', email: 'private@example.com', notes: 'internal notes' }, error: null });
  mock.eq.mockReset().mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) });
  mock.update.mockReset().mockReturnValue({ eq: mock.eq });
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => ({ ok: true }) }));
});
afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); });
describe('contact deliveries', () => {
  it('marks delivery sent only after explicit relay acknowledgement', async () => {
    await deliverContactJobs('lead-id');
    expect(mock.rpc).toHaveBeenCalledWith('claim_contact_deliveries', { p_lead_id: 'lead-id' });
    expect(mock.update).toHaveBeenCalledWith(expect.objectContaining({ status: 'sent' }));
    const body = JSON.parse(vi.mocked(fetch).mock.calls[0][1]!.body as string);
    expect(body.event_id).toBe('event-id'); expect(body.lead.notes).toBeUndefined();
  });
  it('keeps jobs pending on relay rejection and network exceptions', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({ ok: true, json: async () => ({ ok: false }) } as Response);
    await deliverContactJobs();
    expect(mock.update).toHaveBeenCalledWith(expect.objectContaining({ status: 'pending' }));
    mock.update.mockClear(); vi.mocked(fetch).mockRejectedValueOnce(new Error('offline'));
    await deliverContactJobs();
    expect(mock.update).toHaveBeenCalledWith(expect.objectContaining({ status: 'pending' }));
  });
  it('does not send when a destination is unconfigured', async () => {
    vi.stubEnv('CONTACT_RELAY_TOKEN', '');
    await deliverContactJobs();
    expect(fetch).not.toHaveBeenCalled();
    expect(mock.update).toHaveBeenCalledWith(expect.objectContaining({ status: 'pending' }));
  });
  it('notifies through the existing CoS bot without contact PII', async () => {
    mock.rpc.mockResolvedValue({ data: [{ ...job, destination: 'chief_of_staff' }], error: null });
    vi.stubEnv('CONTACT_COS_TELEGRAM_BOT_TOKEN', 'bot-secret'); vi.stubEnv('CONTACT_COS_TELEGRAM_CHAT_ID', '123');
    await deliverContactJobs();
    const body = JSON.parse(vi.mocked(fetch).mock.calls[0][1]!.body as string);
    expect(body.chat_id).toBe('123'); expect(body.text).toContain('lead-id');
    expect(body.text).not.toContain('private@example.com');
    expect(mock.update).toHaveBeenCalledWith(expect.objectContaining({ status: 'sent' }));
  });
});
