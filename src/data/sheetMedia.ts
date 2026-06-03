import type { Language } from "@/contexts/LanguageContext";
import { mediaItems as localMediaItems, type MediaItem } from "@/data/media";
import { rowsFromCsv, type CsvRow } from "@/lib/csv";

const MEDIA_SHEET_CSV_URL = import.meta.env.VITE_MEDIA_SHEET_CSV_URL;

function getLocalized(row: CsvRow, key: string, lang: Language) {
  return row[`${key}_${lang}`] || row[key] || "";
}

function sheetRowToMediaItem(row: CsvRow, index: number): MediaItem | null {
  const status = (row.status || "published").toLowerCase();
  if (!["published", "publicado", "live"].includes(status)) {
    return null;
  }

  const url = row.url || row.source_url;
  const outlet = row.outlet || row.source_name;
  const titlePt = getLocalized(row, "title", "pt");
  const titleEn = getLocalized(row, "title", "en") || titlePt;

  if (!url || !outlet || !titlePt) {
    return null;
  }

  return {
    id: row.id || `sheet-media-${index}`,
    title: {
      pt: titlePt,
      en: titleEn,
    },
    outlet,
    url,
  };
}

function mergeMediaItems(sheetMediaItems: MediaItem[]) {
  const byUrl = new Map<string, MediaItem>();

  localMediaItems.forEach((item) => byUrl.set(item.url, item));
  sheetMediaItems.forEach((item) => byUrl.set(item.url, item));

  return Array.from(byUrl.values());
}

export async function fetchSheetMediaItems(): Promise<MediaItem[]> {
  if (!MEDIA_SHEET_CSV_URL) {
    return localMediaItems;
  }

  const response = await fetch(MEDIA_SHEET_CSV_URL);
  if (!response.ok) {
    throw new Error(`Media sheet request failed: ${response.status}`);
  }

  const csv = await response.text();
  const sheetMediaItems = rowsFromCsv(csv)
    .map(sheetRowToMediaItem)
    .filter((item): item is MediaItem => Boolean(item));

  return mergeMediaItems(sheetMediaItems);
}
