/** Landing oficial do livro */
export const BOOK_LANDING_URL = "https://www.crescaoudesapareca.com.br";

/**
 * Props padrão para links ao site do livro no site institucional:
 * nova aba preserva a navegação aqui; noopener/noreferrer por segurança.
 */
export const bookSiteLinkProps = {
  href: BOOK_LANDING_URL,
  target: "_blank" as const,
  rel: "noopener noreferrer" as const,
} as const;

/** Amazon — compra direta (rotas como /amazon, campanhas) */
export const BOOK_AMAZON_URL = "https://a.co/d/11Q3Kio";
