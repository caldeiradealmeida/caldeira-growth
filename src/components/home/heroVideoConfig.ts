import type { Language } from "@/lib/routing";

export const HERO_VIDEO_SOURCES = {
  large: "/videos/hero-1080.mp4",
  small: "/videos/hero-720.mp4",
  poster: "/videos/hero-poster.webp",
} as const;

export const HERO_VIDEO_LABELS: Record<Language, { pause: string; play: string }> = {
  pt: { pause: "Pausar vídeo de fundo", play: "Reproduzir vídeo de fundo" },
  en: { pause: "Pause background video", play: "Play background video" },
  es: { pause: "Pausar video de fondo", play: "Reproducir video de fondo" },
};

type NavigatorWithConnection = Navigator & {
  connection?: { saveData?: boolean };
};

export function shouldPlayHeroVideo(win: Window): boolean {
  const reducedMotion =
    typeof win.matchMedia === "function" &&
    win.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const saveData = Boolean((win.navigator as NavigatorWithConnection).connection?.saveData);
  return !reducedMotion && !saveData;
}

export function pickHeroVideoSource(viewportWidth: number): string {
  return viewportWidth < 1024 ? HERO_VIDEO_SOURCES.small : HERO_VIDEO_SOURCES.large;
}
