import { describe, expect, it } from "vitest";
import { analyticsSafeQualification, analyticsSafeSector } from "./analyticsVocabulary";
import { cgiUi } from "../config";

describe("vocabulário fechado para o GA4", () => {
  it("deixa passar um setor da lista, em qualquer língua", () => {
    expect(analyticsSafeSector("Tecnologia e software")).toBe("Tecnologia e software");
    expect(analyticsSafeSector("Technology and software")).toBe("Technology and software");
  });

  it("NÃO deixa passar texto livre -- este é o defeito", () => {
    // Valores desta forma são o que as pessoas realmente digitam no campo
    // "Outro" quando ele aparece.
    expect(analyticsSafeSector("Consultoria da Maria - clínica São Paulo")).toBe("outro");
    expect(analyticsSafeSector("padaria do joão ltda")).toBe("outro");
    expect(analyticsSafeSector("denis@empresa.com.br")).toBe("outro");
  });

  it("a própria opção 'Outro' passa, porque está na lista", () => {
    expect(analyticsSafeSector("Outro")).toBe("Outro");
  });

  it("vazio continua sendo vazio, não vira 'outro'", () => {
    expect(analyticsSafeSector("")).toBeNull();
    expect(analyticsSafeSector(null)).toBeNull();
    expect(analyticsSafeSector(undefined)).toBeNull();
  });

  it("o vocabulário vem da configuração, não de uma cópia", () => {
    // Se alguém acrescentar um setor ao formulário, ele passa a ser elegível
    // sem que ninguém precise lembrar de editar este módulo.
    for (const ui of Object.values(cgiUi)) {
      for (const opcao of ui.sectorOptions) {
        expect(analyticsSafeSector(opcao)).toBe(opcao);
      }
    }
  });

  it("qualificação também é allowlist", () => {
    expect(analyticsSafeQualification("employeeCount", "11-50")).toBe("11-50");
    expect(analyticsSafeQualification("investmentIntent", "Sim")).toBe("Sim");
    expect(analyticsSafeQualification("employeeCount", "somos 3 sócios")).toBe("outro");
  });

  it("um campo desconhecido não é uma porta aberta", () => {
    expect(analyticsSafeQualification("campoQueNaoExiste", "qualquer coisa")).toBe("outro");
  });
});
