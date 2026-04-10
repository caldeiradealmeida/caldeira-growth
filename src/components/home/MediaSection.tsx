import { ExternalLink } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { content } from "@/data/content";
import { mediaItems } from "@/data/media";
import { cn } from "@/lib/utils";

type MediaSectionProps = {
  /** Extra top offset when used below fixed header (standalone page). */
  variant?: "home" | "page";
};

export default function MediaSection({ variant = "home" }: MediaSectionProps) {
  const { lang } = useLanguage();
  const c = content[lang].media;

  return (
    <section
      className={cn(
        "bg-background pb-24 md:pb-32",
        variant === "page" ? "pt-28 md:pt-32" : "pt-24 md:pt-32"
      )}
    >
      <div className="container mx-auto px-4">
        <div className="max-w-5xl mx-auto">
          <div className="mb-16 md:mb-20">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4 tracking-tight">
              {c.title}
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl leading-relaxed">
              {c.subtitle}
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-6 md:gap-8">
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
      </div>
    </section>
  );
}
