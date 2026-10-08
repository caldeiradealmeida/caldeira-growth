import { describe, expect, it } from "vitest";
import { groupCommunicationsByLead, summarizeCommunications } from "./communications";
import type { CgiCommunication } from "../types";

function comm(overrides: Partial<CgiCommunication> = {}): CgiCommunication {
  return {
    id: "c1",
    lead_id: "lead_1",
    assessment_id: "a1",
    public_assessment_id: "KrjNnuPHmv2Rcv8j",
    communication_type: "report_delivery",
    communication_class: "transactional",
    channel: "email",
    status: "sent",
    scheduled_at: null,
    sent_at: "2026-08-19T12:00:00.000Z",
    failed_at: null,
    cancelled_at: null,
    recipient_masked: "a***@example.com",
    subject: "Seu CGI",
    error_code: null,
    reason: null,
    actor: "system:completion",
    created_at: "2026-08-19T12:00:00.000Z",
    ...overrides,
  };
}

describe("summarizeCommunications", () => {
  it("trata o ledger vazio como estado normal, não como ausência de dado", () => {
    expect(summarizeCommunications([])).toEqual({
      sentCount: 0,
      failedCount: 0,
      scheduledCount: 0,
      lastSent: null,
      nextScheduled: null,
    });
    expect(summarizeCommunications(null).sentCount).toBe(0);
    expect(summarizeCommunications(undefined).lastSent).toBeNull();
  });

  it("conta só o que efetivamente saiu", () => {
    const summary = summarizeCommunications([
      comm({ id: "1" }),
      comm({ id: "2", status: "cancelled", sent_at: null, cancelled_at: "2026-08-19T13:00:00.000Z" }),
      comm({ id: "3", status: "suppressed", sent_at: null }),
      comm({ id: "4", status: "failed", sent_at: null, failed_at: "2026-08-19T14:00:00.000Z" }),
    ]);
    expect(summary.sentCount).toBe(1);
    expect(summary.failedCount).toBe(1);
  });

  it("escolhe a última enviada pelo sent_at, não pela ordem do array", () => {
    const summary = summarizeCommunications([
      comm({ id: "antiga", sent_at: "2026-08-10T12:00:00.000Z" }),
      comm({ id: "recente", sent_at: "2026-08-20T12:00:00.000Z" }),
      comm({ id: "meio", sent_at: "2026-08-15T12:00:00.000Z" }),
    ]);
    expect(summary.lastSent?.id).toBe("recente");
  });

  it("escolhe a próxima agendada pela data mais próxima", () => {
    const summary = summarizeCommunications([
      comm({ id: "d90", status: "scheduled", sent_at: null, scheduled_at: "2026-11-01T12:00:00.000Z", communication_type: "revisit_d90" }),
      comm({ id: "d2", status: "scheduled", sent_at: null, scheduled_at: "2026-08-22T12:00:00.000Z", communication_type: "insight_d2" }),
    ]);
    expect(summary.scheduledCount).toBe(2);
    expect(summary.nextScheduled?.id).toBe("d2");
  });
});

describe("groupCommunicationsByLead", () => {
  it("agrupa por lead", () => {
    const grouped = groupCommunicationsByLead([
      comm({ id: "1", lead_id: "lead_1" }),
      comm({ id: "2", lead_id: "lead_2" }),
      comm({ id: "3", lead_id: "lead_1" }),
    ]);
    expect(grouped.get("lead_1")).toHaveLength(2);
    expect(grouped.get("lead_2")).toHaveLength(1);
  });

  it("ignora linhas órfãs sem quebrar (lead_id é ON DELETE SET NULL)", () => {
    const grouped = groupCommunicationsByLead([comm({ id: "1", lead_id: null })]);
    expect(grouped.size).toBe(0);
  });

  it("aceita ausência total de ledger", () => {
    expect(groupCommunicationsByLead(undefined).size).toBe(0);
  });
});
