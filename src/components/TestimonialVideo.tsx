import { useRef, useState } from "react";
import { Play } from "lucide-react";
import type { Language } from "@/lib/routing";

/**
 * Vertical testimonial video. Nothing but the poster loads until the visitor
 * clicks play; then the video plays with sound and captions in the page's
 * language (the others stay selectable in the player).
 */

type TestimonialVideoProps = {
  lang: Language;
  /** Base path without extension, e.g. "/videos/mr-edp-90s". */
  base: string;
  poster: string;
  label: string;
  durationLabel?: string;
  className?: string;
};

const TRACKS: Array<{ lang: Language; srclang: string; label: string }> = [
  { lang: "pt", srclang: "pt-BR", label: "Português" },
  { lang: "en", srclang: "en", label: "English" },
  { lang: "es", srclang: "es", label: "Español" },
];

export default function TestimonialVideo({ lang, base, poster, label, durationLabel, className = "" }: TestimonialVideoProps) {
  const ref = useRef<HTMLVideoElement>(null);
  const [started, setStarted] = useState(false);

  const start = () => {
    setStarted(true);
    // Wait for React to render the <video> with its tracks, then play.
    requestAnimationFrame(() => {
      const v = ref.current;
      if (!v) return;
      showOnlyPageLanguage(v);
      void v.play();
    });
  };

  // Browsers may enable more than one track on their own; keep exactly one.
  const showOnlyPageLanguage = (v: HTMLVideoElement) => {
    const wanted = TRACKS.find((x) => x.lang === lang)?.srclang;
    for (const t of Array.from(v.textTracks)) {
      t.mode = t.language === wanted ? "showing" : "disabled";
    }
  };

  return (
    <div className={`relative aspect-[9/16] w-full overflow-hidden rounded-2xl bg-black shadow-lg ${className}`}>
      {started ? (
        <video
          ref={ref}
          src={`${base}.mp4`}
          poster={poster}
          controls
          playsInline
          preload="metadata"
          crossOrigin="anonymous"
          className="h-full w-full object-cover"
          aria-label={label}
          onLoadedMetadata={(e) => showOnlyPageLanguage(e.currentTarget)}
        >
          {TRACKS.map((t) => (
            <track
              key={t.lang}
              kind="subtitles"
              src={`${base}.${t.lang}.vtt`}
              srcLang={t.srclang}
              label={t.label}
              default={t.lang === lang}
            />
          ))}
        </video>
      ) : (
        <button
          type="button"
          onClick={start}
          className="group absolute inset-0 h-full w-full text-left focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-accent"
          aria-label={label}
        >
          <img src={poster} alt="" loading="lazy" decoding="async" className="h-full w-full object-cover" />
          <span className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" aria-hidden />
          <span className="absolute left-1/2 top-1/2 flex h-16 w-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-accent text-accent-foreground shadow-xl transition-transform group-hover:scale-105">
            <Play className="ml-1 h-7 w-7" aria-hidden />
          </span>
          {durationLabel && (
            <span className="absolute bottom-4 left-4 rounded-full bg-black/60 px-3 py-1 text-xs font-medium text-white">
              {durationLabel}
            </span>
          )}
        </button>
      )}
    </div>
  );
}
