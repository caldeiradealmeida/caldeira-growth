import { cgiUi } from "../config";
import { CGI_QUALIFICATION_FIELDS } from "@/data/cgiConfig";

/**
 * Vocabulário fechado para os parâmetros que vão ao GA4.
 *
 * O filtro de PII do dataLayer é uma DENYLIST de nomes de campo
 * (`PII_KEYS` em ../services/analytics.ts). Ela protege contra enviar um campo
 * chamado `email`. Não protege contra enviar texto livre dentro de um campo com
 * nome inocente -- e era isso que acontecia.
 *
 * `sector` tem a opção "Outro", e quando ela é escolhida
 * `normalizeLeadForSubmit` substitui o valor pelo texto que a pessoa digitou
 * (utils/form.ts, resolveOtherValue). Esse valor seguia para o dataLayer sob a
 * chave `industry`. Ou seja: texto livre, digitado por um ser humano, indo para
 * o GA4 -- onde às vezes se escreve o nome da própria empresa ou o do sócio.
 *
 * A correção não é acrescentar `industry` à denylist: isso perderia a dimensão
 * inteira, que é legitimamente útil e não identifica ninguém quando vem da
 * lista. A correção é inverter a lógica para uma ALLOWLIST -- só sai o que está
 * no vocabulário do próprio formulário. Qualquer outra coisa vira "outro".
 *
 * O vocabulário é derivado da configuração, nas três línguas, e não copiado:
 * acrescentar um setor ao formulário o torna elegível automaticamente, e
 * nenhuma edição de config consegue abrir uma porta para texto livre.
 */

const OUT_OF_VOCABULARY = "outro";

function vocabulary(values: Iterable<string>) {
  const set = new Set<string>();
  for (const value of values) {
    const text = String(value || "").trim();
    if (text) set.add(text);
  }
  return set;
}

const SECTOR_VOCABULARY = vocabulary(
  Object.values(cgiUi).flatMap((ui) => ui.sectorOptions ?? [])
);

const QUALIFICATION_VOCABULARY = new Map<string, Set<string>>(
  CGI_QUALIFICATION_FIELDS.map((field) => [field.id, vocabulary(field.options ?? [])])
);

/** Deixa passar só o que veio da lista do formulário. */
export function analyticsSafeSector(value: string | null | undefined): string | null {
  const text = String(value || "").trim();
  if (!text) return null;
  return SECTOR_VOCABULARY.has(text) ? text : OUT_OF_VOCABULARY;
}

export function analyticsSafeQualification(
  fieldId: string,
  value: string | null | undefined
): string | null {
  const text = String(value || "").trim();
  if (!text) return null;
  const allowed = QUALIFICATION_VOCABULARY.get(fieldId);
  if (!allowed) return OUT_OF_VOCABULARY;
  return allowed.has(text) ? text : OUT_OF_VOCABULARY;
}
