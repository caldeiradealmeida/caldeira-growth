/** Landing oficial do livro */
export const BOOK_LANDING_URL = "https://www.crescaoudesapareca.com.br";

export function openBookSiteInNewTab(event?: {
  preventDefault: () => void;
  stopPropagation?: () => void;
  nativeEvent?: { stopImmediatePropagation?: () => void };
}): void {
  event?.preventDefault();
  event?.stopPropagation?.();
  event?.nativeEvent?.stopImmediatePropagation?.();
  window.open(BOOK_LANDING_URL, "_blank", "noopener,noreferrer");
}

export function openBookSiteOnKeyboard(event: {
  key: string;
  preventDefault: () => void;
  stopPropagation?: () => void;
  nativeEvent?: { stopImmediatePropagation?: () => void };
}): void {
  if (event.key === "Enter" || event.key === " ") {
    openBookSiteInNewTab(event);
  }
}

/**
 * Props padrão para links ao site do livro no site institucional:
 * abre nova aba sem navegar a aba atual. Não usa href para evitar fallback
 * de navegação da aba original em navegadores/scripts que ainda processem o link.
 */
export const bookSiteLinkProps = {
  role: "link" as const,
  tabIndex: 0,
  "data-book-url": BOOK_LANDING_URL,
  onClick: openBookSiteInNewTab,
  onKeyDown: openBookSiteOnKeyboard,
} as const;

/** Amazon — compra direta (rotas como /amazon, campanhas) */
export const BOOK_AMAZON_URL = "https://a.co/d/11Q3Kio";
