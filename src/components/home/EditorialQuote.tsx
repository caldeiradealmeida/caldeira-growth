import { sectionLayout } from "@/lib/sectionLayout";

type EditorialQuoteProps = {
  quote: string;
  attribution: string;
};

/**
 * Interlúdio editorial — sem card, fundo nem grid; citação contínua ao fluxo da página.
 */
export default function EditorialQuote({ quote, attribution }: EditorialQuoteProps) {
  return (
    <div className={`${sectionLayout.sectionY} bg-background`}>
      <div className={sectionLayout.container}>
        <figure className={`${sectionLayout.prose} border-l border-primary/20 pl-6 md:pl-8`}>
          <blockquote>
            <p className="text-lg md:text-xl text-foreground/90 leading-relaxed italic font-normal">
              {quote}
            </p>
          </blockquote>
          <figcaption className="mt-5 text-sm text-muted-foreground leading-relaxed">
            {attribution}
          </figcaption>
        </figure>
      </div>
    </div>
  );
}
