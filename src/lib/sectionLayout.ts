/**
 * Caldeira Growth — sistema único de layout (home e páginas institucionais).
 *
 * CONTAINER: max-w-6xl mx-auto px-4
 * SEÇÃO: py-24 md:py-32
 * H2: text-3xl md:text-4xl font-semibold tracking-tight
 * Subtítulo: mt-4 text-base md:text-lg text-muted-foreground leading-relaxed max-w-2xl
 * Espaço header → conteúdo: mb-12 md:mb-14
 * Texto denso: max-w-3xl
 * Grids: gap-6 md:gap-8
 */
export const sectionLayout = {
  sectionY: "py-24 md:py-32",
  /** Container padrão (uma coluna útil alinhada em todo o site). */
  container: "max-w-6xl mx-auto px-4",
  prose: "max-w-3xl",
  title: "text-3xl md:text-4xl font-semibold tracking-tight text-foreground",
  subtitle:
    "mt-4 text-base md:text-lg text-muted-foreground leading-relaxed max-w-2xl",
  headerToContent: "mb-12 md:mb-14",
  cardsGap: "gap-6 md:gap-8",
} as const;
