/**
 * Social proof / client logos.
 * Logos displayed in grayscale/muted for elegant presentation on light background.
 */

export type LogoItem = {
  id: string;
  name: string;
  src: string;
  alt: string;
};

/**
 * Company/institution logos for "Empresas onde atuei".
 * Add logos here when you have real company assets (Google, Meta, Nasdaq, etc.).
 * Do NOT use Caldeira Growth logo — only external company logos.
 */
export const socialProofLogos: LogoItem[] = [];
