import {
  Briefcase,
  Mic2,
  BookOpen,
  GraduationCap,
  type LucideIcon,
} from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { content } from "@/data/content";
import { Link } from "react-router-dom";
import { bookSiteLinkProps } from "@/constants/book";
import { cn } from "@/lib/utils";

type PillarItem =
  | { key: "consulting" | "speaking" | "pathToGrow"; href: string; icon: LucideIcon }
  | { key: "book"; icon: LucideIcon };

const pillarsConfig: PillarItem[] = [
  { key: "consulting", href: "/consultoria", icon: Briefcase },
  { key: "speaking", href: "/palestras", icon: Mic2 },
  { key: "pathToGrow", href: "/path-to-grow", icon: GraduationCap },
  { key: "book", icon: BookOpen },
];

type PillarsSectionProps = {
  emphasis?: "default" | "subtle";
};

export default function PillarsSection({
  emphasis = "default",
}: PillarsSectionProps) {
  const { lang } = useLanguage();
  const c = content[lang].pillars;
  const subtle = emphasis === "subtle";

  return (
    <section
      className={cn(
        "py-20 md:py-28 border-y border-border",
        subtle ? "bg-muted/15 border-border/60" : "bg-muted/30"
      )}
    >
      <div className="container mx-auto px-4">
        <div
          className={cn(
            "max-w-3xl mx-auto text-center",
            subtle ? "mb-12 md:mb-14" : "mb-16 md:mb-20"
          )}
        >
          <h2
            className={cn(
              "text-foreground mb-3 tracking-tight",
              subtle
                ? "text-2xl md:text-3xl font-semibold"
                : "text-3xl md:text-4xl font-bold"
            )}
          >
            {c.title}
          </h2>
          <p
            className={cn(
              "text-muted-foreground leading-relaxed",
              subtle ? "text-sm md:text-base" : "text-lg"
            )}
          >
            {c.subtitle}
          </p>
        </div>

        <div
          className={cn(
            "grid sm:grid-cols-2 xl:grid-cols-4 max-w-6xl mx-auto",
            subtle ? "gap-5 md:gap-6" : "gap-6 md:gap-8"
          )}
        >
          {pillarsConfig.map((item) => {
            const { key, icon: Icon } = item;
            const pillar = c[key];
            const desc =
              key === "pathToGrow"
                ? pillar.shortDescription
                : pillar.description;
            const cardClass = cn(
              "group flex flex-col rounded-2xl transition-colors duration-300",
              subtle
                ? "bg-background/60 border border-border/50 p-6 md:p-7 min-h-[240px] shadow-none hover:border-border"
                : "bg-card border border-border p-7 md:p-8 shadow-sm hover:shadow-md hover:border-primary/15 transition-all duration-300 hover:-translate-y-0.5 min-h-[280px]"
            );
            const inner = (
              <>
                <div
                  className={cn(
                    "rounded-lg bg-primary/10 text-primary flex items-center justify-center group-hover:bg-primary/15 transition-colors shrink-0",
                    subtle ? "mb-4 w-9 h-9" : "mb-5 w-11 h-11"
                  )}
                >
                  <Icon className={subtle ? "h-4 w-4" : "h-5 w-5"} />
                </div>
                <h3
                  className={cn(
                    "font-semibold text-foreground mb-2 leading-snug",
                    subtle ? "text-base" : "text-lg mb-3"
                  )}
                >
                  {pillar.title}
                </h3>
                <p
                  className={cn(
                    "text-muted-foreground leading-relaxed flex-1",
                    subtle ? "text-[13px]" : "text-sm"
                  )}
                >
                  {desc}
                </p>
                {key === "pathToGrow" && (
                  <p className="text-xs text-muted-foreground/90 mt-4 pt-4 border-t border-border font-medium tracking-wide">
                    {pillar.micro}
                  </p>
                )}
              </>
            );
            return key === "book" ? (
              <a key="book" {...bookSiteLinkProps} className={cardClass}>
                {inner}
              </a>
            ) : (
              <Link key={key} to={item.href} className={cardClass}>
                {inner}
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
