import type { Language } from "@/contexts/LanguageContext";

export type MediaItem = {
  id: string;
  title: Record<Language, string>;
  outlet: string;
  url: string;
};

export const mediaItems: MediaItem[] = [
  {
    id: "1",
    title: {
      pt: "Ronaldo inaugura nova era no futebol",
      en: "Ronaldo inaugurates new era in football",
    },
    outlet: "Forbes Brasil",
    url: "https://forbes.com.br/carreira/2022/11/ronaldo-inaugura-nova-era-no-futebol/",
  },
  {
    id: "2",
    title: {
      pt: "Profissionais do futuro desenvolvem habilidades que ampliam o poder da IA",
      en: "Professionals of the future develop skills that amplify AI power",
    },
    outlet: "CartaCapital",
    url: "https://www.cartacapital.com.br/do-micro-ao-macro/profissionais-do-futuro-desenvolvem-habilidades-que-ampliam-o-poder-da-ia/",
  },
  {
    id: "3",
    title: {
      pt: "Denis Caldeira: de examinador de cabos a diretor, com receita de R$ 10 bilhões",
      en: "Denis Caldeira: from cable examiner to director, with revenue of R$ 10 billion",
    },
    outlet: "Terra",
    url: "https://www.terra.com.br/visao-do-corre/pega-a-visao/denis-caldeira-de-examinador-de-cabos-a-diretor-com-receita-de-r-10-bilhoes%2C154c8dd96534ec96be95d01210a1227fvoo85sik.html",
  },
  {
    id: "4",
    title: {
      pt: "Denis Caldeira é o novo conselheiro da Seguros Sura",
      en: "Denis Caldeira is the new advisor of Seguros Sura",
    },
    outlet: "Revista Cobertura",
    url: "https://www.revistacobertura.com.br/noticias/executivos-cia/denis-caldeira-e-o-novo-conselheiro-da-seguros-sura/",
  },
  {
    id: "5",
    title: {
      pt: "Relacionamento com cliente é o elo invisível que sustenta o crescimento",
      en: "Customer relationship is the invisible link that sustains growth",
    },
    outlet: "ClienteSA",
    url: "https://portal.clientesa.com.br/relacionamento-com-cliente-e-o-elo-invisivel-que-sustenta-o-crescimento/",
  },
  {
    id: "6",
    title: {
      pt: "A trajetória de Denis Caldeira, líder que transformou desafios em oportunidades",
      en: "The trajectory of Denis Caldeira, leader who turned challenges into opportunities",
    },
    outlet: "Business Moment",
    url: "https://businessmoment.com.br/a-trajetoria-de-denis-caldeira-lider-que-transformou-desafios-em-oportunidades/",
  },
];
