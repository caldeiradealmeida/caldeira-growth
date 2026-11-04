import { describe, expect, it } from "vitest";
import { HERO_VIDEO_SOURCES, pickHeroVideoSource, shouldPlayHeroVideo } from "./heroVideoConfig";

function fakeWindow({ reducedMotion = false, saveData = false } = {}) {
  return {
    matchMedia: (query: string) => ({
      matches: query.includes("prefers-reduced-motion") ? reducedMotion : false,
    }),
    navigator: { connection: { saveData } },
  } as unknown as Window;
}

describe("shouldPlayHeroVideo", () => {
  it("plays by default", () => {
    expect(shouldPlayHeroVideo(fakeWindow())).toBe(true);
  });

  it("keeps the still image when the visitor prefers reduced motion", () => {
    expect(shouldPlayHeroVideo(fakeWindow({ reducedMotion: true }))).toBe(false);
  });

  it("keeps the still image when the browser asks to save data", () => {
    expect(shouldPlayHeroVideo(fakeWindow({ saveData: true }))).toBe(false);
  });

  it("does not break where matchMedia or connection are missing", () => {
    expect(shouldPlayHeroVideo({ navigator: {} } as unknown as Window)).toBe(true);
  });
});

describe("pickHeroVideoSource", () => {
  it("serves the 720p file below the desktop breakpoint", () => {
    expect(pickHeroVideoSource(390)).toBe(HERO_VIDEO_SOURCES.small);
    expect(pickHeroVideoSource(1023)).toBe(HERO_VIDEO_SOURCES.small);
  });

  it("serves the 1080p file on desktop", () => {
    expect(pickHeroVideoSource(1024)).toBe(HERO_VIDEO_SOURCES.large);
    expect(pickHeroVideoSource(1920)).toBe(HERO_VIDEO_SOURCES.large);
  });
});
