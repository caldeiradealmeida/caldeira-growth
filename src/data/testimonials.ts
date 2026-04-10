import type { Language } from "@/contexts/LanguageContext";

export type Testimonial = {
  id: string;
  quote: Record<Language, string>;
  name: string;
  role: string;
  company: string;
};

export const testimonials: Testimonial[] = [
  {
    id: "1",
    quote: {
      pt: "Denis traz clareza ao analisar cenários complexos e traduz isso em direcionamento prático. Sua capacidade de enfrentar divergências e estruturar conceitos de gestão para equipes multidisciplinares foi essencial para repensarmos nossos rumos. Uma experiência extremamente proveitosa.",
      en: "Denis brings clarity when analyzing complex scenarios and translates it into practical direction. His ability to address divergences and structure management concepts for multidisciplinary teams was essential for us to rethink our path. An extremely valuable experience.",
    },
    name: "Fabio Kadi",
    role: "Sócio Diretor",
    company: "Kadi Advogados",
  },
  {
    id: "2",
    quote: {
      pt: "Denis combina visão ampla com execução orientada a resultados. Ao longo da nossa jornada, trouxe insights e provocações que mudaram a forma como pensamos métricas e decisões estratégicas. Sua capacidade de conectar diferentes áreas é um diferencial claro.",
      en: "Denis combines broad vision with results-oriented execution. Throughout our journey, he brought insights and provocations that changed how we think about metrics and strategic decisions. His ability to connect different areas is a clear differentiator.",
    },
    name: "Alessandro Pacanowski",
    role: "CEO",
    company: "Roda Conveniência",
  },
];
