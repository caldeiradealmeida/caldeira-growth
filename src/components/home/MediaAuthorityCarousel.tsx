import { useEffect, useState } from "react";
import { ExternalLink, Play } from "lucide-react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { useLanguage } from "@/contexts/LanguageContext";
import { sectionLayout } from "@/lib/sectionLayout";
import { pushDataLayerEvent } from "@/lib/analytics";
import {
  MEDIA_TYPE_LABEL,
  featuredMediaFeatures,
  mediaFeatureLang,
  type MediaFeature,
} from "@/data/mediaFeatures";

/** Proporção fixa dos cards — evita layout shift antes da imagem carregar. */
const IMAGE_WIDTH = 1200;
const IMAGE_HEIGHT = 675;

const copy = {
  pt: {
    kicker: "Na mídia",
    title: "Caldeira Growth na mídia",
    previous: "Ver matérias anteriores",
    next: "Ver próximas matérias",
    region: "Matérias e entrevistas na imprensa",
  },
  en: {
    kicker: "In the media",
    title: "Caldeira Growth in the media",
    previous: "See previous stories",
    next: "See next stories",
    region: "Press coverage and interviews",
  },
  es: {
    kicker: "En los medios",
    title: "Caldeira Growth en los medios",
    previous: "Ver notas anteriores",
    next: "Ver próximas notas",
    region: "Cobertura de prensa y entrevistas",
  },
} as const;

function usePrefersReducedMotion() {
  const [prefersReduced, setPrefersReduced] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) {
      return;
    }

    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReduced(query.matches);

    const onChange = (event: MediaQueryListEvent) => setPrefersReduced(event.matches);
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
  }, []);

  return prefersReduced;
}

function MediaCard({
  item,
  position,
  textLang,
  labelLang,
}: {
  item: MediaFeature;
  position: number;
  textLang: "pt" | "en";
  labelLang: "pt" | "en" | "es";
}) {
  const title = item.title[textLang];
  const typeLabel = MEDIA_TYPE_LABEL[item.type][labelLang];

  return (
    <a
      href={item.url}
      target="_blank"
      rel="noopener noreferrer"
      onClick={() =>
        pushDataLayerEvent("media_click", {
          outlet: item.outlet,
          content_type: item.type,
          title: item.title.pt,
          position,
        })
      }
      className="group flex h-full flex-col overflow-hidden rounded-xl border border-border bg-card shadow-sm transition-all duration-300 hover:border-primary/15 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background motion-reduce:transition-none"
    >
      <div className="relative aspect-[16/9] w-full overflow-hidden bg-muted/50">
        {item.image ? (
          <img
            src={item.image}
            alt=""
            width={IMAGE_WIDTH}
            height={IMAGE_HEIGHT}
            loading="lazy"
            decoding="async"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.02] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center border-b border-border/60 bg-muted/40 px-6">
            <span className="text-center text-sm font-semibold uppercase tracking-[0.16em] text-muted-foreground/70">
              {item.outlet}
            </span>
          </div>
        )}

        {item.isVideo ? (
          <span
            aria-hidden
            className="absolute bottom-3 left-3 flex h-9 w-9 items-center justify-center rounded-full bg-background/85 ring-1 ring-border/70 backdrop-blur-sm"
          >
            <Play className="h-4 w-4 translate-x-[1px] fill-foreground text-foreground" />
          </span>
        ) : null}
      </div>

      <div className="flex flex-1 flex-col px-6 py-5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          {item.outlet}
          <span className="mx-2 text-border">·</span>
          <span className="font-medium normal-case tracking-normal">{typeLabel}</span>
        </p>
        <h3 className="mt-3 flex flex-1 gap-2 text-[15px] font-semibold leading-snug text-foreground transition-colors group-hover:text-primary motion-reduce:transition-none">
          <span className="flex-1">{title}</span>
          <ExternalLink className="mt-0.5 h-4 w-4 shrink-0 opacity-40 group-hover:opacity-70" />
        </h3>
      </div>
    </a>
  );
}

export default function MediaAuthorityCarousel() {
  const { lang } = useLanguage();
  const textLang = mediaFeatureLang(lang);
  const labelLang = (lang === "pt" || lang === "en" ? lang : "es") as "pt" | "en" | "es";
  const c = copy[labelLang];
  const prefersReducedMotion = usePrefersReducedMotion();

  if (featuredMediaFeatures.length === 0) {
    return null;
  }

  return (
    <section className={`${sectionLayout.sectionY} bg-muted/[0.28] border-y border-border/60`}>
      <div className={sectionLayout.container}>
        <Carousel
          opts={{
            align: "start",
            loop: false,
            duration: prefersReducedMotion ? 0 : 25,
          }}
          aria-label={c.region}
        >
          <div className="mb-12 flex items-end justify-between gap-6 md:mb-14">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
                {c.kicker}
              </p>
              <h2 className={`${sectionLayout.title} mt-4`}>{c.title}</h2>
            </div>
            <div className="relative hidden shrink-0 items-center gap-2 sm:flex">
              <CarouselPrevious
                className="static translate-y-0 border-border/70 text-foreground/70 hover:text-foreground"
                aria-label={c.previous}
              />
              <CarouselNext
                className="static translate-y-0 border-border/70 text-foreground/70 hover:text-foreground"
                aria-label={c.next}
              />
            </div>
          </div>

          <CarouselContent className="-ml-6">
            {featuredMediaFeatures.map((item, index) => (
              <CarouselItem
                key={item.id}
                className="basis-[86%] pl-6 sm:basis-1/2 lg:basis-1/3"
              >
                <MediaCard
                  item={item}
                  position={index + 1}
                  textLang={textLang}
                  labelLang={labelLang}
                />
              </CarouselItem>
            ))}
          </CarouselContent>
        </Carousel>
      </div>
    </section>
  );
}
