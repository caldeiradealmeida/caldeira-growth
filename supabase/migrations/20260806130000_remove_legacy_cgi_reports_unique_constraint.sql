-- PHASE 3 of 3 (final). Apply ONLY after:
--   (a) 20260806120000_add_cgi_reports_versioning_compat.sql is already applied, AND
--   (b) the new code (api/_cgi-supabase.ts using on_conflict=public_assessment_id,version,
--       and api/crm/regenerate-cgi-report.ts) is already deployed and live in Production.
--
-- Drops the old single-column unique constraint, which is what was holding
-- every public_assessment_id to exactly one row. After this runs, manual
-- regeneration (INSERT with version = max(version)+1) can succeed for
-- assessments that already have a report, producing a genuine second (or
-- later) version without ever touching the earlier row.
--
-- Apply manually after review. Do not run automatically from Codex.

alter table public.cgi_reports
  drop constraint cgi_reports_public_assessment_id_key;

-- Rollback:
-- alter table public.cgi_reports add constraint cgi_reports_public_assessment_id_key unique (public_assessment_id);
-- (only safe to roll back if no public_assessment_id has more than one row at that point)
