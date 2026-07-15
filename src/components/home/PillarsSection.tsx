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
import { sectionLayout } from "@/lib/sectionLayout";
import SectionHeader from "@/components/layout/SectionHeader";

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
        sectionLayout.sectionY,
        "border-y border-border",
        subtle ? "bg-muted/15 border-border/60" : "bg-muted/30"
      )}
    >
      <div className={sectionLayout.container}>
        <div className={sectionLayout.headerToContent}>
          <SectionHeader title={c.title} subtitle={c.subtitle} />
        </div>

        <div
          className={cn(
            "grid sm:grid-cols-2 xl:grid-cols-4",
            sectionLayout.cardsGap
          )}
        >
          {pillarsConfig.map((item) => {
            const { key, icon: Icon } = item;
            const pillar = c[key];
            const desc =
              key === "pathToGrow"
                ? c.pathToGrow.shortDescription
                : pillar.description;
            const cardClass = cn(
              "group flex flex-col h-full rounded-2xl transition-colors duration-300",
              subtle
                ? "bg-background/60 border border-border/50 p-6 md:p-7 min-h-[268px] shadow-none hover:border-border"
                : "bg-card border border-border p-7 md:p-8 min-h-[280px] shadow-sm hover:shadow-md hover:border-primary/15 transition-all duration-300 hover:-translate-y-0.5"
            );
            const inner = (
              <>
                <div
                  className={cn(
                    "rounded-lg bg-primary/10 text-primary flex items-center justify-center group-hover:bg-primary/15 transition-colors shrink-0 mb-4",
                    subtle ? "h-9 w-9" : "h-11 w-11"
                  )}
                >
                  <Icon className={subtle ? "h-4 w-4" : "h-5 w-5"} />
                </div>
                <h3 className="font-semibold text-foreground mb-3 leading-snug text-base md:text-[17px]">
                  {pillar.title}
                </h3>
                <p
                  className={cn(
                    "text-muted-foreground leading-relaxed flex-1 text-sm",
                    subtle && "text-[13px]"
                  )}
                >
                  {desc}
                </p>
                {key === "pathToGrow" && (
                  <p className="text-xs text-muted-foreground/90 mt-auto pt-4 border-t border-border font-medium tracking-wide">
                    {c.pathToGrow.micro}
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
