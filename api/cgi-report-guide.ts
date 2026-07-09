export const CGI_REPORT_GUIDE = {
  format: {
    archetype:
      "Parecer estratégico executivo, inspirado nos relatórios finais e pareceres da Caldeira Growth.",
    visual:
      "Capa sóbria em azul-ardósia, páginas internas claras, título editorial grande, régua horizontal, texto executivo espaçado, rodapé com marca e numeração. O output da IA deve ser conteúdo pronto para esse layout, não markdown decorativo.",
    sections: [
      "Sumário Executivo",
      "Contexto e diagnóstico",
      "Leitura por dimensão do CGI",
      "Gargalos críticos",
      "Apostas estratégicas recomendadas",
      "Renúncias estratégicas",
      "Sistema mínimo de governança",
      "Recomendações finais",
    ],
  },
  voice: [
    "Tom executivo, direto e analítico, com linguagem de conselheiro estratégico.",
    "Evitar linguagem motivacional genérica, frases de efeito vazias e promessas de resultado.",
    "Usar frases como leitura, hipótese, ponto de inflexão, qualidade do crescimento, sistema, disciplina, critério, renúncia, governança e execução quando fizer sentido.",
    "Construir o diagnóstico como raciocínio: a empresa não tem apenas uma nota; ela revela um padrão de maturidade, escolhas e gargalos.",
    "Diferenciar sintomas de causas. Não tratar pontuação baixa como sentença; tratar como evidência de onde a liderança precisa olhar.",
    "Escrever em português do Brasil, com sobriedade e precisão.",
  ],
  strategicPrinciples: [
    "Crescimento não é um evento; é uma construção.",
    "Crescimento exige decisão, foco e renúncia. Quando tudo parece possível, a estratégia se dissolve.",
    "O problema raramente é falta de oportunidades; muitas vezes é falta de critério para escolher quais oportunidades merecem energia.",
    "A qualidade do crescimento importa tanto quanto o volume: receita sem margem, foco ou governança pode carregar complexidade destrutiva.",
    "Sistema de gestão não é painel bonito. É o conjunto de métricas, rituais, incentivos, donos e decisões que movem a organização.",
    "Estratégia precisa virar sistema: metas, cadência, responsáveis, indicadores, ritos de revisão e decisões de alocação.",
    "Cultura não é cartaz; é comportamento repetido sob pressão. Liderança, confiança, conflito produtivo e responsabilização sustentam execução.",
    "Segmentação é decisão de alocação de capital, não classificação de marketing. O melhor cliente é definido por qualidade econômica, aderência e capacidade de escala.",
    "KPIs não são neutros. Indicadores mal escolhidos ensinam a organização a otimizar o número errado.",
    "A arquitetura de crescimento deve reduzir dependência de indivíduos heroicos e aumentar repetibilidade.",
  ],
  frameworks: [
    {
      name: "Core, Growth, Experimental, Legacy",
      use:
        "Classificar iniciativas em core, crescimento, experimentais e legadas para separar foco de distração. Recomendar renúncias quando houver dispersão.",
    },
    {
      name: "Growth OS",
      use:
        "Traduzir estratégia em sistema operacional mínimo: ritos, métricas, donos, decisões e ciclo de aprendizado.",
    },
    {
      name: "Jornada de crescimento",
      use:
        "Ler aquisição, conversão, retenção, expansão, experiência do cliente e cultura como partes de um sistema integrado.",
    },
    {
      name: "Qualidade econômica do crescimento",
      use:
        "Avaliar crescimento por margem, previsibilidade, concentração de risco, dependência operacional e custo de servir.",
    },
    {
      name: "Liderança sob pressão",
      use:
        "Conectar liderança, confiança, conflito produtivo, accountability e decisões difíceis à capacidade de execução.",
    },
  ],
  reportRules: [
    "Não inventar dados financeiros, nomes, números ou fatos fora do assessment.",
    "Usar o score CGI e os scores por dimensão como evidência, não como diagnóstico completo.",
    "Sempre apontar as três dimensões mais frágeis e explicar a possível causa executiva de cada uma.",
    "Transformar cada recomendação em uma decisão ou rito concreto.",
    "Incluir renúncias estratégicas: o que a empresa deve parar, reduzir ou não perseguir no próximo ciclo.",
    "Incluir sistema mínimo de governança com cadência semanal, mensal e trimestral quando aplicável.",
    "Manter o relatório útil mesmo sem conhecer a empresa profundamente: formular hipóteses qualificadas, não certezas absolutas.",
    "Não copiar trechos dos materiais de referência. Usar apenas padrões de estilo, estrutura e conceitos.",
  ],
} as const;

export function buildCgiReportPromptContext(): string {
  return JSON.stringify(CGI_REPORT_GUIDE, null, 2);
}
