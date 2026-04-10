import { useLanguage } from "@/contexts/LanguageContext";
import { content } from "@/data/content";

export default function BoardSection() {
  const { lang } = useLanguage();
  const b = content[lang].consultingPage.board;

  return (
    <section className="py-24 md:py-32 bg-muted/[0.35] border-y border-border/50">
      <div className="container mx-auto px-4">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground tracking-tight mb-10 md:mb-12">
            {b.title}
          </h2>
          <div className="space-y-6 mb-12 md:mb-14">
            {b.paragraphs.map((para, idx) => (
              <p
                key={idx}
                className="text-base md:text-[17px] leading-[1.75] text-foreground/88"
              >
                {para}
              </p>
            ))}
          </div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground mb-5">
            {b.formatsTitle}
          </p>
          <ul className="space-y-4">
            {b.formats.map((line) => (
              <li
                key={line}
                className="text-sm md:text-base text-foreground/85 leading-relaxed border-b border-border/45 pb-4 last:border-0 last:pb-0"
              >
                {line}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
