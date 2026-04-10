import { useLanguage } from "@/contexts/LanguageContext";
import { content } from "@/data/content";
import { cn } from "@/lib/utils";

export default function GrowthApproachSection() {
  const { lang } = useLanguage();
  const c = content[lang].growthApproach;
  const points = [c.point1, c.point2, c.point3];

  return (
    <section className="py-20 md:py-28 bg-background">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-8">
            {c.title}
          </h2>
          <p className="text-xl text-muted-foreground leading-relaxed mb-12 whitespace-pre-line">
            {c.intro}
          </p>
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
                <p className="text-lg text-foreground leading-relaxed pt-0.5">
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
