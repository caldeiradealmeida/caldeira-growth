import type { Language } from "@/contexts/LanguageContext";
import { articleBodies } from "./articleBodies";

import cover530 from "@/assets/articles/530-livros-em-7-dias.png";
import coverExperimento650 from "@/assets/articles/experimento-650.png";
import coverVortex from "@/assets/articles/vortex-do-crescimento.png";
import coverJornada from "@/assets/articles/jornada-autor.png";
import coverIa from "@/assets/articles/pensamento-critico-ia.png";
import coverSorte from "@/assets/articles/sorte-ajuda-ousados.png";
import coverRumos from "@/assets/articles/rumos-metas-objetivos.png";
import coverIntuicao from "@/assets/articles/intuicao-dashboards.png";
import coverModelo from "@/assets/articles/modelo-de-negocio.png";
import coverTitulos from "@/assets/articles/titulos-quem-e-voce.png";
import coverVenda from "@/assets/articles/venda-sem-pedir-permissao.png";
import coverSenior from "@/assets/articles/senior-tarefas-simples.png";

export type Article = {
  id: string;
  slug: string;
  title: Record<"pt" | "en", string> & Partial<Record<Language, string>>;
  excerpt: Record<"pt" | "en", string> & Partial<Record<Language, string>>;
  content: Record<"pt" | "en", string> & Partial<Record<Language, string>>;
  cover: string;
  date: string;
  sourceName?: string;
  sourceUrl?: string;
};

type ArticleMeta = {
  id: string;
  slug: keyof typeof articleBodies;
  date: string;
  cover: string;
  title: Record<"pt" | "en", string> & Partial<Record<Language, string>>;
  excerpt: Record<"pt" | "en", string> & Partial<Record<Language, string>>;
};

