import { cn } from "@/lib/utils";
import { sectionLayout } from "@/lib/sectionLayout";

type SectionHeaderProps = {
  title: string;
  subtitle?: string;
  /** Padrão: esquerda (editorial). Central só quando fizer sentido (CTA, pilares). */
  align?: "left" | "center";
  className?: string;
};

export default function SectionHeader({
  title,
  subtitle,
  align = "left",
  className,
}: SectionHeaderProps) {
  return (
    <header
      className={cn(
        align === "center" && "text-center",
        align === "center" && "mx-auto max-w-3xl",
        className
      )}
    >
      <h2
        className={cn(sectionLayout.title, !subtitle && "mb-6")}
      >
        {title}
      </h2>
      {subtitle ? (
        <p
          className={cn(
            sectionLayout.subtitle,
            align === "center" && "mx-auto"
          )}
        >
          {subtitle}
        </p>
      ) : null}
    </header>
  );
}
