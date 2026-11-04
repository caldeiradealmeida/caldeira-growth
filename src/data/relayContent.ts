import type { Language } from "@/lib/routing";

/**
 * Caldeira Relay — public page copy. Source: "Caldeira Relay - Prospecto"
 * (Drive, 03/11/2026). Do not name pilot clients here until they approve it,
 * and do not claim outcomes before the first real application.
 */

export type RelayPanelImage =
  | "placar"
  | "mapa"
  | "cadeia"
  | "matriz"
  | "organizacao"
  | "dimensoes-por-area"
  | "evolucao"
  | "acordos";

export type RelayDimension = { letter: string; name: string; statement: string };

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
  panelNote: string;
  panelItems: Array<{ image: RelayPanelImage; title: string; body: string }>;
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
    panelNote: "Exemplo com dados fictícios: 224 pessoas, 9 áreas, 182 respostas.",
    panelItems: [
      { image: "placar", title: "Placar de abertura", body: "Adesão, índice de integração, a passagem mais frágil e a dimensão mais frágil. Em quatro números, onde começar a conversa." },
      { image: "mapa", title: "Mapa de quadrantes", body: "Cada ponto é uma área, do tamanho do seu número de respostas. Mostra quem já funciona como uma só empresa e quem está em silo, em ilha ou apagando incêndio." },
      { image: "organizacao", title: "A organização como um todo", body: "As seis dimensões na média geral. No exemplo, ownership é ponto forte (64) e clareza de papéis é a mais frágil (48)." },
      { image: "cadeia", title: "Cadeia de passagens", body: "Quem recebe dá a nota: o trabalho chegou completo e na hora certa? No exemplo, Vendas → Processamento (33) e Documentação → Operação (39) são as passagens a atacar." },
      { image: "matriz", title: "Matriz de passagens", body: "Todas as combinações entre áreas: a linha entrega, a coluna recebe e dá a nota. Aparecem as dependências que ninguém desenhou." },
      { image: "dimensoes-por-area", title: "Dimensões por área", body: "As mesmas seis dimensões em cada área. Mostra se o problema é de clareza, de ownership ou de confiança, e onde." },
      { image: "evolucao", title: "Evolução em 90 dias", body: "Linha de base, pulsos de 30 e 60 dias e reaplicação no dia 90. No exemplo, a passagem Vendas → Processamento vai de 33 a 63 depois do acordo firmado no workshop." },
      { image: "acordos", title: "Placar de acordos", body: "Cada acordo entre duas áreas vira uma métrica compartilhada, com meta, dono e revisão mensal. Os números vêm da operação, não do questionário." },
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
    panelNote: "Example with fictitious data: 224 people, 9 departments, 182 responses. Dashboard shown in Portuguese.",
    panelItems: [
      { image: "placar", title: "Opening scoreboard", body: "Participation, integration index, the weakest handoff and the weakest dimension. Four numbers that tell you where to start." },
      { image: "mapa", title: "Quadrant map", body: "Each dot is a department, sized by its number of responses. It shows who already works as one company and who is in a silo, on an island or firefighting." },
      { image: "organizacao", title: "The organization as a whole", body: "The six dimensions on the overall average. In the example, ownership is a strength (64) and role clarity is the weakest (48)." },
      { image: "cadeia", title: "Handoff chain", body: "The receiving team gives the score: did the work arrive complete and on time? In the example, Sales → Processing (33) and Documentation → Operations (39) are the handoffs to tackle." },
      { image: "matriz", title: "Handoff matrix", body: "Every combination between departments: the row delivers, the column receives and scores. It surfaces the dependencies nobody mapped." },
      { image: "dimensoes-por-area", title: "Dimensions by department", body: "The same six dimensions for each department. It shows whether the problem is clarity, ownership or trust, and where." },
      { image: "evolucao", title: "Progress over 90 days", body: "Baseline, 30- and 60-day pulses and a re-run on day 90. In the example, Sales → Processing goes from 33 to 63 after the agreement made in the workshop." },
      { image: "acordos", title: "Agreements scoreboard", body: "Each agreement between two departments becomes a shared metric with a target, an owner and a monthly review. The numbers come from operations, not from the questionnaire." },
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
    panelNote: "Ejemplo con datos ficticios: 224 personas, 9 áreas, 182 respuestas. Panel en portugués.",
    panelItems: [
      { image: "placar", title: "Marcador inicial", body: "Participación, índice de integración, el traspaso más frágil y la dimensión más frágil. Cuatro números para saber por dónde empezar." },
      { image: "mapa", title: "Mapa de cuadrantes", body: "Cada punto es un área, del tamaño de su número de respuestas. Muestra quién ya funciona como una sola empresa y quién está en un silo, en una isla o apagando incendios." },
      { image: "organizacao", title: "La organización en su conjunto", body: "Las seis dimensiones en el promedio general. En el ejemplo, ownership es fortaleza (64) y claridad de roles es la más frágil (48)." },
      { image: "cadeia", title: "Cadena de traspasos", body: "La nota la da quien recibe: ¿el trabajo llegó completo y a tiempo? En el ejemplo, Ventas → Procesamiento (33) y Documentación → Operación (39) son los traspasos a atacar." },
      { image: "matriz", title: "Matriz de traspasos", body: "Todas las combinaciones entre áreas: la fila entrega, la columna recibe y da la nota. Aparecen las dependencias que nadie dibujó." },
      { image: "dimensoes-por-area", title: "Dimensiones por área", body: "Las mismas seis dimensiones en cada área. Muestra si el problema es de claridad, de ownership o de confianza, y dónde." },
      { image: "evolucao", title: "Evolución en 90 días", body: "Línea de base, pulsos a los 30 y 60 días y nueva aplicación el día 90. En el ejemplo, Ventas → Procesamiento pasa de 33 a 63 tras el acuerdo firmado en el workshop." },
      { image: "acordos", title: "Marcador de acuerdos", body: "Cada acuerdo entre dos áreas se convierte en una métrica compartida, con meta, responsable y revisión mensual. Los números vienen de la operación, no del cuestionario." },
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
