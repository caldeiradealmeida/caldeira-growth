/**
 * Caldeira | The Board — landing de teste de demanda (somente PT).
 *
 * Regras de redação: o produto é um teste de estresse da decisão do investidor.
 * Nunca descrever como recomendação, indicação de compra ou venda, carteira
 * ou consultoria de investimentos. Não prometer retorno.
 *
 * Preços: teste de demanda. O botão leva ao formulário de acesso antecipado;
 * nada é cobrado nesta página.
 */

export type BoardOfferId = "sessao" | "pacote";

export const boardOffers: Array<{
  id: BoardOfferId;
  name: string;
  price: string;
  unit: string;
  detail: string;
  bullets: string[];
  cta: string;
  highlight?: boolean;
}> = [
  {
    id: "sessao",
    name: "1 sessão",
    price: "R$ 49",
    unit: "por tese analisada",
    detail: "Para testar o conselho com a decisão que está na sua mesa agora.",
    bullets: ["Uma tese, seis conselheiros", "Debate em até cinco rodadas", "Memorando final da sessão"],
    cta: "Quero 1 sessão",
  },
  {
    id: "pacote",
    name: "Pacote de 5 sessões",
    price: "R$ 197",
    unit: "R$ 39 por sessão · válido por 12 meses",
    detail: "Para quem quer levar ao conselho as próximas decisões do ano, sem prazo mensal.",
    bullets: ["Cinco teses, quando você precisar", "Debate em até cinco rodadas em cada uma", "Memorando final de cada sessão"],
    cta: "Quero o pacote",
    highlight: true,
  },
];

