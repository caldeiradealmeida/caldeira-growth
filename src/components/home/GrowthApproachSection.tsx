import { useLanguage } from "@/contexts/LanguageContext";
import { content } from "@/data/content";
import { cn } from "@/lib/utils";
import { sectionLayout } from "@/lib/sectionLayout";

export default function GrowthApproachSection() {
  const { lang } = useLanguage();
  const c = content[lang].growthApproach;
  const points = [c.point1, c.point2, c.point3];

  return (
    <section className={`${sectionLayout.sectionY} bg-background`}>
      <div className={sectionLayout.container}>
        <div className={sectionLayout.prose}>
          <div className={sectionLayout.headerToContent}>
            <h2 className={sectionLayout.title}>{c.title}</h2>
            <p
              className={`${sectionLayout.subtitle} whitespace-pre-line`}
            >
              {c.intro}
            </p>
          </div>
          <ul className="space-y-8">
            {points.map((point, i) => (
              <li key={i} className="flex gap-4">
                <span
                  className={cn(
                    "shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold",
                    "bg-primary text-primary-foreground"
                  )}
                >
                  {i + 1}
                </span>
                <p className="text-base md:text-lg text-foreground leading-relaxed pt-0.5">
                  {point}
                </p>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