const articleMeta: ArticleMeta[] = [
  {
    id: "1",
    slug: "como-vender-530-livros-sistema",
    date: "2026-02",
    cover: cover530,
    title: {
      pt: "Como vender 530 livros em 7 dias: o sistema por trás do experimento",
      en: "How 530 books sold in 7 days: the system behind the experiment",
    },
    excerpt: {
      pt: "Por que transformei o lançamento em experimento público e como medi o que ainda estava sob meu controle.\nDa meta de 650 ao resultado de 530 — e o que isso revela sobre crescimento, não só sobre livros.",
      en: "Why I turned the launch into a public experiment—and how I measured what I could still control.\nFrom the 650 goal to 530 sold—and what that reveals about growth, not just books.",
    },
  },
  {
    id: "2",
    slug: "experimento-650",
    date: "2026-01",
    cover: coverExperimento650,
    title: {
      pt: "O Experimento 650: colocando a estratégia na arena",
      en: "The 650 Experiment: taking strategy into the arena",
    },
    excerpt: {
      pt: "O mercado não é papel: é arena. Uma meta pública para testar coerência entre o que defendo e o que executo.\nTrabalho é força vezes deslocamento — e o painel em tempo real está aberto.",
      en: "The market is not paper—it is an arena. A public goal to test coherence between what I preach and what I execute.\nWork is force times displacement—and the live dashboard is open.",
    },
  },
  {
    id: "3",
    slug: "vortex-do-crescimento",
    date: "2025-11",
    cover: coverVortex,
    title: {
      pt: "O Vortex do Crescimento",
      en: "The Growth Vortex",
    },
    excerpt: {
      pt: "Por que esforço sem deslocamento não gera crescimento — e como concentrar energia em um movimento único de tração.\nDo funil ao sistema gravitacional que alinha marketing, vendas, produto e atendimento.",
      en: "Why effort without displacement does not create growth—and how to concentrate energy in one traction motion.\nFrom funnel to a gravitational system aligning marketing, sales, product, and service.",
    },
  },
  {
    id: "4",
    slug: "jornada-autor",
    date: "2025-09",
    cover: coverJornada,
    title: {
      pt: "A jornada de um autor que nunca planejou ser autor",
      en: "The journey of an author who never planned to be one",
    },
    excerpt: {
      pt: "Do “não está nos meus planos” ao manuscrito em seis meses — pressão social, escolha do que entra no livro e a segunda metade: vender.\nLançar livro é lançar produto; sem go-to-market, você só tem arquivo bonito.",
      en: "From “not in my plans” to a manuscript in six months—social pressure, curating what belongs in the book, and the second half: selling.\nLaunching a book is launching a product; without GTM you only have a pretty file.",
    },
  },
  {
    id: "5",
    slug: "habilidades-ia-lideres-exponenciais",
    date: "2025-08",
    cover: coverIa,
    title: {
      pt: "5 habilidades que separam usuários de IA de líderes exponenciais",
      en: "Five skills that separate AI users from exponential leaders",
    },
    excerpt: {
      pt: "A habilidade mais valiosa não é saber programar — é saber o que perguntar.\nClareza, síntese, estrutura, contexto e criatividade: o que não aparece no LinkedIn mas decide na mesa.",
      en: "The most valuable skill is not coding—it is knowing what to ask.\nClarity, synthesis, structure, context, and creativity: what résumés miss but meetings reward.",
    },
  },
  {
    id: "6",
    slug: "sorte-ajuda-ousados",
    date: "2025-07",
    cover: coverSorte,
    title: {
      pt: "A sorte ajuda os ousados",
      en: "Fortune favors the bold",
    },
    excerpt: {
      pt: "Por que tomar riscos calculados pode abrir portas — e por que diligência não elimina risco, só o torna inteligível.\nDa crise ao investimento contrário: coragem não é ausência de medo.",
      en: "Why calculated risk can open doors—and why diligence does not eliminate risk, only makes it legible.\nFrom crisis to contrarian bets: courage is not absence of fear.",
    },
  },
  {
    id: "7",
    slug: "rumos-metas-objetivos",
    date: "2025-06",
    cover: coverRumos,
    title: {
      pt: "Você define o curso da sua vida ou segue o roteiro dos outros?",
      en: "Do you set your life’s course—or follow someone else’s script?",
    },
    excerpt: {
      pt: "Por que escrever objetivos à mão consolida intenção — e como listas de tarefas viram marcos rumo ao que importa.\nFast Forward Vision, dopamina e permissão para mudar de meta no meio do caminho.",
      en: "Why handwriting goals consolidates intention—and how task lists become milestones toward what matters.\nFast Forward Vision, dopamine, and permission to change goals mid-course.",
    },
  },
  {
    id: "8",
    slug: "intuicao-dashboards-decisoes",
    date: "2025-05",
    cover: coverIntuicao,
    title: {
      pt: "Entre dashboards e decisões: por que sua intuição importa mais do que você pensa",
      en: "Between dashboards and decisions: why your intuition matters more than you think",
    },
    excerpt: {
      pt: "Intuição não é mágica — é memória processada em silêncio. Kahneman, Jung e o que o corpo sabe antes do Excel.\nQuando os dados emudecem, quem lidera precisa de outra bússola.",
      en: "Intuition is not magic—it is memory processed in silence. Kahneman, Jung, and what your body knows before Excel.\nWhen dashboards go quiet, leaders need another compass.",
    },
  },
  {
    id: "9",
    slug: "modelo-negocio-valor",
    date: "2025-04",
    cover: coverModelo,
    title: {
      pt: "Você saberia explicar, em uma frase, como sua empresa gera e captura valor?",
      en: "Could you explain in one sentence how your company creates and captures value?",
    },
    excerpt: {
      pt: "Modelo de negócio é o binômio entrega e captura de valor — e por ele raramente entra na pauta de reunião.\nMarketplace, SaaS, assinatura: o melhor modelo é o que encaixa no problema do cliente.",
      en: "A business model is how you deliver and capture value—yet it rarely makes the executive agenda.\nMarketplace, SaaS, subscription: the best model fits the customer’s problem.",
    },
  },
  {
    id: "10",
    slug: "ex-vp-titulos-identidade",
    date: "2025-03",
    cover: coverTitulos,
    title: {
      pt: "Ex-VP não entra. Quem é você sem seus títulos?",
      en: "Ex-VP doesn’t get in. Who are you without your titles?",
    },
    excerpt: {
      pt: "A história do convite ao summit que sumiu quando eu deixei a empresa — e por que títulos são chaves de acesso.\nShow me the money: além do cargo, o que você entrega quando a porta abre?",
      en: "The summit invite that vanished when I left the company—and why titles are access keys.\n“Show me the money”: beyond the role, what do you bring when the door opens?",
    },
  },
  {
    id: "11",
    slug: "venda-sem-pedir-permissao",
    date: "2025-02",
    cover: coverVenda,
    title: {
      pt: "A venda começa quando você para de pedir permissão",
      en: "Selling starts when you stop asking permission",
    },
    excerpt: {
      pt: "Crenças limitantes, preconceito com “vendedor” e a verdade que ninguém quer ouvir: você já vende o tempo todo.\nNegociar é humano — a coleira invisível só existe se você aceitar.",
      en: "Limiting beliefs, prejudice against “sales,” and the truth we avoid: you are always selling.\nNegotiation is human—the invisible leash only exists if you accept it.",
    },
  },
  {
    id: "12",
    slug: "senior-tarefas-simples",
    date: "2025-01",
    cover: coverSenior,
    title: {
      pt: "Você é sênior o suficiente para executar tarefas simples?",
      en: "Are you senior enough to execute simple tasks?",
    },
    excerpt: {
      pt: "A lição do Google: “Quero que seja executada no seu nível.” Excelência em tarefa básia envia mensagem ao time.\nComo o judoca: faixa preta e ainda assim começa aos fundamentos.",
      en: "The Google lesson: “I want it executed at your level.” Excellence on a basic task signals to the team.\nLike the judoka: black belt—and still starting with fundamentals.",
    },
  },
];

export const articles: Article[] = articleMeta.map((m) => {
  const body = articleBodies[m.slug];
  return {
    id: m.id,
    slug: m.slug,
    title: m.title,
    excerpt: m.excerpt,
    date: m.date,
    cover: m.cover,
    content: { pt: body.pt, en: body.en },
  };
});

export function getArticleBySlug(slug: string): Article | undefined {
  return articles.find((a) => a.slug === slug);
}

export function articleLang(lang: Language): "pt" | "en" {
  return lang === "pt" ? "pt" : "en";
}
