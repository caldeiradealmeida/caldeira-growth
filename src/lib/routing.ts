export type Language = "pt" | "en" | "es";

export type RouteKey =
  | "home"
  | "consulting"
  | "executiveDevelopment"
  | "speaking"
  | "content"
  | "cgi"
  | "about"
  | "contact"
  | "articles"
  | "article"
  | "media"
  | "privacy";

export const STORAGE_KEY = "caldeira-growth-lang";

const SPANISH_PUBLIC_READY = true;

export const SPANISH_ENABLED =
  SPANISH_PUBLIC_READY && import.meta.env.VITE_ENABLE_SPANISH !== "false";

const SPANISH_INDEXABLE_ROUTES = new Set<RouteKey>([
  "home",
  "consulting",
  "executiveDevelopment",
  "speaking",
  "about",
  "contact",
  "privacy",
]);

export const languageLabels: Record<Language, string> = {
  pt: "PT",
  en: "EN",
  es: "ES",
};

export const routePaths: Record<RouteKey, Record<Language, string>> = {
  home: { pt: "/", en: "/en", es: "/es" },
  consulting: {
    pt: "/consultoria",
    en: "/en/consulting",
    es: "/es/consultoria",
  },
  executiveDevelopment: {
    pt: "/desenvolvimento-executivo",
    en: "/en/executive-development",
    es: "/es/desarrollo-ejecutivo",
  },
  speaking: {
    pt: "/palestras",
    en: "/en/speaking",
    es: "/es/conferencias",
  },
  content: {
    pt: "/conteudo",
    en: "/en/content",
    es: "/es/contenidos",
  },
  cgi: {
    pt: "/cgi",
    en: "/cgi",
    es: "/cgi",
  },
  about: {
    pt: "/sobre",
    en: "/en/about",
    es: "/es/sobre-nosotros",
  },
  contact: {
    pt: "/contato",
    en: "/en/contact",
    es: "/es/contacto",
  },
  articles: {
    pt: "/artigos",
    en: "/en/articles",
    es: "/es/articulos",
  },
  article: {
    pt: "/artigos/:slug",
    en: "/en/articles/:slug",
    es: "/es/articulos/:slug",
  },
  media: {
    pt: "/midia",
    en: "/en/media",
    es: "/es/media",
  },
  privacy: {
    pt: "/politica-de-privacidade",
    en: "/en/privacy-policy",
    es: "/es/politica-de-privacidad",
  },
};

const routeEntries = Object.entries(routePaths) as Array<
  [RouteKey, Record<Language, string>]
>;

export function getLanguageFromPath(pathname: string): Language {
  if (pathname === "/en" || pathname.startsWith("/en/")) return "en";
  if (pathname === "/es" || pathname.startsWith("/es/")) return "es";
  return "pt";
}

export function isLanguagePublic(lang: Language): boolean {
  return lang !== "es" || SPANISH_ENABLED;
}

export function getPublicLanguages(): Language[] {
  return SPANISH_ENABLED ? ["pt", "en", "es"] : ["pt", "en"];
}

export function isRouteIndexableInLanguage(
  routeKey: RouteKey | null,
  lang: Language
): boolean {
  if (lang !== "es") return true;
  return SPANISH_ENABLED && !!routeKey && SPANISH_INDEXABLE_ROUTES.has(routeKey);
}

export function getPublicLanguagesForRoute(routeKey: RouteKey): Language[] {
  const languages: Language[] = ["pt", "en"];
  if (isRouteIndexableInLanguage(routeKey, "es")) {
    languages.push("es");
  }
  return languages;
}

export function routeKeyFromPath(pathname: string): RouteKey | null {
  const normalized = normalizePath(pathname);

  for (const [key, paths] of routeEntries) {
    for (const path of Object.values(paths)) {
      if (!path.includes(":") && normalizePath(path) === normalized) {
        return key;
      }
    }
  }

  const articlePatterns = [
    /^\/artigos\/[^/]+$/,
    /^\/en\/articles\/[^/]+$/,
    /^\/es\/articulos\/[^/]+$/,
  ];
  if (articlePatterns.some((pattern) => pattern.test(normalized))) {
    return "article";
  }

  return null;
}

export function articleSlugFromPath(pathname: string): string {
  const parts = normalizePath(pathname).split("/").filter(Boolean);
  return parts[parts.length - 1] ?? "";
}

export function localizedPath(
  key: RouteKey,
  lang: Language,
  params?: { slug?: string }
): string {
  const path = routePaths[key][lang];
  if (key === "article") {
    return path.replace(":slug", params?.slug ?? "");
  }
  return path;
}

export function switchLanguagePath(
  pathname: string,
  search: string,
  hash: string,
  targetLang: Language
): string {
  const key = routeKeyFromPath(pathname);
  if (!key) return `${pathname}${search}${hash}`;

  if (!isRouteIndexableInLanguage(key, targetLang)) {
    return `${localizedPath("home", targetLang)}${search}${hash}`;
  }

  const nextPath = localizedPath(key, targetLang, {
    slug: articleSlugFromPath(pathname),
  });
  return `${nextPath}${search}${hash}`;
}

export function normalizePath(pathname: string): string {
  if (!pathname || pathname === "/") return "/";
  return pathname.replace(/\/+$/, "");
}