export const boardContent = {
  meta: {
    title: "Caldeira | The Board — o teste de estresse da sua decisão de investimento",
    description:
      "Antes de colocar o dinheiro, leve a sua tese a um conselho de seis especialistas sintéticos que debatem e discordam. Não é recomendação: é o teste de estresse da sua decisão.",
  },
  eyebrow: "Caldeira | The Board · conselho sintético de investimentos",
  heroTitle: "Quem discorda de você antes de você colocar o dinheiro?",
  heroText:
    "A maioria das decisões de investimento é tomada sozinha, ou com quem pensa igual. No The Board, você apresenta a sua tese a seis conselheiros que debatem, discordam e mostram o que você não viu.",
  primaryCta: "Quero acesso antecipado",
  secondaryCta: "Ver como funciona",
  videoTitle: "Uma sessão do conselho em 80 segundos",
  videoText:
    "Veja uma tese de exemplo passar pela mesa: cada conselheiro olha por um ângulo, eles se confrontam em rodadas e você sai com um memorando do que sustenta e do que ameaça a sua decisão.",
  videoLabel: "Assistir ao vídeo do The Board",
  videoDuration: "1 min 20 s",
  painTitle: "O risco não está só no ativo. Está em decidir sem contraditório.",
  painParagraphs: [
    "Quem investe por conta própria costuma ouvir as mesmas vozes: o próprio entusiasmo, o assessor que ganha com a operação, o grupo que já comprou. Ninguém nessa roda tem o papel de discordar.",
    "Fundos e family offices resolvem isso com um comitê: a tese só passa depois de ser atacada por gente que olha por ângulos diferentes. O The Board traz esse rito para a decisão do investidor pessoa física.",
  ],
  stepsTitle: "Como funciona uma sessão",
  steps: [
    { title: "Você apresenta a tese", body: "Descreva a decisão que está avaliando: o ativo ou negócio, o valor e por que acredita nela." },
    { title: "Seis conselheiros analisam", body: "Cada um olha por um ângulo e roda em um modelo de IA diferente, para que não pensem igual." },
    { title: "Eles debatem e discordam", body: "Em até cinco rodadas, com confronto direto entre as posições. Uma presidente de sessão conduz e não vota." },
    { title: "Você recebe o memorando", body: "A presidente consolida o parecer: o que sustenta a tese, o que a ameaça, onde o conselho divergiu e o que falta responder." },
  ],
  councilTitle: "Quem senta à mesa",
  councilIntro: "Seis especialistas sintéticos, cada um com uma lente, e uma presidente que conduz a sessão.",
  council: [
    { name: "Macrina", lens: "Macroeconomia" },
    { name: "Atlas", lens: "Geopolítica" },
    { name: "Venturine", lens: "Venture capital" },
    { name: "Toro", lens: "Ações e FIIs" },
    { name: "Selicia", lens: "Renda fixa" },
    { name: "Operis", lens: "Empresas privadas" },
    { name: "Ágora", lens: "Presidente de sessão · não vota" },
  ],
  isTitle: "O que o The Board é, e o que não é",
  isItems: [
    "É um teste de estresse da sua decisão: argumentos a favor, contra e pontos cegos.",
    "É um contraditório estruturado, feito por especialistas sintéticos (inteligência artificial).",
    "É um memorando para você decidir melhor, com a decisão sempre nas suas mãos.",
  ],
  isNotItems: [
    "Não é recomendação, indicação de compra ou venda, nem carteira sugerida.",
    "Não é consultoria nem análise de valores mobiliários, e não substitui um profissional habilitado.",
    "Não promete retorno. Modelos de IA erram: confira os dados antes de agir.",
  ],
  isLabel: "É",
  isNotLabel: "Não é",
  pricingTitle: "Acesso antecipado",
  pricingIntro:
    "Estamos liberando o The Board em lotes pequenos. Escolha como prefere usar e entre na lista: avisamos quando o seu acesso abrir. Nada é cobrado agora.",
  pricingNote: "Valores de lançamento para a lista de acesso antecipado. Você só paga quando o seu acesso for liberado.",
  formTitle: "Entre na lista de acesso",
  formIntro: "Três perguntas rápidas nos ajudam a liberar primeiro quem mais se beneficia do conselho.",
  form: {
    name: "Nome",
    email: "E-mail",
    offer: "Como prefere usar",
    wealth: "Quanto você tem investido hoje",
    wealthOptions: [
      "Até R$ 100 mil",
      "De R$ 100 mil a R$ 500 mil",
      "De R$ 500 mil a R$ 2 milhões",
      "Acima de R$ 2 milhões",
      "Prefiro não informar",
    ],
    how: "Como você decide hoje",
    howOptions: [
      "Sozinho",
      "Com assessor ou gerente",
      "Com relatórios de casa de análise",
      "Com amigos ou grupos",
      "De outra forma",
    ],
    thesis: "Que decisão você levaria ao conselho? (opcional)",
    thesisPlaceholder: "Ex.: entrar como sócio em uma empresa, concentrar em um setor, comprar um imóvel para renda.",
    select: "Selecione",
    consentBefore: "Ao enviar, você concorda em ser contatado sobre o The Board. Tratamos os seus dados conforme a nossa ",
    consentLink: "Política de Privacidade",
    submit: "Entrar na lista",
    sending: "Enviando...",
    invalid: "Preencha nome, e-mail e as duas perguntas de seleção.",
    error: "Não foi possível enviar agora. Tente de novo em instantes.",
    successTitle: "Você está na lista.",
    successText: "Avisaremos por e-mail quando o seu acesso for liberado. Os primeiros lotes são pequenos e abertos por ordem de inscrição e perfil.",
  },
  faqTitle: "Perguntas frequentes",
  faq: [
    { q: "O The Board me diz o que comprar?", a: "Não. Ele não recomenda ativos nem monta carteira. Você traz a decisão, e o conselho a coloca à prova." },
    { q: "Por que cada conselheiro usa um modelo de IA diferente?", a: "Para reduzir o risco de todos pensarem igual. Modelos diferentes erram de formas diferentes, e é no desacordo entre eles que aparecem os pontos cegos." },
    { q: "Serve para que tipo de decisão?", a: "Decisões relevantes e pouco frequentes: entrar em um negócio, concentrar posição, trocar de classe de ativo, comprar um imóvel para renda." },
    { q: "Quando terei acesso?", a: "O acesso é liberado em lotes. Quem entra na lista é avisado por e-mail, e só então decide se quer contratar." },
  ],
  finalTitle: "Leve a sua próxima decisão ao conselho",
  finalText: "O conselho debate. A decisão é sua.",
  finalCta: "Quero acesso antecipado",
  disclaimer:
    "O Caldeira | The Board é uma ferramenta de apoio à reflexão baseada em inteligência artificial. Não constitui recomendação, análise ou consultoria de valores mobiliários, nem oferta de investimento. As decisões e seus resultados são de responsabilidade exclusiva do usuário.",
} as const;
