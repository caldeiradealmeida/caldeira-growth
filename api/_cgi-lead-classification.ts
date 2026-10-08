/**
 * Classificação canônica de qualidade do lead.
 *
 * Uma pergunta só: esta linha representa uma pessoa real que quer falar
 * conosco? Quatro respostas, e a fronteira entre elas importa.
 *
 *   legitimate  pessoa real, interesse real
 *   test        nós mesmos
 *   spam        abuso deliberado, humano ou máquina
 *   invalid     pessoa real, dado inutilizável (endereço no campo empresa,
 *               nome truncado). Não é spam, e tratar como spam apagaria a
 *               diferença entre "descartar" e "corrigir e ligar".
 *
 * FAIL-CLOSED POR CONSTRUÇÃO
 *
 * `automationMaySend` só devolve true para a string exata 'legitimate'. Null,
 * undefined, string desconhecida, coluna ausente porque a migration ainda não
 * rodou, leitura que falhou e devolveu objeto vazio -- tudo isso bloqueia. Não
 * existe caminho em que a ausência de informação vire permissão de envio, que
 * é a regra que o resto do motor de comunicação já segue.
 *
 * ORDEM DE IMPLANTAÇÃO -- IMPORTA
 *
 * A migration vai primeiro, o código depois. Se o código subir antes, o SELECT
 * pedindo `classification` falha, os leitores devolvem vazio e NADA é enviado.
 * É a direção segura do erro, mas é uma interrupção: aplique a migration antes
 * de promover.
 */

export const LEAD_CLASSIFICATIONS = ["legitimate", "test", "spam", "invalid"] as const;

export type LeadClassification = (typeof LEAD_CLASSIFICATIONS)[number];

/** O único valor que a automação aceita. */
export const AUTOMATION_ALLOWED_CLASSIFICATION: LeadClassification = "legitimate";

export function isLeadClassification(value: unknown): value is LeadClassification {
  return typeof value === "string" && (LEAD_CLASSIFICATIONS as readonly string[]).includes(value);
}

/**
 * `invalid` também não envia -- deliberadamente.
 *
 * O pedido era "não envie automaticamente por padrão, a menos que exista regra
 * explícita em contrário". Não há regra em contrário hoje, e não estou criando
 * uma: um lead marcado como inválido tem, por definição, dado que ninguém
 * conferiu. Mandar e-mail automático para um endereço que talvez esteja errado
 * é o tipo de coisa que só se descobre pelo bounce.
 */
export function automationMaySend(classification: unknown): boolean {
  return classification === AUTOMATION_ALLOWED_CLASSIFICATION;
}

/** Motivo legível para o ledger e para o payload de inspect. */
export function classificationSuppressionReason(
  classification: unknown
): "lead_test" | "lead_spam" | "lead_invalid" | "lead_classification_unknown" {
  switch (classification) {
    case "test":
      return "lead_test";
    case "spam":
      return "lead_spam";
    case "invalid":
      return "lead_invalid";
    default:
      // Inclui null, undefined e qualquer string que não conheçamos. Um valor
      // que não sabemos ler não é um valor que autoriza envio.
      return "lead_classification_unknown";
  }
}
