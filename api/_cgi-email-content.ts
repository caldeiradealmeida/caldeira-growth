// Pure, testable construction of the two automated CGI participant emails
// (report-ready, abandonment). Deliberately built here in TypeScript, not in
// Apps Script, so the actual copy/HTML/escaping logic runs through the same
// Vitest suite as the rest of the codebase -- Apps Script only ever receives
// an already-rendered {subject, plainText, htmlBody} and relays it via
// MailApp.sendEmail, it does not template anything itself.
//
// Tone/copy match the exact brief: personal, executive, sober -- no hype, no
// emojis, no urgency, no "Parabéns", no meeting request. Not localized
// (pt only) -- the report-access link itself is already pt-only today
// (Etapa 1/3), so this introduces no new gap.

export type CgiEmailContent = {
  subject: string;
  plainText: string;
  htmlBody: string;
};

const SIGNATURE_PLAIN = "Denis Caldeira\nCEO e Founder\nCaldeira Growth Consulting";
const SIGNATURE_HTML =
  "Denis Caldeira<br />CEO e Founder<br />Caldeira Growth Consulting";

export function escapeHtml(value: string): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** Collapses runs of whitespace and trims -- the only normalization applied
 * to an already-generated executive_summary. Never rewrites content. */
function normalizeWhitespace(value: string): string {
  return String(value ?? "").replace(/\s+/g, " ").trim();
}

/** Extracts executive_summary from the same JSON string already produced by
 * report generation (ai.text / normalizeGeneratedReportJson) -- no second
 * OpenAI call, no re-generation. Returns null (not a placeholder) on any
 * parse failure or missing/empty field, so callers can degrade safely
 * instead of inventing generic copy the report doesn't actually contain. */
export function extractExecutiveSummary(aiReportJson: string): string | null {
  if (!aiReportJson) return null;
  let parsed: unknown;
  try {
    parsed = JSON.parse(aiReportJson);
  } catch {
    return null;
  }
  if (!parsed || typeof parsed !== "object") return null;
  const raw = (parsed as Record<string, unknown>).executive_summary;
  if (typeof raw !== "string") return null;
  const normalized = normalizeWhitespace(raw);
  return normalized.length > 0 ? normalized : null;
}

function htmlShell(bodyHtml: string): string {
  return `<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
  </head>
  <body style="margin:0;padding:0;background-color:#f5f4f1;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f5f4f1;padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background-color:#ffffff;border-radius:8px;overflow:hidden;">
            <tr>
              <td style="padding:40px 40px 32px 40px;font-family:Georgia,'Times New Roman',serif;color:#1a1a1a;font-size:16px;line-height:1.6;">
                ${bodyHtml}
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

// --- Estilo pessoal -------------------------------------------------------
//
// htmlShell acima e o layout de PECA: fundo bege (#f5f4f1), card branco com
// canto arredondado, 40px de respiro e serifa. Funciona para a entrega do
// relatorio, que e um documento. Nao funciona para uma mensagem curta que
// deveria parecer escrita a mao -- ali o proprio enquadramento anuncia
// "isto saiu de um sistema" antes da primeira palavra ser lida.
//
// Este shell e o oposto: fundo branco, nenhum container, nenhuma borda,
// nenhum raio, sans-serif neutra. Sobra o minimo que um cliente de e-mail
// precisa para renderizar HTML de forma previsivel -- doctype, charset,
// viewport e uma largura maxima para nao virar uma linha de 200 caracteres
// numa tela larga. Nada disso e decoracao; e legibilidade.
function personalHtmlShell(bodyHtml: string): string {
  return `<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
  </head>
  <body style="margin:0;padding:0;background-color:#ffffff;">
    <div style="max-width:600px;padding:16px;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.5;color:#222222;">
      ${bodyHtml}
    </div>
  </body>
</html>`;
}

/** Link como texto, do jeito que ele apareceria num e-mail digitado: a propria
 * URL visivel, sem botao e sem rotulo de campanha. */
function plainLinkHtml(url: string): string {
  const seguro = escapeHtml(url);
  return `<a href="${seguro}" style="color:#1155cc;">${seguro}</a>`;
}

function ctaButtonHtml(label: string, url: string): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:28px 0;">
    <tr>
      <td style="border-radius:4px;background-color:#1a1a1a;">
        <a href="${escapeHtml(url)}" style="display:inline-block;padding:14px 28px;font-family:Georgia,'Times New Roman',serif;font-size:15px;color:#ffffff;text-decoration:none;">${escapeHtml(label)}</a>
      </td>
    </tr>
  </table>`;
}

