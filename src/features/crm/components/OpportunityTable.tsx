import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { StatusBadge } from "./StatusBadge";
import { PriorityBadge } from "./PriorityBadge";
import { CompanySizeBadge } from "./CompanySizeBadge";
import { CGI_STAGE_LABELS, LEVEL_LABELS, REPORT_STATUS_LABELS } from "../constants";
import { deriveCgiStage, formatCgiProgress } from "../logic/cgiStage";
import {
  QUEUE_FILTER_LABELS,
  compareForQueue,
  deriveQueueView,
  matchesQueueFilter,
  type QueueFilter,
} from "../logic/commercialPriority";
import type { OpportunityRow } from "../types";

// O Pipe deixou de ser uma tabela de registros e virou uma fila de trabalho.
// A pergunta que ele precisa responder ao abrir de manhã é uma só: quem eu
// preciso contatar hoje. Por isso a ordenação padrão é por prioridade, e não
// por data, e por isso as colunas foram agrupadas em vez de somadas -- cada
// coluna nova custa leitura.

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

const FILTROS: QueueFilter[] = ["todos", "a_contatar", "follow_up", "em_proposta", "aguardando"];

export function OpportunityTable({ rows }: { rows: OpportunityRow[] }) {
  const navigate = useNavigate();
  const [filtro, setFiltro] = useState<QueueFilter>("todos");

  const linhas = useMemo(
    () =>
      rows
        .map((row) => ({ row, view: deriveQueueView(row) }))
        .sort((a, b) =>
          compareForQueue(
            { priority: a.view.priority, size: a.view.size, bestScore: a.row.bestScore },
            { priority: b.view.priority, size: b.view.size, bestScore: b.row.bestScore }
          )
        ),
    [rows]
  );

  const contagens = useMemo(() => {
    const acc: Record<QueueFilter, number> = { todos: 0, a_contatar: 0, follow_up: 0, em_proposta: 0, aguardando: 0 };
    for (const filtroAtual of FILTROS) {
      acc[filtroAtual] = linhas.filter(({ view }) => matchesQueueFilter(filtroAtual, view)).length;
    }
    return acc;
  }, [linhas]);

  const visiveis = linhas.filter(({ view }) => matchesQueueFilter(filtro, view));

  if (rows.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-1 rounded-lg border border-dashed py-16 text-center">
        <p className="text-sm font-medium">Nenhuma oportunidade encontrada</p>
        <p className="text-sm text-muted-foreground">Ajuste os filtros ou a busca.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {FILTROS.map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => setFiltro(item)}
            aria-pressed={filtro === item}
            className={cn(
              "rounded-full border px-3 py-1 text-sm transition-colors",
              filtro === item
                ? "border-transparent bg-primary text-primary-foreground"
                : "border-border text-muted-foreground hover:text-foreground"
            )}
          >
            {QUEUE_FILTER_LABELS[item]}
            <span className="ml-1.5 tabular-nums opacity-70">{contagens[item]}</span>
          </button>
        ))}
      </div>

      <div className="overflow-x-auto rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[64px]">Prior.</TableHead>
              <TableHead>Lead</TableHead>
              <TableHead>Porte</TableHead>
              <TableHead>CGI</TableHead>
              <TableHead>Relatório</TableHead>
              <TableHead>Mensagens</TableHead>
              <TableHead>Contato</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Próxima ação</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {visiveis.map(({ row, view }) => {
              const estagio = deriveCgiStage(row.latestAssessment);
              return (
                <TableRow
                  key={row.lead.id}
                  className="cursor-pointer"
                  onClick={() => navigate(`/admin/crm/leads/${row.lead.id}`)}
                  data-testid="crm-opportunity-row"
                >
                  <TableCell>
                    <PriorityBadge level={view.priority.level} reason={view.priority.reason} />
                  </TableCell>

                  {/* Nome, empresa e telefone juntos: é o bloco de identidade e
                      de contato, e separá-los em três colunas só gastava largura. */}
                  <TableCell>
                    <div className="font-medium leading-tight">{row.lead.name}</div>
                    <div className="text-sm text-muted-foreground leading-tight">{row.lead.company}</div>
                    {row.lead.phone ? (
                      <a
                        href={`tel:${row.lead.phone.replace(/[^\d+]/g, "")}`}
                        onClick={(event) => event.stopPropagation()}
                        className="text-sm tabular-nums text-primary underline-offset-4 hover:underline"
                      >
                        {row.lead.phone}
                      </a>
                    ) : (
                      <span className="text-sm text-muted-foreground">sem telefone</span>
                    )}
                  </TableCell>

                  <TableCell>
                    <CompanySizeBadge size={view.size} />
                  </TableCell>

                  {/* Estágio, progresso, score e nível são uma coisa só: o
                      estado do diagnóstico. */}
                  <TableCell className="whitespace-nowrap">
                    <div className="text-sm">
                      {estagio ? CGI_STAGE_LABELS[estagio.stage] : "—"}
                      {estagio && estagio.stage !== "concluido" ? (
                        <span className="ml-1 tabular-nums text-muted-foreground">
                          {formatCgiProgress(estagio)}
                        </span>
                      ) : null}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      <span className={cn("font-semibold tabular-nums", scoreTone(row.bestScore))}>
                        {row.bestScore ?? "—"}
                      </span>
                      {row.latestAssessment?.cgi_level
                        ? ` · ${LEVEL_LABELS[row.latestAssessment.cgi_level]}`
                        : ""}
                    </div>
                  </TableCell>

                  <TableCell className="whitespace-nowrap">
                    {row.latestReport ? (
                      <Badge variant="outline" className="font-normal">
                        {REPORT_STATUS_LABELS[row.latestReport.report_status] ?? row.latestReport.report_status}
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                    {view.reportOpened ? (
                      <div className="text-xs text-emerald-700" title={`Aberto em ${formatDate(row.reportOpenedAt)}`}>
                        aberto
                      </div>
                    ) : null}
                  </TableCell>

                  {/* Não é um número: é o que a pessoa recebeu. Chips tracejados
                      são histórico legado, anterior ao ledger. */}
                  <TableCell>
                    {view.chips.length === 0 ? (
                      <span className="text-muted-foreground">—</span>
                    ) : (
                      <div className="flex flex-wrap gap-1">
                        {view.chips.map((chip) => (
                          <span
                            key={chip.key}
                            title={chip.detail}
                            className={cn(
                              "whitespace-nowrap rounded-full border px-2 py-0.5 text-xs",
                              chip.proven
                                ? "border-border bg-muted/50 text-muted-foreground"
                                : "border-dashed border-border text-muted-foreground/80"
                            )}
                          >
                            {chip.label}
                          </span>
                        ))}
                      </div>
                    )}
                  </TableCell>

                  <TableCell className="whitespace-nowrap text-sm">
                    {view.contact.kind === "never" ? (
                      <span className="font-medium text-foreground">Nunca contatado</span>
                    ) : view.contact.kind === "contacted" ? (
                      <span className="text-muted-foreground" title={formatDate(view.contact.atIso)}>
                        há {view.contact.daysAgo}d
                      </span>
                    ) : (
                      <span
                        className="text-muted-foreground"
                        title="O status foi movido por uma pessoa, mas a data do contato não foi registrada."
                      >
                        contatado · sem data
                      </span>
                    )}
                  </TableCell>

                  <TableCell>
                    <StatusBadge status={row.opportunity?.status ?? "novo"} />
                  </TableCell>

                  <TableCell className="whitespace-nowrap text-muted-foreground">
                    {formatDate(row.opportunity?.next_action_at)}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {visiveis.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">
          Nenhuma oportunidade em “{QUEUE_FILTER_LABELS[filtro]}”.
        </p>
      ) : null}
    </div>
  );
}
