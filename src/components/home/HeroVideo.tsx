import { useEffect, useRef, useState } from "react";
import { Pause, Play } from "lucide-react";
import type { Language } from "@/lib/routing";
import {
  HERO_VIDEO_SOURCES,
  HERO_VIDEO_LABELS as LABELS,
  pickHeroVideoSource,
  shouldPlayHeroVideo,
} from "./heroVideoConfig";

/**
 * Background video for the home hero.
 *
 * The poster is a plain <img> that is always rendered, so the first paint and
 * LCP never wait for the video. The video fades in over it only once it is
 * actually playing. Visitors who prefer reduced motion, or whose browser asks
 * to save data, keep the poster and never download the video.
 */

type HeroVideoProps = {
  lang: Language;
  /** Classes shared by the poster and the video (sizing, object-position, filters). */
  mediaClassName: string;
};

export default function HeroVideo({ lang, mediaClassName }: HeroVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [src, setSrc] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [userPaused, setUserPaused] = useState(false);
  const labels = LABELS[lang] ?? LABELS.pt;

  useEffect(() => {
    if (!shouldPlayHeroVideo(window)) return;
    setSrc(pickHeroVideoSource(window.innerWidth));
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !src) return;
    // React does not reliably reflect `muted` as an attribute, and browsers only
    // allow autoplay for muted media, so set it on the element directly.
    video.muted = true;
    video.defaultMuted = true;
    const attempt = video.play();
    if (attempt && typeof attempt.catch === "function") {
      attempt.catch(() => setIsPlaying(false));
    }
  }, [src]);

  const toggle = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      setUserPaused(false);
      void video.play();
    } else {
      setUserPaused(true);
      video.pause();
    }
  };

  return (
    <>
      <img
        src={HERO_VIDEO_SOURCES.poster}
        alt=""
        aria-hidden
        fetchPriority="high"
        decoding="async"
        className={mediaClassName}
      />
      {src && (
        <video
          ref={videoRef}
          src={src}
          poster={HERO_VIDEO_SOURCES.poster}
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          aria-hidden
          tabIndex={-1}
          disablePictureInPicture
          onPlaying={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          className={`${mediaClassName} transition-opacity duration-700 ${
            isPlaying || userPaused ? "opacity-100" : "opacity-0"
          }`}
        />
      )}
      {src && (
        <button
          type="button"
          onClick={toggle}
          aria-label={isPlaying ? labels.pause : labels.play}
          aria-pressed={!isPlaying}
          data-testid="hero-video-toggle"
          className="absolute bottom-5 right-5 z-20 flex h-10 w-10 items-center justify-center rounded-full border border-white/40 bg-black/35 text-white backdrop-blur-sm transition-colors hover:bg-black/55 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
        >
          {isPlaying ? <Pause className="h-4 w-4" aria-hidden /> : <Play className="h-4 w-4" aria-hidden />}
        </button>
      )}
    </>
  );
}
