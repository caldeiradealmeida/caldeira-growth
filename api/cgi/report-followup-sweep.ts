import type { VercelRequest, VercelResponse } from "@vercel/node";
import {
  recordCommunication,
  recordCommunicationSafely,
} from "../_cgi-communications.js";
import { isNurtureTypeEnabled } from "../_cgi-nurture.js";
import {
  planReportFollowup,
  sendablesFromPlan,
  suppressionsFromPlan,
  type ReportFollowupPlanItem,
} from "../_cgi-report-followup.js";
import { buildCgiReportFollowupD2Email } from "../_cgi-email-content.js";
import { dispatchCgiParticipantEmail } from "../_cgi-email-dispatch.js";
import { buildReportAccessUrl, issueReportAccessToken } from "../_cgi-report-token.js";
import { updateCommunicationByDedupeKey } from "../_cgi-supabase.js";

// Alvo de Vercel Cron (ver vercel.json). Uma pergunta, um e-mail:
// "voce conseguiu abrir seu relatorio?".
//
// Funcao propria em vez de um modo dentro de um sweep existente. O custo e
// real -- leva o projeto a 12/12 funcoes no plano Hobby, sem folga -- e foi
// aceito por um motivo: no primeiro ciclo de uma regua, poder ler um arquivo
// inteiro e saber exatamente o que ele faz vale mais do que economizar um
// slot. O sweep de abandono continua intocado.

const BATCH_LIMIT = 25;

function isAuthorized(req: VercelRequest): boolean {
  // CRON_SECRET com este nome exato: e o unico que a Vercel injeta sozinha
  // no Authorization das invocacoes agendadas.
  const expected = process.env.CRON_SECRET?.trim();
  if (!expected) return false; // fail closed: segredo ausente nao autoriza ninguem.
  return String(req.headers.authorization || "") === `Bearer ${expected}`;
}

function readParam(req: VercelRequest, key: string): string {
  const fromQuery = req.query?.[key];
  if (typeof fromQuery === "string") return fromQuery.trim();
  if (Array.isArray(fromQuery) && typeof fromQuery[0] === "string") return fromQuery[0].trim();
  const body = req.body;
  if (body && typeof body === "object" && !Array.isArray(body)) {
    const value = (body as Record<string, unknown>)[key];
    if (typeof value === "string") return value.trim();
  }
  return "";
}

function getAppsScriptUrl(): string {
  return process.env.CONTACT_FORM_URL?.trim() || process.env.VITE_CONTACT_FORM_URL?.trim() || "";
}

/** Envia UM item. Isolado de proposito: uma falha aqui nao pode derrubar o
 * sweep, e o `catch` no chamador garante isso mesmo para erro inesperado. */
async function sendOne(item: ReportFollowupPlanItem, dryRun: boolean): Promise<
  { outcome: "sent" | "failed" | "claimed_by_other" | "skipped"; reason?: string }
