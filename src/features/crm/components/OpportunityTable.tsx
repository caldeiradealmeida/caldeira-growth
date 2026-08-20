import { useNavigate } from "react-router-dom";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "./StatusBadge";
import { CGI_STAGE_LABELS, COMMUNICATION_TYPE_LABELS, LEVEL_LABELS, REPORT_STATUS_LABELS } from "../constants";
import { deriveCgiStage, formatCgiProgress } from "../logic/cgiStage";
import { summarizeCommunications } from "../logic/communications";
import type { OpportunityRow } from "../types";

function formatDate(value: string | null | undefined): string {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("pt-BR");
}

function scoreTone(score: number | null): string {
  if (score === null) return "text-muted-foreground";
  if (score >= 70) return "text-emerald-700";
  if (score >= 45) return "text-amber-700";
  return "text-destructive";
}

export function OpportunityTable({ rows }: { rows: OpportunityRow[] }) {
  const navigate = useNavigate();

  if (rows.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-1 rounded-lg border border-dashed py-16 text-center">
        <p className="text-sm font-medium">Nenhuma oportunidade encontrada</p>
        <p className="text-sm text-muted-foreground">Ajuste os filtros ou a busca.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nome</TableHead>
            <TableHead>Empresa</TableHead>
            <TableHead>Data</TableHead>
            <TableHead className="text-right">Score</TableHead>
            <TableHead>Nível</TableHead>
            <TableHead>CGI</TableHead>
            <TableHead className="text-right">Progresso</TableHead>
            <TableHead>Relatório</TableHead>
            <TableHead>Mensagens</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Próxima ação</TableHead>
            <TableHead>Origem</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow
              key={row.lead.id}
              className="cursor-pointer"
              onClick={() => navigate(`/admin/crm/leads/${row.lead.id}`)}
              data-testid="crm-opportunity-row"
            >
              <TableCell className="font-medium">{row.lead.name}</TableCell>
              <TableCell>{row.lead.company}</TableCell>
              <TableCell className="text-muted-foreground">{formatDate(row.lead.created_at)}</TableCell>
              <TableCell className={`text-right font-semibold tabular-nums ${scoreTone(row.bestScore)}`}>
                {row.bestScore ?? "—"}
              </TableCell>
              <TableCell className="text-muted-foreground">
                {row.latestAssessment?.cgi_level ? LEVEL_LABELS[row.latestAssessment.cgi_level] : "—"}
              </TableCell>
              <TableCell className="text-muted-foreground">
                {(() => {
                  const view = deriveCgiStage(row.latestAssessment);
                  return view ? CGI_STAGE_LABELS[view.stage] : "—";
                })()}
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {(() => {
                  const view = deriveCgiStage(row.latestAssessment);
                  if (!view) return <span className="text-muted-foreground">—</span>;
                  return (
                    <span className={view.progressPercent === 0 ? "text-muted-foreground" : undefined}>
                      {formatCgiProgress(view)}
                    </span>
                  );
                })()}
              </TableCell>
              <TableCell>
                {row.latestReport ? (
                  <Badge variant="outline" className="font-normal">
                    {REPORT_STATUS_LABELS[row.latestReport.report_status] ?? row.latestReport.report_status}
                  </Badge>
                ) : (
                  <span className="text-muted-foreground">—</span>
                )}
              </TableCell>
              <TableCell className="text-muted-foreground">
                {(() => {
                  // Coluna aditiva: enquanto o motor de comunicação não estiver
                  // ligado, toda linha mostra "—". Isso é o estado correto, não
                  // um dado faltando.
                  const summary = summarizeCommunications(row.communications);
                  if (summary.sentCount === 0) {
                    return <span>—</span>;
                  }
                  const last = summary.lastSent;
                  return (
                    <span
                      className="whitespace-nowrap"
                      title={
                        last
                          ? `${COMMUNICATION_TYPE_LABELS[last.communication_type] ?? last.communication_type} · ${formatDate(last.sent_at)}`
                          : undefined
                      }
                    >
                      <span className="tabular-nums font-medium text-foreground">{summary.sentCount}</span>
                      {last ? <span> · {formatDate(last.sent_at)}</span> : null}
                      {summary.failedCount > 0 ? (
                        <span className="text-destructive"> · {summary.failedCount} falha{summary.failedCount > 1 ? "s" : ""}</span>
                      ) : null}
                    </span>
                  );
                })()}
              </TableCell>
              <TableCell>
                <StatusBadge status={row.opportunity?.status ?? "novo"} />
              </TableCell>
              <TableCell className="text-muted-foreground">
                {formatDate(row.opportunity?.next_action_at)}
              </TableCell>
              <TableCell className="text-muted-foreground">
                {row.originAttribution?.first_utm_source ?? "Direto"}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
