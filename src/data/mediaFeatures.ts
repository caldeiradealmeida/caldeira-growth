import type { Language } from "@/contexts/LanguageContext";

import forbesRonaldo from "@/assets/media/forbes-ronaldo.webp";
import vejaMercado from "@/assets/media/veja-mercado.webp";
import cartaCapitalProfissionais from "@/assets/media/cartacapital-profissionais-do-futuro.webp";
import hsmProfissionalAumentado from "@/assets/media/hsm-profissional-aumentado.webp";
import cbnFloripa from "@/assets/media/cbn-floripa.webp";
import panNewsEmRevista from "@/assets/media/pan-news-em-revista.webp";

/**
 * Curadoria editorial de imprensa — Home e página /midia.
 *
 * Separado de `src/data/media.ts` de propósito: aquela lista é sobrescrita
 * pela planilha (`sheetMedia.ts`, merge por URL), o que apagaria silenciosamente
 * imagem, tipo e timestamp definidos aqui. Esta curadoria é fixa e versionada.
 *
 * `featured: true` = aparece no carrossel da Home.
 */
export type MediaContentType = "article" | "interview" | "live" | "podcast" | "video";

export type MediaFeature = {
  id: string;
  outlet: string;
  title: Record<"pt" | "en", string>;
  url: string;
  type: MediaContentType;
  /** Import do asset local. Ausente = card usa o painel tipográfico de fallback. */
  image?: string;
  /** Marca o card com o indicador de play. */
  isVideo?: boolean;
  /**
   * Selo discreto no canto inferior direito da imagem. Usado quando a foto nao
   * e da materia -- identifica o veiculo sem fingir que a imagem e dele.
   */
  overlayLabel?: string;
  featured?: boolean;
};

export const MEDIA_TYPE_LABEL: Record<
  MediaContentType,
  Record<"pt" | "en" | "es", string>
> = {
  article: { pt: "Artigo", en: "Article", es: "Artículo" },
  interview: { pt: "Entrevista", en: "Interview", es: "Entrevista" },
  live: {
    pt: "Entrevista ao vivo",
    en: "Live interview",
    es: "Entrevista en vivo",
  },
  podcast: { pt: "Podcast", en: "Podcast", es: "Podcast" },
  video: { pt: "Vídeo", en: "Video", es: "Video" },
};

export function mediaFeatureLang(lang: Language): "pt" | "en" {
  return lang === "pt" ? "pt" : "en";
}

