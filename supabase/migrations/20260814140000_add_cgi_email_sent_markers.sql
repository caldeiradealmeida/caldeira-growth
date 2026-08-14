-- Etapa 4: minimal idempotency markers for the two automated CGI participant
-- emails (report-ready, abandonment). A dedicated nullable timestamp per
-- email kind, set only after a confirmed successful send, so:
--   * a retry/regeneration that never actually sent an email leaves this
--     null and is free to try again with a fresh token;
--   * once set, nothing in the codebase re-attempts that email kind for
--     this assessment again.
-- No other column, table, or constraint is touched. Both are purely
-- additive (nullable, no default beyond NULL), so no existing row can
-- violate anything and no backfill is required.

alter table public.cgi_assessments
  add column if not exists report_email_sent_at timestamptz null;

alter table public.cgi_assessments
  add column if not exists abandonment_email_sent_at timestamptz null;
