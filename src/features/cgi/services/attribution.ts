import type { CgiAttribution } from "../types";

const ATTRIBUTION_KEYS = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_content",
  "utm_term",
  "gclid",
  "fbclid",
  "li_fat_id",
] as const;

function clean(value: string | null) {
  const trimmed = String(value || "").trim();
  return trimmed ? trimmed.slice(0, 1000) : null;
}

export function captureCurrentAttribution(now = new Date()): CgiAttribution {
  const params = new URLSearchParams(window.location.search);
  return {
    utm_source: clean(params.get("utm_source")),
    utm_medium: clean(params.get("utm_medium")),
    utm_campaign: clean(params.get("utm_campaign")),
    utm_content: clean(params.get("utm_content")),
    utm_term: clean(params.get("utm_term")),
    referrer: clean(document.referrer),
    landing_page: clean(window.location.href),
    gclid: clean(params.get("gclid")),
    fbclid: clean(params.get("fbclid")),
    li_fat_id: clean(params.get("li_fat_id") || params.get("li_fat_id".toUpperCase())),
    touched_at: now.toISOString(),
  };
}

export function hasAttributionSignal(attribution: CgiAttribution | null) {
  if (!attribution) return false;
  return (
    ATTRIBUTION_KEYS.some((key) => Boolean(attribution[key])) ||
    Boolean(attribution.referrer)
  );
}
