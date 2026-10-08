import { describe, expect, it } from "vitest";
import { STATUS_LABELS, STATUS_ORDER } from "../constants";

// 'enviar_proposta' is presentation + vocabulary only in this phase. No
// automation reads it: the abandonment commercial guard is binary ("is the
// status novo"), so any non-novo value -- including this one -- blocks
// automated sending without a rule of its own.
describe("commercial status vocabulary", () => {
  it("includes Enviar proposta between reunião agendada and proposta enviada", () => {
    const i = STATUS_ORDER.indexOf("enviar_proposta");
    expect(i).toBeGreaterThan(STATUS_ORDER.indexOf("reuniao_agendada"));
    expect(i).toBeLessThan(STATUS_ORDER.indexOf("proposta_enviada"));
    expect(STATUS_LABELS.enviar_proposta).toBe("Enviar proposta");
  });

  it("keeps every status labelled and ordered exactly once", () => {
    expect(new Set(STATUS_ORDER).size).toBe(STATUS_ORDER.length);
    for (const s of STATUS_ORDER) expect(STATUS_LABELS[s]).toBeTruthy();
    expect(Object.keys(STATUS_LABELS).sort()).toEqual([...STATUS_ORDER].sort());
  });

  it("did not drop any pre-existing status", () => {
    for (const s of ["novo","revisado","contato_pendente","contato_realizado","reuniao_agendada","proposta_enviada","convertido","sem_interesse","descartado"]) {
      expect(STATUS_ORDER).toContain(s);
    }
  });
});
