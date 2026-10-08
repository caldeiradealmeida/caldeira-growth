// Pouso do magic link.
//
// O Supabase só redireciona para o `emailRedirectTo` pedido se aquela URL
// estiver na allow list de Redirect URLs do projeto. Quando não está, ele
// ignora o pedido e manda a pessoa para a Site URL -- a home -- levando o
// fragmento de autenticação junto. E na home o cliente do CRM nunca é
// carregado (o chunk é lazy e a rota é outra), então ninguém consome o
// fragmento: a sessão não se estabelece e o `#access_token=` fica à vista.
//
// Este módulo existe para que o pouso errado deixe de ser fatal. Ele não
// substitui a allow list -- em Preview, onde o domínio muda a cada deploy, só
// a allow list resolve --, mas garante que, uma vez que o fragmento chegue à
// nossa origem, ele termine no lugar certo.
//
// Puro de propósito: decide para onde ir a partir de (pathname, hash), sem
// tocar em window, para caber em teste.

export const CRM_BASE_PATH = "/admin/crm";
export const CRM_LOGIN_PATH = "/admin/crm/login";

export type AuthFragment =
  | { kind: "session" }
  | { kind: "error"; code: string | null; description: string | null };

function readParams(hash: string): URLSearchParams {
  return new URLSearchParams(String(hash || "").replace(/^#/, ""));
}

/** Reconhece SÓ fragmentos de autenticação do Supabase.
 *
 * A distinção importa: `/cgi/relatorio#t=...` e `/cgi/descadastrar#t=...`
 * também usam fragmento, e nenhum dos dois pode ser confundido com login. Por
 * isso a sessão exige os dois tokens juntos, e não só um campo solto. */
export function parseAuthFragment(hash: string): AuthFragment | null {
  const params = readParams(hash);

  if (params.get("access_token") && params.get("refresh_token")) {
    return { kind: "session" };
  }

  const error = params.get("error") || params.get("error_code");
  if (error) {
    return {
      kind: "error",
      code: params.get("error_code") || params.get("error"),
      description: params.get("error_description"),
    };
  }

  return null;
}

/** Para onde levar o fragmento que caiu no lugar errado. `null` = não mexer.
 *
 * Dentro do CRM devolve null de propósito: ali o cliente do Supabase é
 * carregado e trata o fragmento sozinho. */
export function resolveAuthLanding(pathname: string, hash: string): string | null {
  if (String(pathname || "").startsWith(CRM_BASE_PATH)) return null;

  const fragment = parseAuthFragment(hash);
  if (!fragment) return null;

  return fragment.kind === "session" ? CRM_BASE_PATH : CRM_LOGIN_PATH;
}

/** Tira o fragmento da barra sem recarregar e sem criar entrada no histórico.
 *
 * Idempotente e defensivo: o próprio supabase-js já limpa a URL quando
 * `detectSessionInUrl` roda naquela página, então na maior parte das vezes não
 * há nada a fazer aqui. Existe para o caso em que ele não rodou. */
export function clearAuthFragment(win: Window = window): void {
  if (!parseAuthFragment(win.location.hash)) return;
  const limpa = `${win.location.pathname}${win.location.search}`;
  win.history.replaceState(win.history.state, "", limpa);
}

/** Mensagem para o humano. O `error_description` do Supabase vem em inglês e
 * com underscores; não vale expor isso numa tela de acesso restrito. */
export function describeAuthError(fragment: AuthFragment | null): string | null {
  if (!fragment || fragment.kind !== "error") return null;
  if (fragment.code === "otp_expired") {
    return "Este link de acesso expirou. Peça um novo abaixo.";
  }
  if (fragment.code === "access_denied") {
    return "Este link de acesso não é mais válido. Peça um novo abaixo.";
  }
  return "Não foi possível concluir o acesso. Peça um novo link abaixo.";
}
