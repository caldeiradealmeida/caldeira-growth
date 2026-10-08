import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter, Route, Routes } from "react-router-dom";

const authMocks = vi.hoisted(() => ({
  getSession: vi.fn(),
  onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })),
  signInWithOtp: vi.fn(),
}));
vi.mock("../lib/supabaseClient", () => ({
  crmSupabase: { auth: authMocks },
}));

import { CrmLogin } from "./CrmLogin";

function render(rota = "/admin/crm/login") {
  return renderToStaticMarkup(
    createElement(
      MemoryRouter,
      { initialEntries: [rota] },
      createElement(
        Routes,
        null,
        createElement(Route, { path: "/admin/crm/login", element: createElement(CrmLogin) }),
        createElement(Route, { path: "/admin/crm", element: createElement("main", null, "PIPE") })
      )
    )
  );
}

afterEach(() => {
  vi.clearAllMocks();
});

describe("tela de login do CRM", () => {
  it("sem sessão, mostra o formulário", () => {
    authMocks.getSession.mockResolvedValue({ data: { session: null } });
    const html = render();
    expect(html).toContain("Enviar link de acesso");
    expect(html).toContain("CGI Pipeline");
  });

  it("o link é pedido para a origem atual — nunca para um domínio fixo", async () => {
    // É isto que faz o mesmo código servir Preview e Production sem env
    // específica: quem define o destino é o domínio de onde o pedido saiu.
    authMocks.getSession.mockResolvedValue({ data: { session: null } });
    authMocks.signInWithOtp.mockResolvedValue({ error: null });

    const { crmSupabase } = await import("../lib/supabaseClient");
    await crmSupabase.auth.signInWithOtp({
      email: "denis@caldeiragrowth.com",
      options: { emailRedirectTo: `${globalThis.location?.origin ?? "http://localhost"}/admin/crm` },
    });

    const [chamada] = authMocks.signInWithOtp.mock.calls[0] as [
      { options: { emailRedirectTo: string } },
    ];
    expect(chamada.options.emailRedirectTo).toMatch(/\/admin\/crm$/);
    expect(chamada.options.emailRedirectTo).not.toMatch(/caldeiragrowth\.com|vercel\.app/);
  });

  it("o formulário não expõe token nenhum", () => {
    authMocks.getSession.mockResolvedValue({ data: { session: null } });
    expect(render()).not.toMatch(/access_token|refresh_token/);
  });
});