export function buildCgiReportReadyEmail(input: {
  name: string;
  company: string;
  executiveSummary: string;
  reportAccessUrl: string;
  /** Reentrada de opt-in. Omitido quando a pessoa ja consentiu, ou quando o
   * token de contato nao esta configurado -- nos dois casos a linha
   * simplesmente nao existe. */
  insightsOptInUrl?: string | null;
}): CgiEmailContent {
  const name = String(input.name || "").trim();
  const company = String(input.company || "").trim();
  const summary = String(input.executiveSummary || "").trim();
  const url = input.reportAccessUrl;
  const optInUrl = String(input.insightsOptInUrl || "").trim();

  // Uma linha, no rodape, depois da assinatura. O e-mail continua sendo a
  // entrega de um relatorio pedido; o convite e um pos-escrito, nao a mensagem.
  const optInPlain = optInUrl
    ? [
        "",
        "Se quiser continuar recebendo leituras relacionadas aos pontos identificados no seu CGI, você pode ativar isso aqui:",
        optInUrl,
      ].join("\n")
    : "";
  const optInHtml = optInUrl
    ? `<p style="margin:24px 0 0 0;font-size:13px;color:#666666;">Se quiser continuar recebendo leituras relacionadas aos pontos identificados no seu CGI, <a href="${optInUrl}" style="color:#666666;">quero receber insights personalizados</a>.</p>`
    : "";

  const subject = `Seu relatório CGI${company ? ` — ${company}` : ""}`;

  const plainText = [
    `Olá, ${name}.`,
    "",
    `A partir das suas respostas, o CGI produziu uma leitura inicial sobre o sistema de crescimento da ${company}.`,
    "",
    summary,
    "",
    "Ao abrir o relatório, minha sugestão é não começar pela nota. Ela sintetiza o estágio atual, mas não é a parte mais importante do diagnóstico.",
    "",
    "Procure principalmente onde as cinco dimensões não avançam no mesmo ritmo, quais gargalos podem limitar o próximo ciclo e quais hipóteses precisam ser validadas antes de virarem decisões. É nessas tensões — mais do que no número final — que costuma estar a parte mais útil do CGI.",
    "",
    "Ler meu relatório CGI:",
    url,
    "",
    "O CGI traduz para um diagnóstico prático princípios que desenvolvi em Cresça ou Desapareça e na minha atuação com empresas e lideranças. O CGI foi desenhado para levantar boas hipóteses — não para substituir contexto, julgamento ou conhecimento profundo do negócio.",
    "",
    SIGNATURE_PLAIN,
  ].join("\n") + optInPlain;

  const htmlBody = htmlShell(`
    <p style="margin:0 0 20px 0;">Olá, ${escapeHtml(name)}.</p>
    <p style="margin:0 0 20px 0;">A partir das suas respostas, o CGI produziu uma leitura inicial sobre o sistema de crescimento da ${escapeHtml(company)}.</p>
    <p style="margin:0 0 20px 0;">${escapeHtml(summary)}</p>
    <p style="margin:0 0 20px 0;">Ao abrir o relatório, minha sugestão é não começar pela nota. Ela sintetiza o estágio atual, mas não é a parte mais importante do diagnóstico.</p>
    <p style="margin:0 0 20px 0;">Procure principalmente onde as cinco dimensões não avançam no mesmo ritmo, quais gargalos podem limitar o próximo ciclo e quais hipóteses precisam ser validadas antes de virarem decisões. É nessas tensões — mais do que no número final — que costuma estar a parte mais útil do CGI.</p>
    ${ctaButtonHtml("Ler meu relatório CGI", url)}
    <p style="margin:20px 0;font-size:14px;color:#555555;">O CGI traduz para um diagnóstico prático princípios que desenvolvi em Cresça ou Desapareça e na minha atuação com empresas e lideranças. O CGI foi desenhado para levantar boas hipóteses — não para substituir contexto, julgamento ou conhecimento profundo do negócio.</p>
    <p style="margin:28px 0 0 0;font-size:15px;">${SIGNATURE_HTML}</p>
    ${optInHtml}
  `);

  return { subject, plainText, htmlBody };
}

