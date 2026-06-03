import { ExternalLink } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { content } from "@/data/content";
import { useMediaItems } from "@/hooks/useMediaItems";
import { cn } from "@/lib/utils";
import { sectionLayout } from "@/lib/sectionLayout";
import SectionHeader from "@/components/layout/SectionHeader";

type MediaSectionProps = {
  variant?: "home" | "page";
};

export default function MediaSection({ variant = "home" }: MediaSectionProps) {
  const { lang } = useLanguage();
  const c = content[lang].media;
  const { data: mediaItems } = useMediaItems();

  return (
    <section
      className={cn(
        "bg-background",
        variant === "page"
          ? "pt-28 md:pt-32 pb-24 md:pb-32"
          : sectionLayout.sectionY
      )}
    >
      <div className={sectionLayout.container}>
        <div className={sectionLayout.headerToContent}>
          <SectionHeader title={c.title} subtitle={c.subtitle} />
        </div>
        <div className={`grid md:grid-cols-3 ${sectionLayout.cardsGap}`}>
          {mediaItems.map((item) => (
            <a
              key={item.id}
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => {
                if (
                  item.url.startsWith("http") &&
                  !e.ctrlKey &&
                  !e.metaKey &&
                  !e.shiftKey
                ) {
                  e.preventDefault();
                  window.open(item.url, "_blank", "noopener,noreferrer");
                }
              }}
              className="group flex flex-col bg-card border border-border rounded-xl overflow-hidden shadow-sm hover:shadow-md hover:border-primary/15 transition-all duration-300 hover:-translate-y-0.5"
            >
              <div className="px-6 pt-6 pb-2 border-b border-border/60">
                <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                  {item.outlet}
                </p>
              </div>
              <div className="px-6 py-5 flex-1 flex flex-col">
                <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors text-[15px] leading-snug flex-1 flex gap-2">
                  <span className="flex-1">{item.title[lang]}</span>
                  <ExternalLink className="h-4 w-4 shrink-0 mt-0.5 opacity-40 group-hover:opacity-70" />
                </h3>
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
