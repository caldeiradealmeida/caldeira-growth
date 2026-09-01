import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { normalizeLeadForSubmit } from "@/features/cgi/utils/form";
import {
  analyticsSafeQualification,
  analyticsSafeSector,
} from "@/features/cgi/logic/analyticsVocabulary";
import { pushCgiDataLayerEvent } from "@/features/cgi/services/analytics";
import type { LeadForm } from "@/features/cgi/types";

// Duas provas diferentes, porque uma sozinha nao basta.
//
//  - A prova de CODIGO le CGI.tsx e verifica que nenhum push ao dataLayer
//    referencia campo cru do lead. Um teste de comportamento sozinho passaria
//    feliz enquanto alguem acrescenta `role: normalizedLead.role` na linha de
//    baixo, porque o teste nao conhece a linha nova.
//  - A prova de COMPORTAMENTO percorre o caminho real -- formulario cru ->
//    normalizeLeadForSubmit -> portao de vocabulario -> dataLayer de verdade --
//    com um lead cheio de dados pessoais, e olha o que sobrou la dentro.

const currentDir = dirname(fileURLToPath(import.meta.url));
const cgiPageSource = readFileSync(join(currentDir, "CGI.tsx"), "utf-8");
const analyticsSource = readFileSync(
  join(currentDir, "..", "features", "cgi", "services", "analytics.ts"),
  "utf-8"
);

/** Texto de cada chamada a pushCgiDataLayerEvent, do "(" ao ")" que fecha. */
function dataLayerPushes(source: string): string[] {
  const pushes: string[] = [];
  const needle = "pushCgiDataLayerEvent(";
  let from = 0;
  for (;;) {
    const start = source.indexOf(needle, from);
    if (start === -1) break;
    let depth = 0;
    let end = -1;
    for (let i = start + needle.length - 1; i < source.length; i += 1) {
      if (source[i] === "(") depth += 1;
      else if (source[i] === ")") {
        depth -= 1;
        if (depth === 0) {
          end = i;
          break;
        }
      }
    }
    if (end === -1) throw new Error("chamada a pushCgiDataLayerEvent nao fecha");
    pushes.push(source.slice(start, end + 1));
    from = end + 1;
  }
  return pushes;
}

describe("nenhum dado pessoal sai de CGI.tsx para o dataLayer", () => {
  const pushes = dataLayerPushes(cgiPageSource);

  it("existe mais de um push, senao este teste nao esta olhando nada", () => {
    expect(pushes.length).toBeGreaterThanOrEqual(3);
  });

  // Todo campo de LeadForm que carrega, ou pode carregar, dado de pessoa.
  const camposProibidos = [
    "name",
    "email",
    "phone",
    "company",
    "companyWebsite",
    "role",
    "sector",
    "sectorOther",
    "commercialRelationshipModel",
    "commercialRelationshipOther",
    "annualRevenue",
    "currentChallenge",
    "growthGoal",
    "comments",
  ];

  for (const campo of camposProibidos) {
    it(`nenhum push referencia lead.${campo} sem portao`, () => {
      for (const push of pushes) {
        // `sector` e o unico que pode aparecer -- e so dentro do portao. A
        // contagem e a assercao: toda ocorrencia tem que estar embrulhada.
        const cru = push.split(`normalizedLead.${campo}`).length - 1;
        const comPortao =
          push.split(`analyticsSafeSector(normalizedLead.${campo})`).length - 1;
        expect(cru).toBe(comPortao);
        expect(push).not.toContain(`lead.${campo},`);
        expect(push).not.toContain(`assessmentLead.${campo}`);
      }
    });
  }

  it("industry passa obrigatoriamente pelo portao de vocabulario", () => {
    const comIndustry = pushes.filter((p) => p.includes("industry:"));
    expect(comIndustry.length).toBeGreaterThan(0);
    for (const push of comIndustry) {
      expect(push).toContain("industry: analyticsSafeSector(");
    }
  });

  it("company_size e investment_intent tambem", () => {
    for (const push of pushes) {
      if (push.includes("company_size:")) {
        expect(push).toContain('company_size: analyticsSafeQualification("employeeCount"');
      }
      if (push.includes("investment_intent:")) {
        expect(push).toContain('investment_intent: analyticsSafeQualification("investmentIntent"');
      }
    }
  });
});

