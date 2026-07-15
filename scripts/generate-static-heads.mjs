import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const dist = path.join(root, "dist");
const indexPath = path.join(dist, "index.html");
const siteUrl = "https://www.caldeiragrowth.com";

const basePublicLanguages = ["pt", "en"];
const spanishIndexableKeys = new Set([
  "home",
  "consulting",
  "executiveDevelopment",
  "speaking",
  "about",
  "contact",
  "privacy",
]);

const pages = [
  {
    key: "home",
    paths: { pt: "/", en: "/en", es: "/es" },
    meta: {
      pt: {
        title:
          "Caldeira Growth | Arquitetura de Crescimento para Negócios e Lideranças",
        description:
          "Consultoria, desenvolvimento executivo e palestras para empresas que precisam alinhar estratégia, cultura, liderança e execução.",
      },
      en: {
        title:
          "Caldeira Growth | Growth Architecture for Businesses and Leaders",
        description:
          "Consulting, executive development and speaking for organizations that need to align strategy, culture, leadership and execution.",
      },
      es: {
        title:
          "Caldeira Growth | Arquitectura de Crecimiento para Negocios y Líderes",
        description:
          "Consultoría, desarrollo ejecutivo y conferencias para empresas que necesitan alinear estrategia, cultura, liderazgo y ejecución.",
      },
    },
  },
  {
    key: "consulting",
    paths: { pt: "/consultoria", en: "/en/consulting", es: "/es/consultoria" },
    meta: {
      pt: {
        title: "Consultoria | Arquitetura de Crescimento para Empresas",
        description:
          "Consultoria para empresas que precisam alinhar estratégia, cultura, liderança e execução para sustentar novos ciclos de crescimento.",
      },
      en: {
        title: "Consulting | Growth Architecture for Organizations",
        description:
          "Consulting for organizations that need to align strategy, culture, leadership and execution to sustain new growth cycles.",
      },
      es: {
        title: "Consultoría | Arquitectura de Crecimiento para Empresas",
        description:
          "Consultoría para empresas que necesitan alinear estrategia, cultura, liderazgo y ejecución para sostener nuevos ciclos de crecimiento.",
      },
    },
  },
  {
    key: "executiveDevelopment",
    paths: {
      pt: "/desenvolvimento-executivo",
      en: "/en/executive-development",
      es: "/es/desarrollo-ejecutivo",
    },
    meta: {
      pt: {
        title: "Desenvolvimento Executivo | Caldeira Growth",
        description:
          "Programas de desenvolvimento executivo, PDE, workshops e mentorias para lideranças que precisam transformar estratégia em execução.",
      },
      en: {
        title: "Executive Development | Caldeira Growth",
        description:
          "Executive development programs, workshops and mentoring for leaders who need to turn strategy into execution.",
      },
      es: {
        title: "Desarrollo Ejecutivo | Caldeira Growth",
        description:
          "Programas de desarrollo ejecutivo, workshops y mentorías para líderes que necesitan transformar estrategia en ejecución.",
      },
    },
  },
  {
    key: "speaking",
    paths: { pt: "/palestras", en: "/en/speaking", es: "/es/conferencias" },
    meta: {
      pt: {
        title: "Palestras | Caldeira Growth",
        description:
          "Palestras para organizações em transformação sobre crescimento, estratégia, liderança, inteligência artificial e negócios.",
      },
      en: {
        title: "Speaking | Caldeira Growth",
        description:
          "Speaking for organizations in transformation on growth, strategy, leadership, artificial intelligence and business transformation.",
      },
      es: {
        title: "Conferencias | Caldeira Growth",
        description:
          "Conferencias para organizaciones en transformación sobre crecimiento, estrategia, liderazgo, inteligencia artificial y negocios.",
      },
    },
  },
  {
    key: "content",
    paths: { pt: "/conteudo", en: "/en/content", es: "/es/contenidos" },
    meta: {
      pt: {
        title: "Conteúdo | Caldeira Growth",
        description:
          "Ideias sobre crescimento, estratégia, liderança, inteligência artificial, governança e transformação.",
      },
      en: {
        title: "Content | Caldeira Growth",
        description:
          "Perspectives on growth, strategy, leadership, artificial intelligence, governance and transformation.",
      },
      es: {
        title: "Contenidos | Caldeira Growth",
        description:
          "Ideas sobre crecimiento, estrategia, liderazgo, inteligencia artificial, gobernanza y transformación.",
      },
    },
  },
  {
    key: "about",
    paths: { pt: "/sobre", en: "/en/about", es: "/es/sobre-nosotros" },
    meta: {
      pt: {
        title: "Sobre | Caldeira Growth",
        description:
          "Conheça a tese institucional da Caldeira Growth, a Arquitetura de Crescimento e a trajetória que formou essa abordagem.",
      },
      en: {
        title: "About | Caldeira Growth",
        description:
          "Learn about Caldeira Growth's institutional thesis, Growth Architecture and the trajectory behind the approach.",
      },
      es: {
        title: "Sobre Nosotros | Caldeira Growth",
        description:
          "Conozca la tesis institucional de Caldeira Growth, la Arquitectura de Crecimiento y la trayectoria detrás del enfoque.",
      },
    },
  },
  {
    key: "contact",
    paths: { pt: "/contato", en: "/en/contact", es: "/es/contacto" },
    meta: {
      pt: {
        title: "Contato | Caldeira Growth",
        description:
          "Para discussões estratégicas, decisões críticas ou uma conversa inicial sobre crescimento.",
      },
      en: {
        title: "Contact | Caldeira Growth",
        description:
          "For strategic discussions, critical decisions, or an initial conversation about growth.",
      },
      es: {
        title: "Contacto | Caldeira Growth",
        description:
          "Para conversaciones estratégicas, decisiones críticas o una primera conversación sobre crecimiento.",
      },
    },
  },
  {
    key: "articles",
    paths: { pt: "/artigos", en: "/en/articles", es: "/es/articulos" },
    meta: {
      pt: {
        title: "Artigos | Caldeira Growth",
        description:
          "Estratégia, execução, crescimento e decisão para quem lidera negócios e carreiras.",
      },
      en: {
        title: "Articles | Caldeira Growth",
        description:
          "Strategy, execution, growth and decision-making for people leading businesses and careers.",
      },
      es: {
        title: "Artículos | Caldeira Growth",
        description:
          "Estrategia, ejecución, crecimiento y decisión para líderes.",
      },
    },
  },
  {
    key: "media",
    paths: { pt: "/midia", en: "/en/media", es: "/es/media" },
    meta: {
      pt: {
        title: "Na mídia | Caldeira Growth",
        description:
          "Artigos, entrevistas e reflexões sobre estratégia, crescimento e decisão.",
      },
      en: {
        title: "In the Media | Caldeira Growth",
        description:
          "Articles, interviews and reflections on strategy, growth and decision-making.",
      },
      es: {
        title: "En los medios | Caldeira Growth",
        description:
          "Artículos, entrevistas y reflexiones sobre estrategia, crecimiento y toma de decisiones.",
      },
    },
  },
  {
    key: "privacy",
    paths: {
      pt: "/politica-de-privacidade",
      en: "/en/privacy-policy",
      es: "/es/politica-de-privacidad",
    },
    meta: {
      pt: {
        title: "Política de Privacidade | Caldeira Growth",
        description:
          "Política de Privacidade da Caldeira Growth.",
      },
      en: {
        title: "Privacy Policy | Caldeira Growth",
        description:
          "Caldeira Growth Privacy Policy.",
      },
      es: {
        title: "Política de Privacidad | Caldeira Growth",
        description:
          "La versión en español de la política de privacidad está en revisión editorial y jurídica.",
      },
    },
  },
];

