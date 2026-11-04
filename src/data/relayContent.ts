import type { Language } from "@/lib/routing";

/**
 * Caldeira Relay — public page copy. Source: "Caldeira Relay - Prospecto"
 * (Drive, 03/11/2026). Do not name pilot clients here until they approve it,
 * and do not claim outcomes before the first real application.
 */

export type RelayDimension = { letter: string; name: string; statement: string };
export type RelayQuadrant = { name: string; body: string };

export type RelayContent = {
  meta: { title: string; description: string };
  eyebrow: string;
  heroTitle: string;
  heroText: string;
  primaryCta: string;
  secondaryCta: string;
  gapTitle: string;
  gapParagraphs: string[];
  stepsTitle: string;
  steps: Array<{ title: string; body: string }>;
  dimensionsTitle: string;
  dimensionsIntro: string;
  dimensions: RelayDimension[];
  scale: Array<{ range: string; label: string }>;
  panelTitle: string;
  panelIntro: string;
  quadrantAxes: { x: string; y: string };
  quadrants: RelayQuadrant[];
  panelItems: Array<{ title: string; body: string }>;
  whiteLabelTitle: string;
  whiteLabelBody: string;
  rigorTitle: string;
  rigor: string[];
  formatsTitle: string;
  formats: Array<{ name: string; body: string }>;
  finalTitle: string;
  finalText: string;
  finalCta: string;
};