describe("os nomes de evento nao mudaram", () => {
  // Trava explicita: a Prioridade A nao pode renomear nem remover evento
  // nenhum. Se alguem acrescentar um, este teste falha e a decisao vira
  // consciente.
  const esperados = [
    "cgi_landing_view",
    "cgi_start_click",
    "cgi_lead_form_view",
    "cgi_lead_submitted",
    "cgi_company_context_submitted",
    "cgi_phone_submitted",
    "cgi_assessment_started",
    "cgi_progress",
    "cgi_assessment_completed",
    "cgi_result_viewed",
    "cgi_report_requested",
    "cgi_cta_clicked",
    "cgi_assessment_resumed",
  ];

  it("a uniao CgiDataLayerEvent tem exatamente os 13 nomes de sempre", () => {
    const uniao = analyticsSource.slice(
      analyticsSource.indexOf("export type CgiDataLayerEvent"),
      analyticsSource.indexOf("export type CgiInternalEvent")
    );
    const encontrados = [...uniao.matchAll(/"(cgi_[a-z_]+)"/g)].map((m) => m[1]);
    expect(encontrados).toEqual(esperados);
  });
});

describe("o caminho real, com um lead cheio de dado pessoal", () => {
  const cru: LeadForm = {
    name: "Denis Caldeira de Almeida",
    email: "denis@padariadojoao.com.br",
    phone: "+5511988887777",
    company: "Padaria do João Ltda",
    companyWebsite: "https://padariadojoao.com.br",
    role: "Sócio-fundador",
    sector: "Outro",
    sectorOther: "Padaria do João - unidade Moema",
    commercialRelationshipModel: "Outro",
    commercialRelationshipOther: "vendo direto na loja",
    employeeCount: "11-50",
    annualRevenue: "R$ 1-10 milhões",
    currentChallenge: "Escalar vendas",
    growthGoal: "Acima de 50%",
    investmentIntent: "Sim",
    comments: "meu sócio Roberto acha que devemos abrir em Pinheiros",
  } as LeadForm;

  const normalizado = normalizeLeadForSubmit(cru);

  beforeEach(() => {
    vi.stubGlobal("window", { dataLayer: [], location: { pathname: "/cgi" } });
  });

  function pushComoEmProducao() {
    pushCgiDataLayerEvent("cgi_lead_submitted", {
      event_id: "evt_1",
      anonymous_session_id: "cgi_session_abc",
      public_assessment_id: "assessment_1",
      company_size: analyticsSafeQualification("employeeCount", normalizado.employeeCount),
      industry: analyticsSafeSector(normalizado.sector),
      investment_intent: analyticsSafeQualification("investmentIntent", normalizado.investmentIntent),
    });
    return window.dataLayer?.[0] as Record<string, unknown>;
  }

  it("a normalizacao REALMENTE poe o texto livre em sector -- e por isso que isto importa", () => {
    // Sem esta assercao o resto do describe poderia estar provando o nada.
    expect(normalizado.sector).toBe("Padaria do João - unidade Moema");
  });

  it('o texto digitado vira "outro" no dataLayer', () => {
    expect(pushComoEmProducao()).toMatchObject({ industry: "outro" });
  });

  it("nenhum pedaco de dado pessoal aparece no evento, em nenhum valor", () => {
    const serializado = JSON.stringify(pushComoEmProducao());
    for (const vazamento of [
      "Denis",
      "Almeida",
      "denis@",
      "padariadojoao",
      "Padaria",
      "Moema",
      "5511988887777",
      "Sócio",
      "Roberto",
      "Pinheiros",
      "R$ 1-10",
      "Escalar vendas",
    ]) {
      expect(serializado).not.toContain(vazamento);
    }
  });

  it("o evento tem exatamente as chaves esperadas -- nada a mais entrou junto", () => {
    expect(Object.keys(pushComoEmProducao()).sort()).toEqual([
      "anonymous_session_id",
      "company_size",
      "event",
      "event_id",
      "industry",
      "investment_intent",
      "public_assessment_id",
    ]);
  });

  it("company_size e investment_intent continuam com o valor real da lista", () => {
    expect(pushComoEmProducao()).toMatchObject({
      company_size: "11-50",
      investment_intent: "Sim",
    });
  });

  it("quem escolheu setor da lista continua chegando igual, sem bucketizar", () => {
    const daLista = normalizeLeadForSubmit({
      ...cru,
      sector: "Serviços profissionais e consultoria",
      sectorOther: "",
    } as LeadForm);
    pushCgiDataLayerEvent("cgi_lead_submitted", {
      industry: analyticsSafeSector(daLista.sector),
    });
    expect(window.dataLayer?.[0]).toMatchObject({
      industry: "Serviços profissionais e consultoria",
    });
  });

  it("o nome do evento nao muda por causa desta correcao", () => {
    expect(pushComoEmProducao()).toMatchObject({ event: "cgi_lead_submitted" });
  });
});
