import { describe, expect, it, vi } from "vitest";

const supabaseMocks = vi.hoisted(() => ({
  setContactTokenHash: vi.fn(async () => true),
  logSupabaseFailure: vi.fn(),
}));
vi.mock("../../api/_cgi-supabase.js", () => supabaseMocks);

import {
  contactTokenHash,
  deriveContactToken,
  ensureContactToken,
  isContactTokenConfigured,
} from "../../api/_cgi-contact-token";

const SEGREDO = { CGI_CONTACT_TOKEN_SECRET: "s".repeat(48) };

describe("token de contato — o mesmo link vale para sempre", () => {
  it("o mesmo lead produz sempre o mesmo token", () => {
    const a = deriveContactToken("lead_1", SEGREDO);
    const b = deriveContactToken("lead_1", SEGREDO);
    expect(a).toBe(b);
    expect(a).toBeTruthy();
  });

  it("leads diferentes produzem tokens diferentes", () => {
    expect(deriveContactToken("lead_1", SEGREDO)).not.toBe(deriveContactToken("lead_2", SEGREDO));
  });

  it("o token não contém o lead_id nem nenhum dado da pessoa", () => {
    const token = String(deriveContactToken("lead_1", SEGREDO));
    expect(token).not.toContain("lead_1");
    expect(token).not.toContain("@");
  });

  it("só o hash é o que vai para o banco", async () => {
    const token = String(deriveContactToken("lead_1", SEGREDO));
    supabaseMocks.setContactTokenHash.mockClear();
    await ensureContactToken("lead_1", null, SEGREDO);

    const [, hashGravado] = supabaseMocks.setContactTokenHash.mock.calls[0] as [string, string];
    expect(hashGravado).toBe(contactTokenHash(token));
    expect(hashGravado).not.toBe(token);
    expect(hashGravado).toHaveLength(64);
  });

  it("regravar não invalida link ativo: o hash é sempre o mesmo", async () => {
    const token = String(deriveContactToken("lead_1", SEGREDO));
    supabaseMocks.setContactTokenHash.mockClear();
    await ensureContactToken("lead_1", null, SEGREDO);
    const primeiro = supabaseMocks.setContactTokenHash.mock.calls[0]?.[1];
    await ensureContactToken("lead_1", null, SEGREDO);
    const segundo = supabaseMocks.setContactTokenHash.mock.calls[1]?.[1];

    expect(primeiro).toBe(segundo);
    expect(await ensureContactToken("lead_1", contactTokenHash(token), SEGREDO)).toBe(token);
  });

  it("quando o hash já bate, nem escreve no banco", async () => {
    const token = String(deriveContactToken("lead_1", SEGREDO));
    supabaseMocks.setContactTokenHash.mockClear();
    await ensureContactToken("lead_1", contactTokenHash(token), SEGREDO);
    expect(supabaseMocks.setContactTokenHash).not.toHaveBeenCalled();
  });

  it("sem segredo configurado, tudo devolve null — fail-closed", async () => {
    expect(isContactTokenConfigured({})).toBe(false);
    expect(deriveContactToken("lead_1", {})).toBeNull();
    expect(await ensureContactToken("lead_1", null, {})).toBeNull();
  });

  it("segredo curto é tratado como ausente", () => {
    expect(isContactTokenConfigured({ CGI_CONTACT_TOKEN_SECRET: "curto" })).toBe(false);
    expect(deriveContactToken("lead_1", { CGI_CONTACT_TOKEN_SECRET: "curto" })).toBeNull();
  });

  it("falha ao gravar o hash não devolve token pela metade", async () => {
    supabaseMocks.setContactTokenHash.mockResolvedValueOnce(false);
    expect(await ensureContactToken("lead_1", null, SEGREDO)).toBeNull();
  });
});