/** Abandonment copy for someone who left their details and never answered a
 * single question. Deliberately NOT the same message as the resume email: that
 * one says "you started" and "the link resumes from your saved progress", both
 * of which are false here and read as if the system had confused the person
 * with someone else.
 *
 * The dimension wording is the canonical one from api/_cgi-core.ts, matching the
 * sentence already published on the site, so the email never contradicts it. */
export function buildCgiLeadCaptureAbandonmentEmail(input: {
  name: string;
  company: string;
  reportAccessUrl: string;
}): CgiEmailContent {
  const name = String(input.name || "").trim();
  const company = String(input.company || "").trim();
  const url = input.reportAccessUrl;

  const subject = "Seu acesso ao CGI continua disponível";

  const companyClause = company ? `da ${company}` : "da sua empresa";

  const plainText = [
    `Olá, ${name}.`,
    "",
    "Você deixou seus dados para fazer o Caldeira Growth Index, mas o diagnóstico ainda não foi iniciado.",
    "",
    `O CGI combina 40 questões distribuídas em cinco dimensões: Estratégia, Mercado e Cliente, Máquina de Crescimento, Execução e Gestão, e Liderança e Cultura. O diagnóstico leva entre dez e quinze minutos e produz uma leitura de onde o crescimento ${companyClause} está sendo limitado hoje.`,
    "",
    "A parte mais útil não é a nota. É observar onde as cinco dimensões não avançam no mesmo ritmo — normalmente é aí que está o gargalo que ainda não tinha sido nomeado.",
    "",
    "Começar meu diagnóstico:",
    url,
    "",
    "Se não for o momento, tudo bem. O acesso continua válido e você pode começar quando fizer sentido.",
    "",
    SIGNATURE_PLAIN,
  ].join("\n");

  const htmlBody = htmlShell(`
    <p style="margin:0 0 20px 0;">Olá, ${escapeHtml(name)}.</p>
    <p style="margin:0 0 20px 0;">Você deixou seus dados para fazer o Caldeira Growth Index, mas o diagnóstico ainda não foi iniciado.</p>
    <p style="margin:0 0 20px 0;">O CGI combina 40 questões distribuídas em cinco dimensões: Estratégia, Mercado e Cliente, Máquina de Crescimento, Execução e Gestão, e Liderança e Cultura. O diagnóstico leva entre dez e quinze minutos e produz uma leitura de onde o crescimento ${escapeHtml(companyClause)} está sendo limitado hoje.</p>
    <p style="margin:0 0 20px 0;">A parte mais útil não é a nota. É observar onde as cinco dimensões não avançam no mesmo ritmo — normalmente é aí que está o gargalo que ainda não tinha sido nomeado.</p>
    ${ctaButtonHtml("Começar meu diagnóstico", url)}
    <p style="margin:20px 0;font-size:14px;color:#555555;">Se não for o momento, tudo bem. O acesso continua válido e você pode começar quando fizer sentido.</p>
    <p style="margin:28px 0 0 0;font-size:15px;">${SIGNATURE_HTML}</p>
  `);

  return { subject, plainText, htmlBody };
}

