import type { CrmOpportunityStatus } from "./types";

export const STATUS_LABELS: Record<CrmOpportunityStatus, string> = {
  novo: "Novo",
  revisado: "Revisado",
  contato_pendente: "Contato pendente",
  contato_realizado: "Contato realizado",
  reuniao_agendada: "Reunião agendada",
  enviar_proposta: "Enviar proposta",
  proposta_enviada: "Proposta enviada",
  convertido: "Convertido",
  sem_interesse: "Sem interesse",
  descartado: "Descartado",
};

export const STATUS_ORDER: CrmOpportunityStatus[] = [
  "novo",
  "revisado",
  "contato_pendente",
  "contato_realizado",
  "reuniao_agendada",
  "enviar_proposta",
  "proposta_enviada",
  "convertido",
  "sem_interesse",
  "descartado",
];

export const LEVEL_LABELS: Record<string, string> = {
  reactive: "Reativo",
  intentional: "Intencional",
  structured: "Estruturado",
  scalable: "Escalável",
};

export const REPORT_STATUS_LABELS: Record<string, string> = {
  report_generating: "Gerando",
  report_ready: "Pronto",
  report_failed: "Falhou",
};

export const DIMENSION_LABELS: Record<string, string> = {
  strategy: "Estratégia",
  market: "Mercado & Cliente",
  growthMachine: "Motor de Crescimento",
  execution: "Execução & Gestão",
  leadership: "Liderança & Cultura",
};

/** Management-facing labels for the Pipe's "CGI" column. Separate from
 * ASSESSMENT_STATUS_LABELS on purpose: that map mirrors the lifecycle enum
 * ("Contato capturado", "Iniciado"), which is the wrong vocabulary for someone
 * scanning the pipeline. See logic/cgiStage.ts for the derivation. */
export const CGI_STAGE_LABELS: Record<string, string> = {
  nao_iniciado: "Não iniciado",
  em_andamento: "Em andamento",
  concluido: "Concluído",
  abandonado: "Abandonado",
};

export const ASSESSMENT_STATUS_LABELS: Record<string, string> = {
  created: "Iniciado",
  lead_captured: "Contato capturado",
  started: "Em andamento",
  in_progress: "Em andamento",
  completed: "Completo",
  abandoned: "Abandonado",
};
