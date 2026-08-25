import { afterEach, describe, expect, it, vi } from "vitest";
import {
  grantMarketingConsentByToken,
  readContactTokenFromHash,
  revokeMarketingConsentByToken,
} from "./marketingConsent";

const TOKEN = "token-com-tamanho-suficiente";

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

function mockFetch(ok = true) {
  const f = vi.fn(async () => new Response("", { status: ok ? 200 : 500 }));
  vi.stubGlobal("fetch", f);
  return f;
}

describe("token vem do fragmento, nunca da query", () => {
  it("lê #t=", () => {
    expect(readContactTokenFromHash("#t=" + TOKEN)).toBe(TOKEN);
    expect(readContactTokenFromHash("t=" + TOKEN)).toBe(TOKEN);
  });

  it("recusa ausência, lixo e token curto", () => {
    for (const hash of ["", "#", "#outra=coisa", "#t=", "#t=curto"]) {
      expect(readContactTokenFromHash(hash)).toBeNull();
    }
  });
});

describe("descadastro", () => {
  it("chama a RPC de opt-out com o token", async () => {
    const f = mockFetch();
    const r = await revokeMarketingConsentByToken(TOKEN);

    expect(r).toBe("ok");
    const [url, init] = f.mock.calls[0] as [string, RequestInit];
    expect(url).toContain("/rest/v1/rpc/cgi_marketing_optout");
    expect(JSON.parse(String(init.body))).toEqual({ p_token: TOKEN });
  });

  it("é idempotente do ponto de vista da tela: duas chamadas, dois 'ok'", async () => {
    mockFetch();
    expect(await revokeMarketingConsentByToken(TOKEN)).toBe("ok");
    expect(await revokeMarketingConsentByToken(TOKEN)).toBe("ok");
  });

  it("token inválido nem chega a chamar o servidor", async () => {
    const f = mockFetch();
    expect(await revokeMarketingConsentByToken("curto")).toBe("invalid_link");
    expect(f).not.toHaveBeenCalled();
  });

  it("falha de rede não vira exceção, e não vira sucesso", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => { throw new Error("offline"); }));
    expect(await revokeMarketingConsentByToken(TOKEN)).toBe("unavailable");
  });

  it("RPC ausente (404, antes da migration) também é 'unavailable', nunca 'ok'", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response("", { status: 404 })));
    expect(await revokeMarketingConsentByToken(TOKEN)).toBe("unavailable");
  });

  it("não manda e não recebe dado pessoal nenhum", async () => {
    const f = mockFetch();
    await revokeMarketingConsentByToken(TOKEN);
    const [, init] = f.mock.calls[0] as [string, RequestInit];
    const corpo = String(init.body);
    expect(corpo).not.toMatch(/@/);
    expect(Object.keys(JSON.parse(corpo))).toEqual(["p_token"]);
  });
});

describe("opt-in por link de e-mail", () => {
  it("chama a RPC de opt-in declarando a origem", async () => {
    const f = mockFetch();
    const r = await grantMarketingConsentByToken(TOKEN, "report_email");

    expect(r).toBe("ok");
    const [url, init] = f.mock.calls[0] as [string, RequestInit];
    expect(url).toContain("/rest/v1/rpc/cgi_marketing_optin");
    expect(JSON.parse(String(init.body))).toEqual({ p_token: TOKEN, p_source: "report_email" });
  });

  it("a origem é sempre declarada — consentimento não é inferido", async () => {
    const f = mockFetch();
    await grantMarketingConsentByToken(TOKEN, "cgi_report");
    const [, init] = f.mock.calls[0] as [string, RequestInit];
    expect(JSON.parse(String(init.body)).p_source).toBe("cgi_report");
  });

  it("token inválido não vira opt-in", async () => {
    const f = mockFetch();
    expect(await grantMarketingConsentByToken("", "report_email")).toBe("invalid_link");
    expect(f).not.toHaveBeenCalled();
  });
});