> {
  const lead = item.lead;
  if (!lead?.email) return { outcome: "skipped", reason: "sem_email" };
  const dedupeKey = item.decision.decision === "send" ? item.decision.dedupeKey : "";
  if (!dedupeKey) return { outcome: "skipped", reason: "sem_dedupe_key" };

  // 1. RESERVA antes de enviar.
  //
  // A linha 'sending' e gravada primeiro, e a constraint unica em dedupe_key e
  // o cadeado: se duas execucoes do sweep se cruzarem, a segunda recebe 409 e
  // desiste. Sem isso, as duas passariam pela checagem de "ja registrado" e as
  // duas enviariam -- so descobrindo a duplicata depois, quando o e-mail ja
  // saiu. Aqui a duplicata e impedida pelo banco, antes do provider.
  const reserva = await recordCommunication({
    type: "report_followup_d2",
    status: "sending",
    leadId: lead.id,
    assessmentId: item.assessmentId,
    publicAssessmentId: item.publicAssessmentId,
    recipient: lead.email,
    provider: "apps_script_mailapp",
    actor: "system:cron",
    consentMarketing: typeof lead.consent_marketing === "boolean" ? lead.consent_marketing : null,
    metadata: { days_since_delivery: item.daysSinceDelivery },
  });
  if (reserva.outcome === "duplicate") return { outcome: "claimed_by_other" };
  if (reserva.outcome !== "recorded") return { outcome: "skipped", reason: reserva.outcome };

  // 2. Link. Reemitir o token rotaciona o anterior -- e aqui isso e seguro
  //    justamente porque o D+2 so existe para quem NAO abriu o relatorio: o
  //    link antigo comprovadamente nunca foi usado. Emitido depois da reserva
  //    e imediatamente antes do envio, para nao rotacionar um token num
  //    caminho que decide nao enviar.
  const token = await issueReportAccessToken(item.publicAssessmentId);
  if (!token) {
    await updateCommunicationByDedupeKey(dedupeKey, {
      status: "failed",
      failed_at: new Date().toISOString(),
      error_code: "token_unavailable",
    });
    return { outcome: "failed", reason: "token_unavailable" };
  }

  const content = buildCgiReportFollowupD2Email({
    name: String(lead.name || ""),
    company: String(lead.company || ""),
    reportAccessUrl: buildReportAccessUrl(token.token),
  });

  const dispatch = await dispatchCgiParticipantEmail({
    appsScriptUrl: getAppsScriptUrl(),
    relayToken: process.env.CGI_EMAIL_RELAY_TOKEN?.trim() || "",
    recipient: lead.email,
    content,
    emailKind: "report_ready",
    dryRun,
  });

  // 3. Fecha a linha reservada. 'sending' -> 'sent' | 'failed' e uma transicao
  //    que o proprio guard da tabela permite.
  if (dispatch.status === "sent") {
    await updateCommunicationByDedupeKey(dedupeKey, {
      status: "sent",
      sent_at: new Date().toISOString(),
      subject: content.subject,
    });
    return { outcome: "sent" };
  }

  const motivo =
    dispatch.status === "error" ? dispatch.error : dispatch.status === "skipped" ? dispatch.reason : dispatch.status;
  await updateCommunicationByDedupeKey(dedupeKey, {
    status: "failed",
    failed_at: new Date().toISOString(),
    error_code: String(motivo).slice(0, 80),
  });
  return { outcome: "failed", reason: String(motivo) };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!isAuthorized(req)) {
    // Vale para inspect tambem: olhar a fila ja e informacao comercial.
    res.status(401).json({ ok: false, error: "unauthorized" });
    return;
  }

  const now = Date.now();
  const mode = readParam(req, "mode") || "run";

  // --- INSPECT --------------------------------------------------------------
  // Somente leitura, e nao por disciplina: este ramo retorna antes de qualquer
  // coisa que escreva ou envie existir. Nao monta provider, nao emite token,
  // nao toca no ledger.
  if (mode === "inspect") {
    const plan = await planReportFollowup({ now, limit: BATCH_LIMIT });
    res.status(200).json({
      ok: true,
      mode: "inspect",
      flag_enabled: isNurtureTypeEnabled("report_followup_d2"),
      window: { from: plan.windowFromIso, to: plan.windowToIso },
      candidates: plan.candidates,
      would_send: sendablesFromPlan(plan).length,
      would_record_suppressions: suppressionsFromPlan(plan).length,
      items: plan.items.map((item) => ({
        public_assessment_id: item.publicAssessmentId,
        recipient_masked: item.recipientMasked,
        days_since_delivery: item.daysSinceDelivery,
        decision: item.decision.decision,
        reason: item.decision.decision === "suppress" ? item.decision.reason : null,
        dedupe_key: item.decision.decision === "send" ? item.decision.dedupeKey : null,
        subject: buildCgiReportFollowupD2Email({
          name: String(item.lead?.name || ""),
          company: String(item.lead?.company || ""),
          // URL de exemplo: inspect NUNCA emite token.
          reportAccessUrl: "(link gerado apenas no envio real)",
        }).subject,
      })),
    });
    return;
  }

  // --- RUN ------------------------------------------------------------------
  if (!isNurtureTypeEnabled("report_followup_d2")) {
    res.status(200).json({
      ok: true,
      mode: "run",
      status: "disabled",
      flag: "CGI_REPORT_FOLLOWUP_D2_ENABLED",
      sent: 0,
      failed: 0,
      suppressed: 0,
      note: "flag desligada: nenhuma escrita, nenhuma chamada ao provider",
    });
    return;
  }

  const dryRun = process.env.CGI_EMAIL_DRY_RUN === "true";
  const plan = await planReportFollowup({ now, limit: BATCH_LIMIT });

  // Supressoes primeiro: elas sao o que responde "por que nada saiu".
  let suppressed = 0;
  for (const linha of suppressionsFromPlan(plan)) {
    const item = plan.items.find((i) => i.publicAssessmentId === linha.publicAssessmentId);
    const resultado = await recordCommunicationSafely({
      type: linha.type,
      status: "suppressed",
      leadId: item?.leadId ?? null,
      assessmentId: item?.assessmentId ?? null,
      publicAssessmentId: linha.publicAssessmentId,
      // Chave explicita: o namespace de supressao vem do modelo da Fase 1 e
      // precisa chegar intacto ao ledger.
      dedupeKey: linha.dedupeKey,
      reason: linha.reason,
      actor: "system:cron",
      recipientMasked: item?.recipientMasked ?? null,
    });
    if (resultado?.outcome === "recorded") suppressed += 1;
  }

  let sent = 0;
  let failed = 0;
  const detalhes: Array<Record<string, unknown>> = [];

  for (const item of sendablesFromPlan(plan)) {
    let resultado: Awaited<ReturnType<typeof sendOne>>;
    try {
      resultado = await sendOne(item, dryRun);
    } catch (error) {
      // Uma pessoa quebrando nao pode interromper as outras.
      resultado = { outcome: "failed", reason: error instanceof Error ? error.message : String(error) };
    }
    if (resultado.outcome === "sent") sent += 1;
    if (resultado.outcome === "failed") failed += 1;
    detalhes.push({
      public_assessment_id: item.publicAssessmentId,
      recipient_masked: item.recipientMasked,
      outcome: resultado.outcome,
      ...(resultado.reason ? { reason: resultado.reason } : {}),
    });
  }

  res.status(200).json({
    ok: true,
    mode: "run",
    dry_run: dryRun,
    window: { from: plan.windowFromIso, to: plan.windowToIso },
    candidates: plan.candidates,
    sent,
    failed,
    suppressed,
    results: detalhes,
  });
}
