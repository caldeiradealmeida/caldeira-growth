import { describe, expect, it, vi } from "vitest";
import {
  CRM_BASE_PATH,
  CRM_LOGIN_PATH,
  clearAuthFragment,
  describeAuthError,
  parseAuthFragment,
  resolveAuthLanding,
} from "./authRedirect";

const SESSAO =
  "#access_token=eyJhbGciOi.SEGREDO.xxx&expires_at=1787700000&expires_in=3600" +
  "&refresh_token=abc123&token_type=bearer&type=magiclink";

const EXPIRADO =
  "#error=access_denied&error_code=otp_expired&error_description=Email+link+is+invalid+or+has+expired";

describe("reconhecer o fragmento do magic link", () => {
  it("sessão exige os dois tokens juntos", () => {
    expect(parseAuthFragment(SESSAO)).toEqual({ kind: "session" });
    // Um sozinho não basta -- é o que impede confundir com outros fragmentos.
    expect(parseAuthFragment("#access_token=x")).toBeNull();
    expect(parseAuthFragment("#refresh_token=x")).toBeNull();
  });

  it("erro do callback é reconhecido", () => {
    expect(parseAuthFragment(EXPIRADO)).toEqual({
      kind: "error",
      code: "otp_expired",
      description: "Email link is invalid or has expired",
    });
  });

  it("NÃO confunde os fragmentos do CGI com autenticação", () => {
    // Se confundisse, abrir um relatório mandaria a pessoa para o CRM.
    expect(parseAuthFragment("#t=token-do-relatorio-abcdefghij")).toBeNull();
    expect(parseAuthFragment("#t=token-de-contato-abcdefghij")).toBeNull();
    expect(parseAuthFragment("")).toBeNull();
    expect(parseAuthFragment("#")).toBeNull();
    expect(parseAuthFragment("#secao=metodologia")).toBeNull();
  });
});

describe("para onde levar o fragmento que pousou errado", () => {
  it("sessão que caiu na home vai para o CRM", () => {
    expect(resolveAuthLanding("/", SESSAO)).toBe(CRM_BASE_PATH);
  });

  it("qualquer outra rota do site também encaminha", () => {
    for (const rota of ["/sobre", "/consultoria", "/en", "/artigos/algum-post"]) {
      expect(resolveAuthLanding(rota, SESSAO)).toBe(CRM_BASE_PATH);
    }
  });

  it("link expirado vai para o login, não para a home", () => {
    expect(resolveAuthLanding("/", EXPIRADO)).toBe(CRM_LOGIN_PATH);
  });

  it("dentro do CRM não mexe: ali o próprio Supabase trata", () => {
    expect(resolveAuthLanding("/admin/crm", SESSAO)).toBeNull();
    expect(resolveAuthLanding("/admin/crm/login", SESSAO)).toBeNull();
    expect(resolveAuthLanding("/admin/crm/leads/abc", SESSAO)).toBeNull();
  });

  it("sem fragmento de autenticação, nada acontece em rota nenhuma", () => {
    expect(resolveAuthLanding("/", "")).toBeNull();
    expect(resolveAuthLanding("/cgi/relatorio", "#t=token-do-relatorio")).toBeNull();
    expect(resolveAuthLanding("/cgi/descadastrar", "#t=token-de-contato")).toBeNull();
  });
});

describe("limpar a barra", () => {
  function janela(pathname: string, hash: string) {
    const replaceState = vi.fn();
    return {
      win: {
        location: { pathname, search: "", hash },
        history: { state: null, replaceState },
      } as unknown as Window,
      replaceState,
    };
  }

  it("tira o fragmento sem recarregar e sem nova entrada no histórico", () => {
    const { win, replaceState } = janela("/admin/crm", SESSAO);
    clearAuthFragment(win);
    expect(replaceState).toHaveBeenCalledWith(null, "", "/admin/crm");
  });

  it("preserva a query string", () => {
    const replaceState = vi.fn();
    const win = {
      location: { pathname: "/admin/crm", search: "?filtro=grandes", hash: SESSAO },
      history: { state: null, replaceState },
    } as unknown as Window;
    clearAuthFragment(win);
    expect(replaceState).toHaveBeenCalledWith(null, "", "/admin/crm?filtro=grandes");
  });

  it("não mexe quando não há fragmento de autenticação", () => {
    const { win, replaceState } = janela("/cgi/relatorio", "#t=token-do-relatorio");
    clearAuthFragment(win);
    expect(replaceState).not.toHaveBeenCalled();
  });

  it("é idempotente: chamar de novo depois de limpo não faz nada", () => {
    const { win, replaceState } = janela("/admin/crm", "");
    clearAuthFragment(win);
    clearAuthFragment(win);
    expect(replaceState).not.toHaveBeenCalled();
  });

  it("nunca coloca o token numa query string", () => {
    const { win, replaceState } = janela("/admin/crm", SESSAO);
    clearAuthFragment(win);
    const url = String(replaceState.mock.calls[0][2]);
    expect(url).not.toContain("access_token");
    expect(url).not.toContain("SEGREDO");
    expect(url).not.toContain("?");
  });
});

describe("mensagem de erro para o humano", () => {
  it("link expirado tem mensagem própria", () => {
    expect(describeAuthError(parseAuthFragment(EXPIRADO))).toBe(
      "Este link de acesso expirou. Peça um novo abaixo."
    );
  });

  it("erro desconhecido não expõe o texto cru do Supabase", () => {
    const msg = describeAuthError(parseAuthFragment("#error_code=algo_estranho"));
    expect(msg).toBe("Não foi possível concluir o acesso. Peça um novo link abaixo.");
  });

  it("sessão válida não é erro", () => {
    expect(describeAuthError(parseAuthFragment(SESSAO))).toBeNull();
    expect(describeAuthError(null)).toBeNull();
  });
});