function escapeHtml(value) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function headTags(page, lang) {
  const meta = page.meta[lang];
  const canonical = `${siteUrl}${page.paths[lang]}`;
  const robots =
    lang === "es" && !spanishIndexableKeys.has(page.key)
      ? "noindex, follow"
      : "index, follow";
  const alternates = publicLanguagesForPage(page)
    .map((publicLang) => {
      const hreflang =
        publicLang === "pt" ? "pt-BR" : publicLang === "es" ? "es" : "en";
      return `<link rel="alternate" hreflang="${hreflang}" href="${siteUrl}${page.paths[publicLang]}" />`;
    })
    .join("\n    ");

  return `<title>${escapeHtml(meta.title)}</title>
    <meta name="description" content="${escapeHtml(meta.description)}" />
    <meta name="robots" content="${robots}" />
    <link rel="canonical" href="${canonical}" />
    ${alternates}
    <link rel="alternate" hreflang="x-default" href="${siteUrl}${page.paths.pt}" />
    <meta property="og:title" content="${escapeHtml(meta.title)}" />
    <meta property="og:description" content="${escapeHtml(meta.description)}" />
    <meta property="og:type" content="website" />
    <meta property="og:url" content="${canonical}" />
    <meta name="twitter:card" content="summary" />
    <meta name="twitter:title" content="${escapeHtml(meta.title)}" />
    <meta name="twitter:description" content="${escapeHtml(meta.description)}" />`;
}

