import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { VercelRequest, VercelResponse } from '@vercel/node';
const state = vi.hoisted(() => ({ rpc: vi.fn(), deliver: vi.fn() }));
vi.mock('../../api/_contact.js', async original => ({
  ...await original<typeof import('../../api/_contact.js')>(),
  contactDb: () => ({ rpc: state.rpc }), deliverContactJobs: state.deliver,
}));
import handler from '../../api/contact.js';
const lead = { nome: 'Nome Teste', email: 'TESTE@example.com', tema: 'Consultoria', mensagem: 'Gostaria de conversar sobre meu negócio.', request_id: '1666c097-7eb2-4d09-8d5c-760953b85ea3', turnstile_token: 'valid' };
function response() {
  return { setHeader: vi.fn().mockReturnThis(), status: vi.fn().mockReturnThis(), json: vi.fn().mockReturnThis() };
}
async function submit(body: unknown, options = {}) {
  const res = response();
  await handler({ method: 'POST', headers: {}, body, socket: { remoteAddress: '127.0.0.1' }, ...options } as unknown as VercelRequest, res as unknown as VercelResponse);
  return res;
}
beforeEach(() => {
  vi.stubEnv('CONTACT_TURNSTILE_SECRET', 'secret'); vi.stubEnv('CONTACT_RATE_SECRET', 'rate-secret');
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => ({ success: true, hostname: 'www.caldeiragrowth.com', action: 'contact' }) }));
  state.rpc.mockReset().mockResolvedValue({ data: { id: 'lead-id' }, error: null });
  state.deliver.mockReset().mockResolvedValue(undefined);
});
afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); });
describe('contact boundary', () => {
  it('requires cron authentication for GET recovery', async () => {
    vi.stubEnv('CRON_SECRET', 'cron-test');
    expect((await submit(undefined, { method: 'GET' })).status).toHaveBeenCalledWith(401);
    expect(state.deliver).not.toHaveBeenCalled();
    expect((await submit(undefined, { method: 'GET', headers: { authorization: 'Bearer cron-test' } })).status).toHaveBeenCalledWith(200);
    expect(state.deliver).toHaveBeenCalledWith();
  });
  it('rejects recovery when no cron secret exists', async () => {
    vi.stubEnv('CRON_SECRET', '');
    expect((await submit(undefined, { method: 'GET', headers: { authorization: 'Bearer ' } })).status).toHaveBeenCalledWith(401);
    expect(state.deliver).not.toHaveBeenCalled();
  });
  it('rejects invalid JSON and incomplete data without network calls', async () => {
    expect((await submit('{')).status).toHaveBeenCalledWith(400);
    expect((await submit({ ...lead, email: 'invalid' })).status).toHaveBeenCalledWith(400);
    expect(fetch).not.toHaveBeenCalled(); expect(state.rpc).not.toHaveBeenCalled();
  });
  it('silently discards honeypot submissions', async () => {
    expect((await submit({ ...lead, website: 'robot' })).json).toHaveBeenCalledWith({ ok: true });
    expect(fetch).not.toHaveBeenCalled(); expect(state.rpc).not.toHaveBeenCalled();
  });
  it('fails closed without configuration', async () => {
    vi.stubEnv('CONTACT_TURNSTILE_SECRET', '');
    expect((await submit(lead)).status).toHaveBeenCalledWith(503);
    expect(state.rpc).not.toHaveBeenCalled();
  });
  it.each([
    { success: false, hostname: 'www.caldeiragrowth.com', action: 'contact' },
    { success: true, hostname: 'evil.example', action: 'contact' },
    { success: true, hostname: 'www.caldeiragrowth.com', action: 'other' },
  ])('rejects failed or mismatched verification', async result => {
    vi.mocked(fetch).mockResolvedValue({ ok: true, json: async () => result } as Response);
    expect((await submit(lead)).status).toHaveBeenCalledWith(403);
    expect(state.rpc).not.toHaveBeenCalled();
  });
  it('persists normalized fields without token or raw IP, then delivers', async () => {
    expect((await submit(lead)).status).toHaveBeenCalledWith(200);
    const args = state.rpc.mock.calls[0][1];
    expect(args.p_payload.email).toBe('teste@example.com');
    expect(args.p_payload.turnstile_token).toBeUndefined();
    expect(args.p_ip_hash).toMatch(/^[a-f0-9]{64}$/);
    expect(state.deliver).toHaveBeenCalledWith('lead-id');
  });
  it('returns 429 without notifications when the database limits requests', async () => {
    state.rpc.mockResolvedValue({ data: { error: 'rate_limited' }, error: null });
    expect((await submit(lead)).status).toHaveBeenCalledWith(429);
    expect(state.deliver).not.toHaveBeenCalled();
  });
  it('never acknowledges an unsuccessful database write', async () => {
    state.rpc.mockResolvedValue({ data: null, error: { message: 'db error' } });
    expect((await submit(lead)).status).toHaveBeenCalledWith(503);
    expect(state.deliver).not.toHaveBeenCalled();
  });
  it('accepts a saved lead even when immediate delivery is unavailable', async () => {
    state.deliver.mockRejectedValue(new Error('offline'));
    expect((await submit(lead)).json).toHaveBeenCalledWith({ ok: true });
  });
  it('rejects oversized payloads and foreign origins', async () => {
    expect((await submit(' '.repeat(16001))).status).toHaveBeenCalledWith(413);
    expect((await submit(lead, { headers: { origin: 'https://evil.example' } })).status).toHaveBeenCalledWith(403);
    expect(state.rpc).not.toHaveBeenCalled();
  });
});
