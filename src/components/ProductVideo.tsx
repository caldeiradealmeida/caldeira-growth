import { useRef, useState } from "react";
import { Play } from "lucide-react";
import { pushDataLayerEvent } from "@/lib/analytics";

/**
 * Horizontal product video (16:9). Only the poster loads until the visitor
 * clicks play. Pushes start / 50% / complete events to the GTM dataLayer so
 * campaigns can measure how much of the pitch was actually watched.
 */

type ProductVideoProps = {
  /** Path of the .mp4 under /public, e.g. "/videos/relay-produto.mp4". */
  src: string;
  poster: string;
  label: string;
  durationLabel?: string;
  /** Short id sent with every analytics event, e.g. "relay" or "board". */
  analyticsId: string;
  className?: string;
};

export default function ProductVideo({ src, poster, label, durationLabel, analyticsId, className = "" }: ProductVideoProps) {
  const ref = useRef<HTMLVideoElement>(null);
  const [started, setStarted] = useState(false);
  const reachedHalf = useRef(false);

  const start = () => {
    setStarted(true);
    pushDataLayerEvent("product_video_start", { product: analyticsId });
    requestAnimationFrame(() => {
      void ref.current?.play();
    });
  };

  const onTimeUpdate = () => {
    const v = ref.current;
    if (!v || reachedHalf.current || !v.duration) return;
    if (v.currentTime / v.duration >= 0.5) {
      reachedHalf.current = true;
      pushDataLayerEvent("product_video_50", { product: analyticsId });
    }
  };

  return (
    <div className={`relative aspect-video w-full overflow-hidden rounded-2xl bg-black shadow-lg ${className}`}>
      {started ? (
        <video
          ref={ref}
          src={src}
          poster={poster}
          controls
          playsInline
          preload="metadata"
          className="h-full w-full object-cover"
          aria-label={label}
          onTimeUpdate={onTimeUpdate}
          onEnded={() => pushDataLayerEvent("product_video_complete", { product: analyticsId })}
        />
      ) : (
        <button
          type="button"
          onClick={start}
          className="group absolute inset-0 h-full w-full text-left focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-accent"
          aria-label={label}
        >
          <img src={poster} alt="" loading="lazy" decoding="async" className="h-full w-full object-cover" />
          <span className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent" aria-hidden />
          <span className="absolute left-1/2 top-1/2 flex h-16 w-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-accent text-accent-foreground shadow-xl transition-transform group-hover:scale-105 md:h-20 md:w-20">
            <Play className="ml-1 h-7 w-7 md:h-9 md:w-9" aria-hidden />
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