function injectHead(html, page, lang) {
  let output = html
    .replace(/<html lang="[^"]*">/, `<html lang="${lang === "pt" ? "pt-BR" : lang}">`)
    .replace(/<title>[\s\S]*?<\/title>/, "")
    .replace(/<meta name="description"[^>]*>\s*/g, "")
    .replace(/<meta name="robots"[^>]*>\s*/g, "")
    .replace(/<link rel="canonical"[^>]*>\s*/g, "")
    .replace(/<link rel="alternate"[^>]*>\s*/g, "")
    .replace(/<meta property="og:[^"]+"[^>]*>\s*/g, "")
    .replace(/<meta name="twitter:[^"]+"[^>]*>\s*/g, "");

  output = output.replace("</head>", `    ${headTags(page, lang)}\n  </head>`);
  return output;
}

function htmlPathForRoute(routePath) {
  if (routePath === "/") return path.join(dist, "index.html");
  return path.join(dist, routePath.replace(/^\//, ""), "index.html");
}

function flatHtmlPathForRoute(routePath) {
  if (routePath === "/") return null;
  return path.join(dist, `${routePath.replace(/^\//, "")}.html`);
}

function writeRouteHtml(page, lang, template) {
  const routePath = page.paths[lang];
  const html = injectHead(template, page, lang);
  const filePath = htmlPathForRoute(routePath);
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, html);

  const flatPath = flatHtmlPathForRoute(routePath);
  if (flatPath) {
    fs.mkdirSync(path.dirname(flatPath), { recursive: true });
    fs.writeFileSync(flatPath, html);
  }
}

function publicLanguagesForPage(page) {
  const languages = [...basePublicLanguages];
  if (spanishIndexableKeys.has(page.key)) {
    languages.push("es");
  }
  return languages;
}

function readLocalArticles() {
  const source = fs.readFileSync(path.join(root, "src/data/articles.ts"), "utf8");
  return Array.from(
    source.matchAll(
      /slug:\s*"([^"]+)"[\s\S]*?title:\s*{\s*pt:\s*"([^"]+)"[\s\S]*?en:\s*"([^"]+)"/g
    )
  ).map((match) => ({
    slug: match[1],
    titlePt: match[2],
    titleEn: match[3],
  }));
}

function articlePage(article, lang) {
  const pathPrefix = lang === "pt" ? "/artigos" : "/en/articles";
  const title = lang === "pt" ? article.titlePt : article.titleEn;
  return {
    key: "article",
    paths: {
      pt: `/artigos/${article.slug}`,
      en: `/en/articles/${article.slug}`,
      es: `/es/articulos/${article.slug}`,
    },
    meta: {
      pt: {
        title: `${article.titlePt} | Caldeira Growth`,
        description:
          "Artigo da Caldeira Growth sobre estratégia, crescimento, decisão e execução.",
      },
      en: {
        title: `${article.titleEn} | Caldeira Growth`,
        description:
          "Caldeira Growth article on strategy, growth, decision-making and execution.",
      },
      es: {
        title: "Artículo en revisión | Caldeira Growth",
        description:
          "La versión en español de este artículo está en revisión editorial.",
      },
    },
    currentPath: `${pathPrefix}/${article.slug}`,
    currentTitle: title,
  };
}

function writeSitemap(articles) {
  const urls = [];
  for (const page of pages) {
    for (const lang of publicLanguagesForPage(page)) {
      urls.push(`${siteUrl}${page.paths[lang]}`);
    }
  }
  for (const article of articles) {
    urls.push(`${siteUrl}/artigos/${article.slug}`);
    urls.push(`${siteUrl}/en/articles/${article.slug}`);
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    (url) => `  <url>
    <loc>${url}</loc>
  </url>`
  )
  .join("\n")}
</urlset>
`;
  fs.writeFileSync(path.join(dist, "sitemap.xml"), xml);
}

if (!fs.existsSync(indexPath)) {
  throw new Error("dist/index.html not found. Run vite build before this script.");
}

const template = fs.readFileSync(indexPath, "utf8");

for (const page of pages) {
  writeRouteHtml(page, "pt", template);
  writeRouteHtml(page, "en", template);
  writeRouteHtml(page, "es", template);
}

const articles = readLocalArticles();
for (const article of articles) {
  const page = articlePage(article, "pt");
  writeRouteHtml(page, "pt", template);
  writeRouteHtml(page, "en", template);
  writeRouteHtml(page, "es", template);
}

writeSitemap(articles);
