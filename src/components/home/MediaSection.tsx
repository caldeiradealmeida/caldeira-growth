import { ExternalLink, Play } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { content } from "@/data/content";
import { useMediaItems } from "@/hooks/useMediaItems";
import {
  MEDIA_TYPE_LABEL,
  mediaFeatureLang,
  mediaFeatures,
  type MediaFeature,
} from "@/data/mediaFeatures";
import { cn } from "@/lib/utils";
import { sectionLayout } from "@/lib/sectionLayout";
import { pushDataLayerEvent } from "@/lib/analytics";
import SectionHeader from "@/components/layout/SectionHeader";

type MediaSectionProps = {
  variant?: "home" | "page";
};

/**
 * Itens da planilha que ainda não estão na curadoria versionada entram no fim
 * da lista, sem imagem e como "Artigo". Assim a edição remota continua
 * funcionando sem sobrescrever a curadoria (ver comentário em mediaFeatures.ts).
 */
function useCombinedMediaFeatures(): MediaFeature[] {
  const { data: sheetItems } = useMediaItems();
  const curatedUrls = new Set(mediaFeatures.map((item) => item.url));

  const extras: MediaFeature[] = (sheetItems ?? [])
    .filter((item) => !curatedUrls.has(item.url))
    .map((item) => ({
      id: `sheet-${item.id}`,
      outlet: item.outlet,
      title: item.title,
      url: item.url,
      type: "article" as const,
    }));

  return [...mediaFeatures, ...extras];
}

export default function MediaSection({ variant = "home" }: MediaSectionProps) {
  const { lang } = useLanguage();
  const textLang = mediaFeatureLang(lang);
  const labelLang = (lang === "pt" || lang === "en" ? lang : "es") as "pt" | "en" | "es";
  const c = content[lang].media;
  const items = useCombinedMediaFeatures();

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
          {variant === "page" ? (
            <header>
              <h1 className={sectionLayout.title}>{c.title}</h1>
              {c.subtitle ? (
                <p className={sectionLayout.subtitle}>{c.subtitle}</p>
              ) : null}
            </header>
          ) : (
            <SectionHeader title={c.title} subtitle={c.subtitle} />
          )}
        </div>
        {lang === "es" ? (
          <div className="border-t border-border/60 pt-8 max-w-2xl">
            <p className="text-base leading-relaxed text-foreground/85">
              La versión en español de esta sección está preparada, pero las
              publicaciones individuales aún están en revisión editorial.
            </p>
          </div>
        ) : (
          <div className={`grid md:grid-cols-3 ${sectionLayout.cardsGap}`}>
            {items.map((item, index) => (
              <a
                key={item.id}
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() =>
                  pushDataLayerEvent("media_click", {
                    outlet: item.outlet,
                    content_type: item.type,
                    title: item.title.pt,
                    position: index + 1,
                  })
                }
                className="group flex flex-col overflow-hidden rounded-xl border border-border bg-card shadow-sm transition-all duration-300 hover:border-primary/15 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background motion-reduce:transition-none"
              >
                {item.image ? (
                  <div className="relative aspect-[16/9] w-full overflow-hidden bg-muted/50">
                    <img
                      src={item.image}
                      alt=""
                      width={1200}
                      height={675}
                      loading="lazy"
                      decoding="async"
                      className="h-full w-full object-cover"
                    />
                    {item.isVideo ? (
                      <span
                        aria-hidden
                        className="absolute bottom-3 left-3 flex h-8 w-8 items-center justify-center rounded-full bg-background/85 ring-1 ring-border/70"
                      >
                        <Play className="h-3.5 w-3.5 translate-x-[1px] fill-foreground text-foreground" />
                      </span>
                    ) : null}
                    {item.overlayLabel ? (
                      <span className="absolute bottom-3 right-3 rounded-md bg-background/90 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-foreground/80 ring-1 ring-border/60">
                        {item.overlayLabel}
                      </span>
                    ) : null}
                  </div>
                ) : null}

                <div className="border-b border-border/60 px-6 pb-2 pt-6">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                    {item.outlet}
                    <span className="mx-2 text-border">·</span>
                    <span className="font-medium normal-case tracking-normal">
                      {MEDIA_TYPE_LABEL[item.type][labelLang]}
                    </span>
                  </p>
                </div>
                <div className="flex flex-1 flex-col px-6 py-5">
                  <h3 className="flex flex-1 gap-2 text-[15px] font-semibold leading-snug text-foreground transition-colors group-hover:text-primary motion-reduce:transition-none">
                    <span className="flex-1">{item.title[textLang]}</span>
                    <ExternalLink className="mt-0.5 h-4 w-4 shrink-0 opacity-40 group-hover:opacity-70" />
                  </h3>
                </div>
              </a>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