export const relayContent: Record<Language, RelayContent> = {
  pt: {
    meta: {
      title: "Caldeira Relay | Diagnóstico de integração entre áreas",
      description:
        "Toda a organização responde em 5 minutos. O painel mostra onde o trabalho quebra entre uma área e outra antes que o cliente sinta, e mede de novo para provar que mudou.",
    },
    eyebrow: "Caldeira Relay · motor de diagnóstico entre áreas",
    heroTitle: "O termômetro das passagens entre áreas",
    heroText:
      "Toda a organização responde em 5 minutos. O painel mostra onde o trabalho quebra entre uma área e a outra, antes que o cliente sinta. E mede de novo para provar que mudou.",
    primaryCta: "Agendar uma demonstração",
    secondaryCta: "Como funciona",
    gapTitle: "O que as pesquisas de clima não medem",
    gapParagraphs: [
      "Pesquisas de clima perguntam como cada pessoa se sente na própria área. O cliente, porém, não compra de uma área: compra de uma cadeia. Venda, contrato, documentação e operação podem ir bem isoladamente e, ainda assim, o pedido chegar errado ao fim da linha.",
      "O Caldeira Relay mede o espaço entre as áreas: se o trabalho chega completo e na hora certa à área seguinte, e se as pessoas pensam como donas do resultado ou só da própria etapa.",
    ],
    stepsTitle: "Como funciona",
    steps: [
      { title: "Configurar", body: "No kickoff, a cadeia é desenhada com a liderança: áreas, jornada do pedido e fluxos paralelos." },
      { title: "Responder", body: "18 afirmações e a avaliação das passagens. Anônimo, cerca de 5 minutos, para toda a organização." },
      { title: "Ler", body: "Painel com índice, mapa, cadeia e matriz, e uma leitura executiva com as passagens críticas." },
      { title: "Medir de novo", body: "O mesmo questionário em pulsos e ciclos semestrais, para comparar e mostrar a evolução." },
    ],
    dimensionsTitle: "O que entra na conta",
    dimensionsIntro: "Seis dimensões de postura, medidas em cada pessoa e consolidadas por área.",
    dimensions: [
      { letter: "V", name: "Visão ponta a ponta", statement: "Sei como minha etapa aparece para o cliente." },
      { letter: "O", name: "Ownership", statement: "Respondo pelo resultado, não só pela minha parte." },
      { letter: "E", name: "Empatia entre áreas", statement: "Entendo as pressões da área ao lado." },
      { letter: "C", name: "Clareza de papéis", statement: "Sei o que é meu e o que é do outro." },
      { letter: "P", name: "Protagonismo", statement: "Ajo quando a regra não está clara." },
      { letter: "M", name: "Energia e confiança", statement: "Posso apontar problemas sem medo." },
    ],
    scale: [
      { range: "abaixo de 45", label: "conversar" },
      { range: "45 a 62", label: "atenção" },
      { range: "acima de 62", label: "ponto forte" },
    ],
    panelTitle: "O que o painel mostra",
    panelIntro:
      "Cada dimensão vai de 0 a 100, e o índice de integração é a média das seis. Mas o valor está em ver onde, entre quem e por quê.",
    quadrantAxes: { x: "Visão ponta a ponta e ownership", y: "Clareza de papéis e protagonismo" },
    quadrants: [
      { name: "Silo organizado", body: "Cada um sabe o que é seu, mas olha só para a própria etapa. Retrabalho que ninguém assume." },
      { name: "Uma só empresa", body: "Papéis claros e foco no cliente final. É onde se quer chegar." },
      { name: "Ilhas", body: "Nem clareza nem visão do todo. A área entrega e não sabe para quem." },
      { name: "Bombeiros", body: "Muito empenho pelo cliente, pouca clareza de quem faz o quê. Resolvem no heroísmo." },
    ],
    panelItems: [
      { title: "Placar de abertura", body: "Adesão, índice de integração, a passagem mais frágil e a dimensão mais frágil. Em quatro números, onde começar a conversa." },
      { title: "Cadeia de passagens", body: "Quem recebe dá a nota: o trabalho chegou completo e na hora certa? A cadeia aceita fluxos paralelos." },
      { title: "Matriz de passagens", body: "Todas as combinações entre áreas. Aparecem as dependências que ninguém desenhou." },
      { title: "Dimensões por área", body: "Mostra se o problema é de clareza, de ownership ou de confiança, e onde." },
      { title: "Evolução", body: "Linha de base, pulsos de 30 e 60 dias e reaplicação no dia 90, sempre na mesma escala." },
      { title: "Placar de acordos", body: "Cada acordo entre duas áreas vira uma métrica compartilhada, com meta, dono e revisão mensal. Accountability com número." },
    ],
    whiteLabelTitle: "Com a marca da sua empresa",
    whiteLabelBody:
      "O Relay é o motor. Na frente vai o nome do programa da sua empresa, para que as pessoas respondam a uma iniciativa interna, e não a uma pesquisa de fornecedor.",
    rigorTitle: "Rigor e anonimato",
    rigor: [
      "Área exibida só com 5 respostas ou mais; passagem, com 3 avaliações ou mais.",
      "Sem nome, e-mail, saúde ou vida pessoal. Tratamento conforme a LGPD.",
      "Base em coordenação relacional (Gittell), clareza de papéis (Rizzo, House e Lirtzman) e segurança psicológica (Edmondson).",
      "Consistência interna e estrutura fatorial verificadas a partir das aplicações reais.",
    ],
    formatsTitle: "Formatos",
    formats: [
      { name: "Diagnóstico Relay", body: "Uma aplicação com painel e leitura executiva." },
      { name: "Ciclo de 90 dias", body: "Linha de base, dois pulsos e reaplicação." },
      { name: "Relay recorrente", body: "Ciclo semestral para manter a tração." },
      { name: "Relay + workshop", body: "O diagnóstico define a pauta do encontro com a liderança." },
    ],
    finalTitle: "Veja o painel funcionando",
    finalText: "Em 30 minutos, mostramos o painel com dados de demonstração e desenhamos como seria a cadeia da sua empresa.",
    finalCta: "Agendar uma demonstração",
  },
  en: {
    meta: {
      title: "Caldeira Relay | Cross-department integration diagnostic",
      description:
        "The whole organization answers in 5 minutes. The dashboard shows where work breaks between departments before the client feels it, and measures again to prove it changed.",
    },
    eyebrow: "Caldeira Relay · cross-department diagnostic engine",
    heroTitle: "The thermometer for handoffs between departments",
    heroText:
      "The whole organization answers in 5 minutes. The dashboard shows where work breaks between one department and the next, before the client feels it. Then it measures again to prove it changed.",
    primaryCta: "Book a demo",
    secondaryCta: "How it works",
    gapTitle: "What engagement surveys don't measure",
    gapParagraphs: [
      "Engagement surveys ask how each person feels in their own department. Clients, however, don't buy from a department: they buy from a chain. Sales, contracts, documentation and operations can each do well on their own, and the order can still arrive wrong at the end of the line.",
      "Caldeira Relay measures the space between departments: whether work reaches the next team complete and on time, and whether people think like owners of the outcome or only of their own step.",
    ],
    stepsTitle: "How it works",
    steps: [
      { title: "Configure", body: "At kickoff, leadership maps the chain: departments, the order journey and parallel flows." },
      { title: "Respond", body: "18 statements plus a rating of each handoff. Anonymous, about 5 minutes, for the whole organization." },
      { title: "Read", body: "A dashboard with index, map, chain and matrix, and an executive reading of the critical handoffs." },
      { title: "Measure again", body: "The same questionnaire in pulses and six-month cycles, to compare and show progress." },
    ],
    dimensionsTitle: "What goes into the score",
    dimensionsIntro: "Six behavioral dimensions, measured for each person and consolidated by department.",
    dimensions: [
      { letter: "V", name: "End-to-end view", statement: "I know how my step shows up for the client." },
      { letter: "O", name: "Ownership", statement: "I answer for the outcome, not just my part." },
      { letter: "E", name: "Cross-team empathy", statement: "I understand the pressures on the team next to mine." },
      { letter: "C", name: "Role clarity", statement: "I know what is mine and what belongs to others." },
      { letter: "P", name: "Initiative", statement: "I act when the rule is not clear." },
      { letter: "M", name: "Energy and trust", statement: "I can raise problems without fear." },
    ],
    scale: [
      { range: "below 45", label: "talk" },
      { range: "45 to 62", label: "watch" },
      { range: "above 62", label: "strength" },
    ],
    panelTitle: "What the dashboard shows",
    panelIntro:
      "Each dimension runs from 0 to 100, and the integration index is the average of the six. The value is in seeing where, between whom and why.",
    quadrantAxes: { x: "End-to-end view and ownership", y: "Role clarity and initiative" },
    quadrants: [
      { name: "Organized silo", body: "Everyone knows what is theirs, but only looks at their own step. Rework nobody owns." },
      { name: "One company", body: "Clear roles and focus on the end client. This is where you want to be." },
      { name: "Islands", body: "Neither clarity nor a view of the whole. The team delivers without knowing to whom." },
      { name: "Firefighters", body: "Strong commitment to the client, little clarity on who does what. They solve it through heroics." },
    ],
    panelItems: [
      { title: "Opening scoreboard", body: "Participation, integration index, the weakest handoff and the weakest dimension. Four numbers that tell you where to start." },
      { title: "Handoff chain", body: "The receiving team gives the score: did the work arrive complete and on time? Parallel flows are supported." },
      { title: "Handoff matrix", body: "Every combination between departments. It surfaces the dependencies nobody mapped." },
      { title: "Dimensions by department", body: "Shows whether the problem is clarity, ownership or trust, and where." },
      { title: "Progress", body: "Baseline, 30- and 60-day pulses and a re-run on day 90, always on the same scale." },
      { title: "Agreements scoreboard", body: "Each agreement between two departments becomes a shared metric with a target, an owner and a monthly review. Accountability with numbers." },
    ],
    whiteLabelTitle: "Under your company's brand",
    whiteLabelBody:
      "Relay is the engine. Your program's own name goes on the front, so people respond to an internal initiative rather than a vendor survey.",
    rigorTitle: "Rigor and anonymity",
    rigor: [
      "A department is shown only with 5 or more responses; a handoff, with 3 or more ratings.",
      "No names, emails, health or personal-life data. Processed in line with data-protection law (LGPD).",
      "Grounded in relational coordination (Gittell), role clarity (Rizzo, House and Lirtzman) and psychological safety (Edmondson).",
      "Internal consistency and factor structure checked from real applications onward.",
    ],
    formatsTitle: "Formats",
    formats: [
      { name: "Relay diagnostic", body: "One application with dashboard and executive reading." },
      { name: "90-day cycle", body: "Baseline, two pulses and a re-run." },
      { name: "Recurring Relay", body: "A six-month cycle to keep momentum." },
      { name: "Relay + workshop", body: "The diagnostic sets the agenda for the leadership session." },
    ],
    finalTitle: "See the dashboard in action",
    finalText: "In 30 minutes we walk you through the dashboard with demo data and sketch what your company's chain would look like.",
    finalCta: "Book a demo",
  },
  es: {
    meta: {
      title: "Caldeira Relay | Diagnóstico de integración entre áreas",
      description:
        "Toda la organización responde en 5 minutos. El panel muestra dónde se rompe el trabajo entre un área y otra antes de que el cliente lo sienta, y vuelve a medir para demostrar que cambió.",
    },
    eyebrow: "Caldeira Relay · motor de diagnóstico entre áreas",
    heroTitle: "El termómetro de los traspasos entre áreas",
    heroText:
      "Toda la organización responde en 5 minutos. El panel muestra dónde se rompe el trabajo entre un área y la siguiente, antes de que el cliente lo sienta. Y vuelve a medir para demostrar que cambió.",
    primaryCta: "Agendar una demostración",
    secondaryCta: "Cómo funciona",
    gapTitle: "Lo que las encuestas de clima no miden",
    gapParagraphs: [
      "Las encuestas de clima preguntan cómo se siente cada persona en su propia área. Pero el cliente no le compra a un área: le compra a una cadena. Ventas, contratos, documentación y operación pueden funcionar bien por separado y, aun así, el pedido llegar mal al final de la línea.",
      "Caldeira Relay mide el espacio entre las áreas: si el trabajo llega completo y a tiempo al área siguiente, y si las personas piensan como dueñas del resultado o solo de su propia etapa.",
    ],
    stepsTitle: "Cómo funciona",
    steps: [
      { title: "Configurar", body: "En el kickoff, la cadena se diseña con el liderazgo: áreas, recorrido del pedido y flujos paralelos." },
      { title: "Responder", body: "18 afirmaciones y la evaluación de los traspasos. Anónimo, unos 5 minutos, para toda la organización." },
      { title: "Leer", body: "Panel con índice, mapa, cadena y matriz, y una lectura ejecutiva con los traspasos críticos." },
      { title: "Volver a medir", body: "El mismo cuestionario en pulsos y ciclos semestrales, para comparar y mostrar la evolución." },
    ],
    dimensionsTitle: "Qué entra en la cuenta",
    dimensionsIntro: "Seis dimensiones de actitud, medidas en cada persona y consolidadas por área.",
    dimensions: [
      { letter: "V", name: "Visión de punta a punta", statement: "Sé cómo aparece mi etapa para el cliente." },
      { letter: "O", name: "Ownership", statement: "Respondo por el resultado, no solo por mi parte." },
      { letter: "E", name: "Empatía entre áreas", statement: "Entiendo las presiones del área de al lado." },
      { letter: "C", name: "Claridad de roles", statement: "Sé qué es mío y qué es del otro." },
      { letter: "P", name: "Protagonismo", statement: "Actúo cuando la regla no está clara." },
      { letter: "M", name: "Energía y confianza", statement: "Puedo señalar problemas sin miedo." },
    ],
    scale: [
      { range: "menos de 45", label: "conversar" },
      { range: "45 a 62", label: "atención" },
      { range: "más de 62", label: "fortaleza" },
    ],
    panelTitle: "Qué muestra el panel",
    panelIntro:
      "Cada dimensión va de 0 a 100, y el índice de integración es el promedio de las seis. Pero el valor está en ver dónde, entre quiénes y por qué.",
    quadrantAxes: { x: "Visión de punta a punta y ownership", y: "Claridad de roles y protagonismo" },
    quadrants: [
      { name: "Silo organizado", body: "Cada uno sabe qué es suyo, pero mira solo su propia etapa. Retrabajo que nadie asume." },
      { name: "Una sola empresa", body: "Roles claros y foco en el cliente final. Es adonde se quiere llegar." },
      { name: "Islas", body: "Ni claridad ni visión del todo. El área entrega y no sabe para quién." },
      { name: "Bomberos", body: "Mucho compromiso con el cliente, poca claridad sobre quién hace qué. Resuelven con heroísmo." },
    ],
    panelItems: [
      { title: "Marcador inicial", body: "Participación, índice de integración, el traspaso más frágil y la dimensión más frágil. Cuatro números para saber por dónde empezar." },
      { title: "Cadena de traspasos", body: "La nota la da quien recibe: ¿el trabajo llegó completo y a tiempo? La cadena admite flujos paralelos." },
      { title: "Matriz de traspasos", body: "Todas las combinaciones entre áreas. Aparecen las dependencias que nadie dibujó." },
      { title: "Dimensiones por área", body: "Muestra si el problema es de claridad, de ownership o de confianza, y dónde." },
      { title: "Evolución", body: "Línea de base, pulsos a los 30 y 60 días y nueva aplicación el día 90, siempre en la misma escala." },
      { title: "Marcador de acuerdos", body: "Cada acuerdo entre dos áreas se convierte en una métrica compartida, con meta, responsable y revisión mensual. Accountability con números." },
    ],
    whiteLabelTitle: "Con la marca de su empresa",
    whiteLabelBody:
      "Relay es el motor. Al frente va el nombre del programa de su empresa, para que las personas respondan a una iniciativa interna y no a una encuesta de un proveedor.",
    rigorTitle: "Rigor y anonimato",
    rigor: [
      "Un área se muestra solo con 5 respuestas o más; un traspaso, con 3 evaluaciones o más.",
      "Sin nombre, correo, salud ni vida personal. Tratamiento conforme a la ley de protección de datos (LGPD).",
      "Basado en coordinación relacional (Gittell), claridad de roles (Rizzo, House y Lirtzman) y seguridad psicológica (Edmondson).",
      "Consistencia interna y estructura factorial verificadas a partir de las aplicaciones reales.",
    ],
    formatsTitle: "Formatos",
    formats: [
      { name: "Diagnóstico Relay", body: "Una aplicación con panel y lectura ejecutiva." },
      { name: "Ciclo de 90 días", body: "Línea de base, dos pulsos y nueva aplicación." },
      { name: "Relay recurrente", body: "Ciclo semestral para mantener la tracción." },
      { name: "Relay + workshop", body: "El diagnóstico define la agenda del encuentro con el liderazgo." },
    ],
    finalTitle: "Vea el panel en funcionamiento",
    finalText: "En 30 minutos le mostramos el panel con datos de demostración y diseñamos cómo sería la cadena de su empresa.",
    finalCta: "Agendar una demostración",
  },
};
