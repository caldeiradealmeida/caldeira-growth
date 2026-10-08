import { describe, expect, it } from "vitest";
import { isValidPhone, normalizePhone, sanitizePhoneInput } from "./form";

// O telefone deixou de ser opcional na etapa final e passou a ser obrigatório
// na identificação (Etapa 1). `decidePhoneStepAction` existia apenas para
// permitir avançar com o campo vazio -- comportamento que a mudança de produto
// elimina -- então a função foi removida junto com ele. O que continua valendo,
// e agora é exercido na identificação, é a validação de formato.
describe("validação de telefone (obrigatório na identificação)", () => {
  it("rejeita telefone vazio", () => {
    expect(isValidPhone("")).toBe(false);
    expect(isValidPhone("   ")).toBe(false);
  });

  it("aceita um número brasileiro com máscara", () => {
    expect(isValidPhone("(11) 99999-8888")).toBe(true);
    expect(isValidPhone("11999998888")).toBe(true);
  });

  it("aceita números internacionais -- não podemos barrar quem não é do Brasil", () => {
    expect(isValidPhone("+1 415 555 2671")).toBe(true);
    expect(isValidPhone("+351 912 345 678")).toBe(true);
    expect(isValidPhone("+81 3 1234 5678")).toBe(true);
  });

  it("rejeita comprimentos impossíveis para qualquer país", () => {
    expect(isValidPhone("123")).toBe(false);
    expect(isValidPhone("+1234567890123456")).toBe(false);
  });

  it("preserva o prefixo internacional ao normalizar", () => {
    expect(normalizePhone("+55 (11) 99999-8888")).toBe("+5511999998888");
    expect(normalizePhone("(11) 99999-8888")).toBe("11999998888");
  });

  it("sanitiza a digitação sem destruir o formato internacional", () => {
    expect(sanitizePhoneInput("+55 (11) 99999-8888")).toBe("+55 (11) 99999-8888");
    expect(sanitizePhoneInput("abc+55x11")).toBe("+5511");
  });
});
