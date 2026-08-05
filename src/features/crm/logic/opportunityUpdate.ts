import type { CrmOpportunityStatus } from "../types";

export type OpportunityUpdateInput = {
  status?: CrmOpportunityStatus;
  notes?: string | null;
  nextActionAt?: string | null; // ISO datetime or null
  lastContactAt?: string | null;
  estimatedValue?: number | null;
  lostReason?: string | null;
};

export type OpportunityUpdatePayload = {
  status?: CrmOpportunityStatus;
  notes?: string | null;
  next_action_at?: string | null;
  last_contact_at?: string | null;
  estimated_value?: number | null;
  lost_reason?: string | null;
};

export class OpportunityUpdateError extends Error {}

/** Validates and shapes a partial opportunity edit into the exact column
 * payload Supabase expects. Throws on anything the DB check constraint would
 * also reject, so the UI can show the error before round-tripping. */
export function buildOpportunityUpdatePayload(input: OpportunityUpdateInput): OpportunityUpdatePayload {
  const payload: OpportunityUpdatePayload = {};

  if (input.status !== undefined) payload.status = input.status;

  if (input.notes !== undefined) {
    const trimmed = input.notes?.trim() ?? null;
    payload.notes = trimmed || null;
  }

  if (input.nextActionAt !== undefined) {
    if (input.nextActionAt) {
      const t = new Date(input.nextActionAt).getTime();
      if (Number.isNaN(t)) throw new OpportunityUpdateError("next_action_at inválida");
    }
    payload.next_action_at = input.nextActionAt || null;
  }

  if (input.lastContactAt !== undefined) {
    if (input.lastContactAt) {
      const t = new Date(input.lastContactAt).getTime();
      if (Number.isNaN(t)) throw new OpportunityUpdateError("last_contact_at inválida");
    }
    payload.last_contact_at = input.lastContactAt || null;
  }

  if (input.estimatedValue !== undefined) {
    if (input.estimatedValue !== null && input.estimatedValue < 0) {
      throw new OpportunityUpdateError("estimated_value não pode ser negativo");
    }
    payload.estimated_value = input.estimatedValue;
  }

  if (input.lostReason !== undefined) {
    const trimmed = input.lostReason?.trim() ?? null;
    payload.lost_reason = trimmed || null;
  }

  return payload;
}