export function buildCgiAbandonmentEmail(input: {
  name: string;
  reportAccessUrl: string;
}): CgiEmailContent {
  const name = String(input.name || "").trim();
  const url = input.reportAccessUrl;

  const subject = "Seu diagnóstico CGI ficou em aberto";

  const plainText = [
    `Olá, ${name}.`,
    "",
    "Você iniciou o Caldeira Growth Index, mas o diagnóstico ficou incompleto.",
    "",
    "O CGI observa cinco dimensões que, em conjunto, ajudam a entender a capacidade de uma empresa sustentar crescimento. As respostas isoladas dizem pouco; é a combinação entre elas que permite identificar tensões, gargalos e prioridades.",
    "",
    "Como você já iniciou o diagnóstico, vale concluí-lo para que essas relações possam ser observadas em conjunto.",
    "",
    "Continuar meu diagnóstico:",
    url,
    "",
    "O link retoma o CGI a partir do progresso que já ficou salvo.",
    "",
    "Se não for o momento, tudo bem. O link continua válido.",
    "",
    "O método traduz princípios que desenvolvi em Cresça ou Desapareça e na minha atuação com empresas e lideranças.",
    "",
    SIGNATURE_PLAIN,
  ].join("\n");

  const htmlBody = htmlShell(`
    <p style="margin:0 0 20px 0;">Olá, ${escapeHtml(name)}.</p>
    <p style="margin:0 0 20px 0;">Você iniciou o Caldeira Growth Index, mas o diagnóstico ficou incompleto.</p>
    <p style="margin:0 0 20px 0;">O CGI observa cinco dimensões que, em conjunto, ajudam a entender a capacidade de uma empresa sustentar crescimento. As respostas isoladas dizem pouco; é a combinação entre elas que permite identificar tensões, gargalos e prioridades.</p>
    <p style="margin:0 0 20px 0;">Como você já iniciou o diagnóstico, vale concluí-lo para que essas relações possam ser observadas em conjunto.</p>
    ${ctaButtonHtml("Continuar meu diagnóstico", url)}
    <p style="margin:20px 0;font-size:14px;color:#555555;">O link retoma o CGI a partir do progresso que já ficou salvo. Se não for o momento, tudo bem — o link continua válido.</p>
    <p style="margin:0 0 20px 0;font-size:14px;color:#555555;">O método traduz princípios que desenvolvi em Cresça ou Desapareça e na minha atuação com empresas e lideranças.</p>
    <p style="margin:28px 0 0 0;font-size:15px;">${SIGNATURE_HTML}</p>
  `);

  return { subject, plainText, htmlBody };
}

/** Semantic alias: the historical name for what is now one of two abandonment
 * copies. Kept so existing call sites and tests do not churn. */
export const buildCgiProgressAbandonmentEmail = buildCgiAbandonmentEmail;

// ---------------------------------------------------------------------------
// RÉGUA V1 -- D+2 e D+7
// ---------------------------------------------------------------------------
//
// Mesma disciplina dos dois e-mails acima: nenhum template roda em Apps Script,
// tudo é construído aqui e passa pela suíte. Nenhuma destas funções envia nada
// -- quem envia é um executor que ainda não existe.

/** Rodapé de descadastro. Só entra em mensagem de nurturing: um relatório que a
 * pessoa pediu não é algo de que ela precise se descadastrar, e oferecer isso
 * numa entrega transacional confunde as duas coisas. */
function unsubscribeFooterPlain(url: string): string {
  return `\n\n---\nSe preferir não receber mais estas leituras: ${url}`;
}

function unsubscribeFooterHtml(url: string): string {
  return `<p style="margin:32px 0 0 0;font-size:12px;color:#888888;">Se preferir não receber mais estas leituras, <a href="${url}" style="color:#888888;">cancele o recebimento</a>.</p>`;
}

/** D+2 -- confirmação de entrega, não conteúdo.
 *
 * Só sai para quem não abriu o relatório (ver api/_cgi-nurture.ts). Por isso a
 * copy pode ser direta sobre o assunto real: o link pode não ter chegado. Nada
 * de "não perca", nada de resumo do relatório -- se o problema é acesso,
 * mandar conteúdo por cima é ruído. */
