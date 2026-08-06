-- PHASE 1 of 2 -- backward compatible. Safe to apply before the new code
-- (api/_cgi-supabase.ts, api/crm/regenerate-cgi-report.ts) is deployed.
--
-- Adds `version` and a new composite unique constraint, but deliberately
-- KEEPS the existing cgi_reports_public_assessment_id_key constraint. While
-- both constraints coexist, a given public_assessment_id can still only
-- ever have ONE row (the old constraint alone still enforces that), so:
--   - the currently-deployed code (on_conflict=public_assessment_id) keeps
--     working exactly as before -- this migration changes nothing it reads;
--   - once the new code is deployed (Phase 2), first generation and retries
--     use on_conflict=public_assessment_id,version with version=1, which
--     the new composite constraint also satisfies, so no behavior changes;
--   - manual regeneration (INSERT with version = max(version)+1) will FAIL
--     with a clean 409 conflict on any assessment that already has a report
--     row, because the old constraint still forbids a second row for the
--     same public_assessment_id -- this is intentional for this phase, see
--     PHASE 3 (remove_legacy_cgi_reports_unique_constraint.sql). It will
--     succeed only for assessments with zero existing report rows, since
--     there is nothing for the old constraint to conflict with.
--
-- Apply manually after review. Do not run automatically from Codex.

alter table public.cgi_reports
  add column version integer not null default 1;

alter table public.cgi_reports
  add constraint cgi_reports_public_assessment_id_version_key
  unique (public_assessment_id, version);

comment on column public.cgi_reports.version is
  'Report version for a given public_assessment_id. version = 1 is always the original best-effort/idempotent generation from the CGI completion flow. version > 1 rows are created only by admin-triggered manual regeneration (CGI Pipe), via plain INSERT, never overwriting earlier versions. Until PHASE 3 (drop of cgi_reports_public_assessment_id_key) runs, only version = 1 can actually exist in practice.';

-- Rollback:
-- alter table public.cgi_reports drop constraint cgi_reports_public_assessment_id_version_key;
-- alter table public.cgi_reports drop column version;
