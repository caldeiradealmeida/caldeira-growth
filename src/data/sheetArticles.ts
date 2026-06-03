import type { Language } from "@/contexts/LanguageContext";
import { articles as localArticles } from "@/data/articles";
import type { Article } from "@/data/articles";
import { rowsFromCsv, type CsvRow } from "@/lib/csv";

const ARTICLES_SHEET_CSV_URL = import.meta.env.VITE_ARTICLES_SHEET_CSV_URL;
const FALLBACK_COVER = "/placeholder.svg";

function getLocalized(row: CsvRow, key: string, lang: Language) {
  return row[`${key}_${lang}`] || row[key] || "";
}

function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 90);
}

function sheetRowToArticle(row: CsvRow, index: number): Article | null {
  const status = (row.status || "published").toLowerCase();
  if (!["published", "publicado", "live"].includes(status)) {
    return null;
  }

  const titlePt = getLocalized(row, "title", "pt");
  const titleEn = getLocalized(row, "title", "en") || titlePt;
  const slug = row.slug || slugify(titlePt || titleEn);

  if (!slug || !titlePt) {
    return null;
  }

  const contentPt = getLocalized(row, "content", "pt");
  const contentEn = getLocalized(row, "content", "en") || contentPt;

  return {
    id: row.id || `sheet-${slug || index}`,
    slug,
    date: row.date || row.published_at || "",
    cover: row.cover_url || row.cover || FALLBACK_COVER,
    title: {
      pt: titlePt,
      en: titleEn,
    },
    excerpt: {
      pt: getLocalized(row, "excerpt", "pt"),
      en: getLocalized(row, "excerpt", "en") || getLocalized(row, "excerpt", "pt"),
    },
    content: {
      pt: contentPt,
      en: contentEn,
    },
    sourceName: row.source_name || row.source,
    sourceUrl: row.source_url || row.original_url || row.url,
  };
}

function mergeArticles(sheetArticles: Article[]) {
  const bySlug = new Map<string, Article>();

  localArticles.forEach((article) => bySlug.set(article.slug, article));
  sheetArticles.forEach((article) => bySlug.set(article.slug, article));

  return Array.from(bySlug.values()).sort((a, b) => b.date.localeCompare(a.date));
}

export async function fetchSheetArticles(): Promise<Article[]> {
  if (!ARTICLES_SHEET_CSV_URL) {
    return localArticles;
  }

  const response = await fetch(ARTICLES_SHEET_CSV_URL);
  if (!response.ok) {
    throw new Error(`Articles sheet request failed: ${response.status}`);
  }

  const csv = await response.text();
  const sheetArticles = rowsFromCsv(csv)
    .map(sheetRowToArticle)
    .filter((article): article is Article => Boolean(article));

  return mergeArticles(sheetArticles);
}

export function getArticleFromList(slug: string, articleList: Article[]) {
  return articleList.find((article) => article.slug === slug);
}