export function buildCgiReportFollowupD2Email(input: {
  name: string;
  company: string;
  reportAccessUrl: string;
}): CgiEmailContent {
  const name = String(input.name || "").trim();
  const company = String(input.company || "").trim();
  const url = input.reportAccessUrl;

  const subject = `Seu relatório CGI${company ? ` — ${company}` : ""}: conseguiu abrir?`;

  const plainText = [
    `Olá, ${name}.`,
    "",
    "Enviei o seu relatório CGI há alguns dias e não consta que ele tenha sido aberto. Como esse tipo de link às vezes se perde em filtro de spam ou em caixa corporativa, prefiro checar a mandar mais uma coisa por cima.",
    "",
    "O link continua válido:",
    url,
    "",
    "Se não abrir, é só responder este e-mail que eu envio de outra forma. E se você já leu e o registro simplesmente não marcou, ignore esta mensagem.",
    "",
    "Abraço,",
    "Denis",
  ].join("\n");

  // Shell pessoal, nao o de peca: este e-mail so faz sentido se parecer que eu
  // digitei. Sem card, sem botao, link como texto, assinatura de uma linha.
  const htmlBody = personalHtmlShell(`
    <p style="margin:0 0 16px 0;">Olá, ${escapeHtml(name)}.</p>
    <p style="margin:0 0 16px 0;">Enviei o seu relatório CGI há alguns dias e não consta que ele tenha sido aberto. Como esse tipo de link às vezes se perde em filtro de spam ou em caixa corporativa, prefiro checar a mandar mais uma coisa por cima.</p>
    <p style="margin:0 0 16px 0;">O link continua válido:<br />${plainLinkHtml(url)}</p>
    <p style="margin:0 0 16px 0;">Se não abrir, é só responder este e-mail que eu envio de outra forma. E se você já leu e o registro simplesmente não marcou, ignore esta mensagem.</p>
    <p style="margin:16px 0 0 0;">Abraço,<br />Denis</p>
  `);

  return { subject, plainText, htmlBody };
}

/** D+7 -- uma leitura curta sobre a dimensão que apareceu mais frágil.
 *
 * Template por dimensão, não geração por IA. A razão não é custo: é que o valor
 * desta mensagem está em dizer UMA coisa verdadeira e específica sobre um
 * padrão que se repete em muitas empresas -- e isso um texto escrito uma vez,
 * revisado, diz melhor e com risco menor do que um texto novo gerado a cada
 * envio. Se a V1 mostrar que as pessoas respondem, aí vale personalizar. */
export type CgiInsightDimensionId =
  | "strategy"
  | "market"
  | "growthMachine"
  | "execution"
  | "leadership";

const INSIGHT_D7_BY_DIMENSION: Record<
  CgiInsightDimensionId,
  { titulo: string; leitura: string[] }
