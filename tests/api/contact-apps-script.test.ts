import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import { describe, expect, it, vi } from 'vitest';
function script() {
  const rows: unknown[][] = [];
  const sent = vi.fn();
  const receiptIds = new Set<string>();
  const receipts = {
    getRange: () => ({ createTextFinder: (id: string) => ({ matchEntireCell: () => ({ findNext: () => receiptIds.has(id) }) }) }),
    appendRow: (row: unknown[]) => receiptIds.add(String(row[0])),
  };
  const props: Record<string, string> = { CGI_EMAIL_RELAY_TOKEN: 'cgi-shared', CONTACT_RELAY_TOKEN: 'shared', CONTACT_LEGACY_DISABLED: 'true', CONTACT_NOTIFICATION_EMAIL: 'owner@example.com' };
  const ctx = {
    PropertiesService: { getScriptProperties: () => ({ getProperty: (key: string) => props[key] }) },
    ContentService: { MimeType: { JSON: 'json' }, createTextOutput: (s: string) => ({ setMimeType: () => JSON.parse(s) }) },
    SpreadsheetApp: { openById: () => ({ getSheets: () => [{ appendRow: (row: unknown[]) => rows.push(row) }], getSheetByName: () => receipts }) },
    LockService: { getScriptLock: () => ({ waitLock: vi.fn(), releaseLock: vi.fn() }) },
    MailApp: { sendEmail: sent },
  };
  const context = { ...ctx } as Record<string, unknown>;
  runInNewContext(readFileSync('google-apps-script.js', 'utf8'), context);
  return { rows, sent, props, post: (payload: object) => (context.doPost as (e: object) => { ok: boolean; error?: string })({ postData: { contents: JSON.stringify(payload) } }) };
}
const payload = { action: 'contact_delivery', token: 'shared', event_id: '1666c097-7eb2-4d09-8d5c-760953b85ea3', destination: 'sheet', lead: { id: 'lead', nome: '=FORMULA()', email: 'person@example.com', tema: 'Consultoria', mensagem: '+command', created_at: '2026-11-15T12:00:00Z' } };
describe('Apps Script contact relay', () => {
  it('closes the old unauthenticated write path', () => {
    const app = script();
    expect(app.post({ nome: 'Robot', email: 'robot@example.com' }).error).toBe('contact_endpoint_retired');
    expect(app.rows).toHaveLength(0);
  });
  it('keeps the old form working during the explicit transition', () => {
    const app = script();
    delete app.props.CONTACT_LEGACY_DISABLED;
    expect(app.post({ nome: 'Pessoa', email: 'person@example.com' }).ok).toBe(true);
    expect(app.rows).toHaveLength(1);
    app.props.CONTACT_LEGACY_DISABLED = 'true';
    expect(app.post({ nome: 'Pessoa', email: 'person@example.com' }).error).toBe('contact_endpoint_retired');
    expect(app.rows).toHaveLength(1);
  });
  it('preserves internal CGI notification and participant kill switches', () => {
    const app = script();
    const cgi = { action: 'cgi_send_email', token: 'cgi-shared', emailKind: 'internal_notification', recipient: 'owner@example.com', subject: 'CGI', plainText: 'Novo diagnóstico', htmlBody: '<p>CGI</p>' };
    expect(app.post(cgi).ok).toBe(true);
    expect(app.sent).toHaveBeenCalledTimes(1);
    app.post({ ...cgi, emailKind: 'report_ready' });
    app.post({ ...cgi, emailKind: 'abandonment' });
    expect(app.sent).toHaveBeenCalledTimes(1);
  });
  it('rejects invalid tokens and protects cells from formulas', () => {
    const app = script();
    expect(app.post({ ...payload, token: 'wrong' }).ok).toBe(false);
    expect(app.rows).toHaveLength(0);
    expect(app.post(payload).ok).toBe(true);
    expect(app.rows[0][1]).toBe("'=FORMULA()");
    expect(app.rows[0][6]).toBe("'+command");
  });
  it('deduplicates delivered events', () => {
    const app = script();
    app.post(payload); app.post(payload);
    expect(app.rows).toHaveLength(1);
  });
  it('sends only to the configured owner, once', () => {
    const app = script();
    const email = { ...payload, destination: 'email', recipient: 'attacker@example.com' };
    app.post(email); app.post(email);
    expect(app.sent).toHaveBeenCalledTimes(1);
    expect(app.sent.mock.calls[0][0]).toBe('owner@example.com');
  });
});
