import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { downloadReportPdf, parseAiReport } from "@/features/cgi/services/report";
import { cgiUi } from "@/features/cgi/config";
import type { LeadForm } from "@/features/cgi/types";
import type { CgiScoreResult } from "@/lib/cgiScore";
import { useLeadDetail, useRegenerateReport, useUnlinkPerson } from "../hooks/useLeadDetail";
import { OpportunityForm } from "../components/OpportunityForm";
import { PersonLinkDialog } from "../components/PersonLinkDialog";
import { pickLatestReport, canRegenerateReport } from "../logic/reportVersion";
import { hasLeadComment, NO_COMMENT_MESSAGE } from "../logic/commentTab";
import { ASSESSMENT_STATUS_LABELS, CGI_STAGE_LABELS, DIMENSION_LABELS, LEVEL_LABELS, REPORT_STATUS_LABELS } from "../constants";
import { deriveCgiStage, formatCgiProgress } from "../logic/cgiStage";

function formatDateTime(value: string | null | undefined): string {
  if (!value) return "—";
  return new Date(value).toLocaleString("pt-BR");
}

export function CrmDetail() {
  const { leadId } = useParams<{ leadId: string }>();
  const { data, isLoading, isError, error } = useLeadDetail(leadId);
  const unlinkPerson = useUnlinkPerson(leadId ?? "");
  const regenerateReport = useRegenerateReport(leadId ?? "");
  const [selectedAssessmentId, setSelectedAssessmentId] = useState<string | null>(null);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);

  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
        Não foi possível carregar este lead: {error instanceof Error ? error.message : "erro desconhecido"}
      </div>
    );
  }

  const { lead, opportunity, assessments, answers, attribution, reports, personLink, sameEmailCandidates } = data;

  const activeAssessment =
    assessments.find((a) => a.id === selectedAssessmentId) ?? assessments[0] ?? null;
  const activeAnswers = activeAssessment ? answers.filter((a) => a.assessment_id === activeAssessment.id) : [];
  const activeAttribution = activeAssessment
    ? attribution.find((a) => a.assessment_id === activeAssessment.id)
    : null;
  const activeReport = activeAssessment
    ? pickLatestReport(reports, activeAssessment.public_assessment_id)
    : null;
  const canRegenerate = Boolean(
    activeAssessment && canRegenerateReport({ assessmentStatus: activeAssessment.status, isAdmin: true })
  );

  async function handleUnlink() {
    try {
      await unlinkPerson.mutateAsync();
      toast.success("Pessoa desvinculada desta oportunidade.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Falha ao desvincular.");
    }
  }

  async function handleRegenerate() {
    if (!activeAssessment) return;
    try {
      await regenerateReport.mutateAsync(activeAssessment.id);
      toast.success("Nova versão do relatório gerada.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Falha ao regenerar relatório.");
    }
  }

  async function handleDownloadPdf(report: NonNullable<typeof activeReport>) {
    setIsDownloadingPdf(true);
    try {
      const language = report.language ?? "pt";
      await downloadReportPdf({
        aiReport: report.report_json as ReturnType<typeof parseAiReport>,
        lead: report.lead_json as LeadForm,
        result: report.score_json as CgiScoreResult,
        t: cgiUi[language],
        lang: language,
      });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Falha ao gerar PDF.");
    } finally {
      setIsDownloadingPdf(false);
    }
  }

  return (
    <div className="space-y-4">
      <Link to="/admin/crm" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" />
        Voltar para oportunidades
      </Link>

      <div>
        <h1 className="text-xl font-semibold tracking-tight">{lead.name}</h1>
        <p className="text-sm text-muted-foreground">
          {lead.role} em {lead.company} · {lead.email} · {lead.phone || "sem telefone"}
        </p>
      </div>

      {sameEmailCandidates.length > 0 && (
        <div className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
          <p className="font-medium">Existe uma pessoa cadastrada com este e-mail.</p>
          <ul className="mt-1 list-inside list-disc">
            {sameEmailCandidates.map((c) => (
              <li key={c.id}>
                {c.name} · {c.company} · {formatDateTime(c.created_at)}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Contexto da empresa</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1.5 text-sm">
              <Row label="Setor" value={lead.sector} />
              <Row label="Funcionários" value={lead.employee_count} />
              <Row label="Faturamento" value={lead.annual_revenue_range} />
              <Row label="Modelo comercial" value={lead.commercial_relationship_model} />
              <Row label="Desafio atual" value={lead.current_challenge} />
              <Row label="Meta de crescimento" value={lead.growth_goal} />
              <Row label="Intenção de investimento" value={lead.investment_intent} />
              {lead.comments && <Row label="Comentários" value={lead.comments} />}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Pessoa vinculada</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              {personLink ? (
                <>
                  <p className="font-medium">{personLink.person.display_name || "(sem nome)"}</p>
                  <p className="text-muted-foreground">
                    Vinculado por {personLink.linked_by_email} em {formatDateTime(personLink.linked_at)}
                  </p>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="outline" size="sm">
                        Desvincular
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Desvincular pessoa?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Esta oportunidade deixa de estar agrupada com {personLink.person.display_name}. Nada é
                          apagado -- você pode vincular de novo depois.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={() => void handleUnlink()}>Desvincular</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </>
              ) : (
                <>
                  <p className="text-muted-foreground">Nenhuma pessoa vinculada.</p>
                  <PersonLinkDialog
                    lead={lead}
                    trigger={
                      <Button variant="outline" size="sm">
                        Vincular pessoa
                      </Button>
                    }
                  />
                </>
              )}
            </CardContent>
          </Card>

          {activeAttribution && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Origem</CardTitle>
              </CardHeader>
              <CardContent className="space-y-1.5 text-sm">
                <Row label="UTM source" value={activeAttribution.first_utm_source ?? "Direto"} />
                <Row label="UTM medium" value={activeAttribution.first_utm_medium ?? "—"} />
                <Row label="Campanha" value={activeAttribution.first_utm_campaign ?? "—"} />
                <Row label="Referrer" value={activeAttribution.first_referrer ?? "—"} />
                <Row label="Landing page" value={activeAttribution.first_landing_page ?? "—"} />
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-4 lg:col-span-2">
          <OpportunityForm leadId={lead.id} opportunity={opportunity} />

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Assessments ({assessments.length})</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {assessments.length === 0 && <p className="text-sm text-muted-foreground">Nenhum assessment.</p>}
              {assessments.map((a) => (
                <button
                  key={a.id}
                  type="button"
                  onClick={() => setSelectedAssessmentId(a.id)}
                  className={`flex w-full items-center justify-between rounded-md border px-3 py-2 text-left text-sm hover:bg-muted ${
                    activeAssessment?.id === a.id ? "border-primary bg-muted" : ""
                  }`}
                >
                  <span>
                    {formatDateTime(a.created_at)} ·{" "}
                    <span className="text-muted-foreground">{CGI_STAGE_LABELS[deriveCgiStage(a)?.stage ?? ""] ?? ASSESSMENT_STATUS_LABELS[a.status] ?? a.status} · {formatCgiProgress(deriveCgiStage(a))}</span>
                  </span>
                  <span className="font-semibold tabular-nums">{a.cgi_score ?? "—"}</span>
                </button>
              ))}
            </CardContent>
          </Card>

          {activeAssessment && (
            <Tabs defaultValue="scores">
              <TabsList>
                <TabsTrigger value="scores">Dimensões</TabsTrigger>
                <TabsTrigger value="answers">Respostas ({activeAnswers.length})</TabsTrigger>
                <TabsTrigger value="comment">Comentário</TabsTrigger>
                <TabsTrigger value="report">Relatório</TabsTrigger>
              </TabsList>

              <TabsContent value="scores">
                <Card>
                  <CardContent className="grid grid-cols-2 gap-3 pt-6 sm:grid-cols-5">
                    {[
                      ["strategy", activeAssessment.strategy_score],
                      ["market", activeAssessment.market_customer_score],
                      ["growthMachine", activeAssessment.growth_engine_score],
                      ["execution", activeAssessment.execution_management_score],
                      ["leadership", activeAssessment.leadership_culture_score],
                    ].map(([dim, score]) => (
                      <div key={dim as string} className="rounded-md border p-3 text-center">
                        <p className="text-xs text-muted-foreground">{DIMENSION_LABELS[dim as string]}</p>
                        <p className="text-lg font-semibold">{score ?? "—"}</p>
                      </div>
                    ))}
                  </CardContent>
                  {activeAssessment.cgi_level && (
                    <CardContent className="pt-0">
                      <Badge variant="outline">Nível: {LEVEL_LABELS[activeAssessment.cgi_level]}</Badge>
                    </CardContent>
                  )}
                </Card>
              </TabsContent>

              <TabsContent value="answers">
                <Card>
                  <CardContent className="max-h-96 space-y-1 overflow-y-auto pt-6 text-sm">
                    {activeAnswers.length === 0 && <p className="text-muted-foreground">Sem respostas registradas.</p>}
                    {activeAnswers.map((a) => (
                      <div key={a.id} className="flex items-center justify-between border-b py-1.5 last:border-0">
                        <span className="text-muted-foreground">
                          {DIMENSION_LABELS[a.dimension_id]} · {a.question_id}
                        </span>
                        <span className="font-medium tabular-nums">{a.answer_value}</span>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="comment">
                <Card>
                  <CardContent className="pt-6 text-sm">
                    {hasLeadComment(lead.comments) ? (
                      <p className="whitespace-pre-wrap">{lead.comments}</p>
                    ) : (
                      <p className="text-muted-foreground">{NO_COMMENT_MESSAGE}</p>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="report">
                <Card>
                  <CardContent className="space-y-3 pt-6 text-sm">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-2">
                        {activeReport && (
                          <>
                            <Badge variant="outline">
                              {REPORT_STATUS_LABELS[activeReport.report_status] ?? activeReport.report_status}
                              {activeReport.language ? ` · ${activeReport.language}` : ""}
                            </Badge>
                            <Badge variant="outline">
                              Versão {activeReport.version} · {formatDateTime(activeReport.generation_completed_at ?? activeReport.created_at)}
                              {activeReport.model ? ` · ${activeReport.model}` : ""}
                            </Badge>
                          </>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {activeReport?.report_json != null && (
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={isDownloadingPdf}
                            onClick={() => void handleDownloadPdf(activeReport)}
                          >
                            {isDownloadingPdf ? "Gerando PDF..." : "Baixar PDF"}
                          </Button>
                        )}
                        {canRegenerate && (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button size="sm" disabled={regenerateReport.isPending}>
                                {regenerateReport.isPending ? "Gerando..." : "Regenerar relatório"}
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Regenerar relatório?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Isso cria uma nova versão do relatório usando as respostas e o score originais
                                  deste assessment, com o modelo e o prompt atuais. Nenhum e-mail é enviado ao
                                  participante e a versão anterior é preservada.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction onClick={() => void handleRegenerate()}>
                                  Regenerar
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        )}
                      </div>
                    </div>
                    {!activeReport && <p className="text-muted-foreground">Nenhum relatório para este assessment.</p>}
                    {activeReport?.ai_report_text && (
                      <p className="whitespace-pre-wrap text-muted-foreground">{activeReport.ai_report_text}</p>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          )}
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-medium">{value || "—"}</span>
    </div>
  );
}