> = {
  strategy: {
    titulo: "Estratégia",
    leitura: [
      "O padrão que eu mais vejo em empresas com essa dimensão frágil não é falta de plano. É excesso de plano válido ao mesmo tempo.",
      "Quase toda empresa consegue listar o que quer fazer nos próximos 12 meses. Muito poucas conseguem listar o que decidiram NÃO fazer. E é essa segunda lista que faz a primeira acontecer, porque é ela que libera as pessoas, o dinheiro e a atenção que a estratégia precisa.",
      "Um teste rápido: pergunte separadamente a três das suas principais lideranças quais são as três prioridades da empresa neste ano. Se as respostas não forem praticamente iguais, o problema não está na execução — está antes dela.",
    ],
  },
  market: {
    titulo: "Mercado e Cliente",
    leitura: [
      "Quando essa dimensão aparece frágil, quase nunca é porque a empresa não conhece o mercado. É porque conhece o mercado pela própria descrição, não pela do cliente.",
      "A pergunta que separa as duas coisas é simples e desconfortável: por que o último cliente relevante escolheu vocês em vez do concorrente? Se a resposta vier em palavras da empresa — qualidade, atendimento, know-how — provavelmente ela é uma hipótese, não um dado.",
      "Cinco conversas de trinta minutos com clientes que compraram recentemente costumam mudar mais o posicionamento do que um trimestre de discussão interna. E o que muda não é a comunicação: é a escolha de para quem vender.",
    ],
  },
  growthMachine: {
    titulo: "Máquina de Crescimento",
    leitura: [
      "Empresas com essa dimensão frágil quase sempre tratam o problema como falta de volume: mais leads, mais visitas, mais investimento em mídia.",
      "Na prática, o que costuma faltar é conhecer a conversão entre as etapas. Sem saber quantos contatos viram reunião, quantas reuniões viram proposta e quantas propostas viram contrato, aumentar a entrada só aumenta o desperdício — e torna o resultado do mês uma função do esforço, não do sistema.",
      "O que diferencia quem destrava essa dimensão raramente é uma ferramenta nova. É passar a olhar a mesma pergunta toda semana: onde exatamente o funil perde, e por quê. Previsibilidade é consequência disso, não causa.",
    ],
  },
  execution: {
    titulo: "Execução e Gestão",
    leitura: [
      "Quando essa dimensão aparece frágil, normalmente não faltam reuniões. Falta reunião em que alguma decisão muda.",
      "É comum encontrar uma rotina de acompanhamento que funciona como prestação de contas: cada área relata o que fez, todos concordam que está difícil, e a próxima reunião repete a anterior. O ciclo é longo demais para corrigir desvio e curto demais para discutir o que importa.",
      "O que costuma destravar é reduzir o escopo: menos prioridades acompanhadas, cadência mais curta, e uma regra explícita de que quem levanta um desvio sai da sala com um responsável e uma data. Não é rigor a mais — é acabar antes que o trimestre acabe por você.",
    ],
  },
  leadership: {
    titulo: "Liderança e Cultura de Crescimento",
    leitura: [
      "Essa é a dimensão em que o gargalo mais frequentemente é a própria pessoa que está lendo — e digo isso sem nenhuma crítica.",
      "Empresas param de crescer no número de decisões que precisam passar pelo fundador. Enquanto o julgamento não estiver distribuído, todo crescimento vira mais trabalho para a mesma cabeça, e a organização aprende a esperar em vez de decidir.",
      "O sinal de que isso está mudando não é ter mais gente contratada. É ter mais gente tomando decisões que você teria tomado do mesmo jeito — e algumas que você não teria tomado, e que se mostraram melhores.",
    ],
  },
};

export function buildCgiInsightD7Email(input: {
  name: string;
  company: string;
  dimensionId: CgiInsightDimensionId;
  unsubscribeUrl: string;
}): CgiEmailContent {
  const name = String(input.name || "").trim();
  const company = String(input.company || "").trim();
  const bloco = INSIGHT_D7_BY_DIMENSION[input.dimensionId];
  const url = input.unsubscribeUrl;

  const subject = `Sobre ${bloco.titulo}${company ? ` na ${company}` : ""}`;

  const abertura = `Olá, ${name}.`;
  const contexto = `Seu CGI apontou ${bloco.titulo} como a dimensão hoje mais frágil${company ? ` na ${company}` : ""}. Escrevo uma leitura curta sobre isso — uma observação só, do que costuma estar por trás quando essa dimensão aparece assim.`;
  const fechamento =
    "Se fizer sentido para o seu momento, responda este e-mail contando como isso aparece aí. Leio todas.";

  const plainText =
    [abertura, "", contexto, "", ...bloco.leitura.flatMap((p) => [p, ""]), fechamento, "", SIGNATURE_PLAIN].join("\n") +
    unsubscribeFooterPlain(url);

  const htmlBody = htmlShell(`
    <p style="margin:0 0 20px 0;">${escapeHtml(abertura)}</p>
    <p style="margin:0 0 20px 0;">${escapeHtml(contexto)}</p>
    ${bloco.leitura.map((p) => `<p style="margin:0 0 20px 0;">${escapeHtml(p)}</p>`).join("\n    ")}
    <p style="margin:0 0 20px 0;">${escapeHtml(fechamento)}</p>
    <p style="margin:28px 0 0 0;font-size:15px;">${SIGNATURE_HTML}</p>
    ${unsubscribeFooterHtml(url)}
  `);

  return { subject, plainText, htmlBody };
}

export function buildCgiUnsubscribeUrl(token: string): string {
  return `https://www.caldeiragrowth.com/cgi/descadastrar#t=${token}`;
}

export function buildCgiInsightsOptInUrl(token: string): string {
  return `https://www.caldeiragrowth.com/cgi/insights#t=${token}`;
}
