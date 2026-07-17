import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  getPublicLanguagesForRoute,
  articleSlugFromPath,
  isRouteIndexableInLanguage,
  localizedPath,
  routeKeyFromPath,
  type RouteKey,
} from "@/lib/routing";

const SITE_URL = "https://www.caldeiragrowth.com";

type SEOProps = {
  routeKey?: RouteKey;
  title: string;
  description: string;
  image?: string;
  noIndex?: boolean;
};

function setMeta(attr: "name" | "property", value: string) {
  const selector = `meta[${attr}="${value}"]`;
  let tag = document.head.querySelector<HTMLMetaElement>(selector);
  if (!tag) {
    tag = document.createElement("meta");
    tag.setAttribute(attr, value);
    document.head.appendChild(tag);
  }
  return tag;
}

function upsertLink(rel: string, href: string, hreflang?: string) {
  const selector = hreflang
    ? `link[rel="${rel}"][hreflang="${hreflang}"]`
    : `link[rel="${rel}"]:not([hreflang])`;
  let link = document.head.querySelector<HTMLLinkElement>(selector);
  if (!link) {
    link = document.createElement("link");
    link.rel = rel;
    if (hreflang) link.hreflang = hreflang;
    document.head.appendChild(link);
  }
  link.href = href;
}

export default function SEO({
  routeKey,
  title,
  description,
  image,
  noIndex = false,
}: SEOProps) {
  const { lang } = useLanguage();
  const location = useLocation();
  const resolvedRouteKey = routeKey ?? routeKeyFromPath(location.pathname);
  const articleSlug =
    resolvedRouteKey === "article" ? articleSlugFromPath(location.pathname) : "";
  const canonicalPath = resolvedRouteKey
    ? localizedPath(
        resolvedRouteKey,
        lang,
        articleSlug ? { slug: articleSlug } : undefined
      )
    : location.pathname;
  const canonical = `${SITE_URL}${canonicalPath}`;

  useEffect(() => {
    document.documentElement.lang =
      lang === "pt" ? "pt-BR" : lang === "es" ? "es" : "en";
    document.title = title;

    setMeta("name", "description").content = description;
    const robots =
      noIndex || !isRouteIndexableInLanguage(resolvedRouteKey, lang)
        ? "noindex, follow"
        : "index, follow";
    setMeta("name", "robots").content = robots;
    setMeta("property", "og:title").content = title;
    setMeta(
      "property",
      "og:description"
    ).content = description;
    setMeta("property", "og:type").content = "website";
    setMeta("property", "og:url").content = canonical;
    setMeta("name", "twitter:card").content = image
      ? "summary_large_image"
      : "summary";
    setMeta("name", "twitter:title").content = title;
    setMeta(
      "name",
      "twitter:description"
    ).content = description;
    if (image) {
      setMeta("property", "og:image").content = image;
      setMeta("name", "twitter:image").content = image;
    }

    upsertLink("canonical", canonical);

    document
      .querySelectorAll('link[rel="alternate"][hreflang]')
      .forEach((node) => node.remove());

    if (resolvedRouteKey) {
      const routeParams = articleSlug ? { slug: articleSlug } : undefined;
      for (const publicLang of getPublicLanguagesForRoute(resolvedRouteKey)) {
        const href = `${SITE_URL}${localizedPath(
          resolvedRouteKey,
          publicLang,
          routeParams
        )}`;
        const hreflang =
          publicLang === "pt" ? "pt-BR" : publicLang === "es" ? "es" : "en";
        upsertLink("alternate", href, hreflang);
      }
      upsertLink(
        "alternate",
        `${SITE_URL}${localizedPath(resolvedRouteKey, "pt", routeParams)}`,
        "x-default"
      );
    }
  }, [
    articleSlug,
    canonical,
    description,
    image,
    lang,
    noIndex,
    resolvedRouteKey,
    title,
  ]);

  return null;
}