export const mediaFeatures: MediaFeature[] = [
  // ---------- Home (carrossel) ----------
  {
    id: "forbes-ronaldo-nova-era",
    outlet: "Forbes Brasil",
    title: {
      pt: "Ronaldo inaugura nova era no futebol — Denis Caldeira é convidado",
      en: "Ronaldo inaugurates a new era in football — Denis Caldeira is invited",
    },
    url: "https://forbes.com.br/carreira/2022/11/ronaldo-inaugura-nova-era-no-futebol/",
    type: "article",
    image: forbesRonaldo,
    overlayLabel: "Forbes",
    featured: true,
  },
  {
    id: "terra-de-examinador-a-diretor",
    outlet: "Terra · Pega a Visão",
    title: {
      pt: "Denis Caldeira: de examinador de cabos a diretor, com receita de R$ 10 bilhões",
      en: "Denis Caldeira: from cable examiner to director, with R$ 10 billion in revenue",
    },
    url: "https://www.terra.com.br/visao-do-corre/pega-a-visao/denis-caldeira-de-examinador-de-cabos-a-diretor-com-receita-de-r-10-bilhoes,154c8dd96534ec96be95d01210a1227fvoo85sik.html",
    type: "article",
    featured: true,
  },
  {
    id: "veja-mercado-entrevista",
    outlet: "VEJA Mercado",
    title: {
      pt: "Crescimento, estratégia e os desafios das empresas brasileiras",
      en: "Growth, strategy and the challenges facing Brazilian companies",
    },
    // Entrevista começa em 28:42 = 1722s
    url: "https://www.youtube.com/live/saypN54jKMY?t=1722",
    type: "live",
    image: vejaMercado,
    isVideo: true,
    featured: true,
  },
  {
    id: "cartacapital-habilidades-lideres-ia",
    outlet: "CartaCapital",
    title: {
      pt: "Profissionais do futuro: 5 habilidades que diferenciam o mero usuário de IA de um líder em potencial",
      en: "Professionals of the future: 5 skills that separate a mere AI user from a potential leader",
    },
    url: "https://www.cartacapital.com.br/do-micro-ao-macro/profissionais-do-futuro-habilidades-lideres-ia/",
    type: "article",
    image: cartaCapitalProfissionais,
    overlayLabel: "CartaCapital",
    featured: true,
  },
  {
    id: "poder360-primeiro-negocio",
    outlet: "Poder360",
    title: {
      pt: "5 dicas para sair do zero e estruturar seu primeiro negócio",
      en: "5 tips to start from scratch and structure your first business",
    },
    url: "https://www.youtube.com/watch?v=Vx9AqtxX0vQ",
    type: "podcast",
    isVideo: true,
    featured: true,
  },
  {
    id: "hsm-profissional-aumentado",
    outlet: "HSM Management",
    title: {
      pt: "O futuro depois da inteligência artificial: as cinco competências que definirão o profissional aumentado",
      en: "The future after artificial intelligence: the five competencies that will define the augmented professional",
    },
    url: "https://hsmmanagement.com.br/o-futuro-depois-da-inteligencia-artificial-as-cinco-competencias-que-definirao-o-profissional-aumentado/",
    type: "article",
    image: hsmProfissionalAumentado,
    overlayLabel: "HSM Management",
    featured: true,
  },
  {
    id: "cbn-floripa-entrevista",
    outlet: "CBN Floripa",
    title: {
      pt: "Como empresas podem crescer de forma mais consistente",
      en: "How companies can grow more consistently",
    },
    // Entrevista começa em 35:55 = 2155s
    url: "https://www.youtube.com/live/8ZcUZvArvhk?t=2155",
    type: "interview",
    image: cbnFloripa,
    isVideo: true,
    featured: true,
  },
  {
    id: "diario-do-comercio-mortalidade",
    outlet: "Diário do Comércio",
    title: {
      pt: "Guia sugere caminhos para evitar mortalidade das empresas",
      en: "Guide suggests ways to avoid business mortality",
    },
    url: "https://diariodocomercio.com.br/negocios/guia-sugere-caminhos-evitar-mortalidade-empresas/",
    type: "article",
    featured: true,
  },

  // ---------- Somente /midia ----------
  {
    id: "superesportes-conselho-cruzeiro",
    outlet: "Superesportes",
    title: {
      pt: "Cruzeiro: quem são os 7 integrantes do Conselho Consultivo de Ronaldo",
      en: "Cruzeiro: the 7 members of Ronaldo's Advisory Board",
    },
    url: "https://www.mg.superesportes.com.br/app/noticias/futebol/cruzeiro/2022/10/02/noticia_cruzeiro,3977175/cruzeiro-quem-sao-os-7-integrantes-do-conselho-consultivo-de-ronaldo.shtml",
    type: "article",
  },
  {
    id: "revista-cobertura-sura",
    outlet: "Revista Cobertura",
    title: {
      pt: "Denis Caldeira é o novo conselheiro da Seguros Sura",
      en: "Denis Caldeira is the new board member at Seguros Sura",
    },
    url: "https://www.revistacobertura.com.br/noticias/executivos-cia/denis-caldeira-e-o-novo-conselheiro-da-seguros-sura/",
    type: "article",
  },
  {
    id: "jornal-de-brasilia-cresca-ou-desapareca",
    outlet: "Jornal de Brasília",
    title: {
      pt: "Livro “Cresça ou Desapareça” de Denis Caldeira ajuda a acelerar empresas",
      en: "Denis Caldeira's book “Cresça ou Desapareça” helps accelerate companies",
    },
    url: "https://jornaldebrasilia.com.br/blogs-e-colunas/analice-nicolau/livro-cresca-ou-desapareca-de-denis-caldeira-ajuda-a-acelerar-empresas/",
    type: "article",
  },
  {
    id: "clientesa-elo-invisivel",
    outlet: "ClienteSA",
    title: {
      pt: "Relacionamento com cliente é o elo invisível que sustenta o crescimento",
      en: "Customer relationship is the invisible link that sustains growth",
    },
    url: "https://portal.clientesa.com.br/relacionamento-com-cliente-e-o-elo-invisivel-que-sustenta-o-crescimento/",
    type: "article",
  },
  {
    id: "clientesa-conhecer-o-cliente",
    outlet: "ClienteSA",
    title: {
      pt: "Conhecer o cliente é um passo importante para construir uma máquina de vendas eficiente",
      en: "Knowing the customer is a key step to building an efficient sales machine",
    },
    url: "https://portal.clientesa.com.br/conhecer-o-cliente-e-um-passo-importante-para-construir-uma-maquina-de-vendas-eficiente/",
    type: "article",
  },
  {
    id: "economiasa-cinco-posturas",
    outlet: "Economia S/A",
    title: {
      pt: "Do silêncio à ação: as cinco posturas possíveis diante de desafios corporativos",
      en: "From silence to action: five possible stances in the face of corporate challenges",
    },
    url: "https://economiasa.com.br/blog/do-silencio-a-acao-as-cinco-posturas-possiveis-diante-de-desafios-corporativos/",
    type: "article",
  },
  {
    id: "business-moment-trajetoria",
    outlet: "Business Moment",
    title: {
      pt: "A trajetória de Denis Caldeira, líder que transformou desafios em oportunidades",
      en: "The path of Denis Caldeira, a leader who turned challenges into opportunities",
    },
    url: "https://businessmoment.com.br/a-trajetoria-de-denis-caldeira-lider-que-transformou-desafios-em-oportunidades/",
    type: "article",
  },
  {
    id: "youtube-produtos-escalaveis",
    outlet: "A Busca pelo Produto Perfeito",
    title: {
      pt: "Como criar produtos e negócios escaláveis",
      en: "How to build scalable products and businesses",
    },
    url: "https://www.youtube.com/watch?v=AOlbrBXSe9k",
    type: "podcast",
    isVideo: true,
  },
  {
    id: "pan-news-em-revista",
    outlet: "Pan News em Revista",
    title: {
      pt: "Pan News em Revista, com Tiago Lima",
      en: "Pan News em Revista, with Tiago Lima",
    },
    url: "https://www.youtube.com/watch?v=XEb7nG8czZI&t=1089s",
    type: "interview",
    image: panNewsEmRevista,
    isVideo: true,
  },
];

export const featuredMediaFeatures = mediaFeatures.filter((item) => item.featured);
