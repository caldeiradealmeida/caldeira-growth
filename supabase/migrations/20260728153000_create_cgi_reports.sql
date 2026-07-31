-- Creates durable CGI report storage used for backend idempotency.
-- Apply manually after review. Do not run automatically from Codex.

create extension if not exists pgcrypto;

create table public.cgi_reports (
  id uuid primary key default gen_random_uuid(),
  public_assessment_id text not null,
  anonymous_session_id text null,
  completion_event_id text null,
  status text not null default 'generating',
  report_status text not null default 'report_generating',
  secondary_sync_status text not null default 'secondary_sync_pending',
  ai_status text null,
  ai_generation_status text null,
  ai_report text null,
  ai_report_text text null,
  report_json jsonb null,
  lead_json jsonb null,
  answers_json jsonb null,
  score_json jsonb null,
  website_enrichment_json jsonb null,
  request_context_json jsonb null,
  language text not null default 'pt',
  model text null,
  generation_started_at timestamptz null,
  generation_completed_at timestamptz null,
  secondary_sync_updated_at timestamptz null,
  error_code text null,
  error_message text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint cgi_reports_public_assessment_id_key unique (public_assessment_id),
  constraint cgi_reports_status_check check (status in ('generating', 'ready', 'failed')),
  constraint cgi_reports_report_status_check check (
    report_status in ('report_generating', 'report_ready', 'report_failed')
  ),
  constraint cgi_reports_secondary_sync_status_check check (
    secondary_sync_status in (
      'secondary_sync_pending',
      'secondary_sync_failed',
      'secondary_sync_succeeded'
    )
  ),
  constraint cgi_reports_ai_status_check check (
    ai_status is null or ai_status in ('generated', 'not_configured', 'error')
  ),
  constraint cgi_reports_ai_generation_status_check check (
    ai_generation_status is null or ai_generation_status in ('generated', 'not_configured', 'error')
  ),
  constraint cgi_reports_language_check check (language in ('pt', 'en', 'es'))
);

create unique index if not exists cgi_reports_completion_event_id_key
  on public.cgi_reports (completion_event_id)
  where completion_event_id is not null;

create index if not exists cgi_reports_report_status_idx
  on public.cgi_reports (report_status);

create index if not exists cgi_reports_updated_at_idx
  on public.cgi_reports (updated_at desc);

alter table public.cgi_reports enable row level security;

-- No public policies are created intentionally.
-- The CGI API uses SUPABASE_SERVICE_ROLE_KEY through PostgREST; service role bypasses RLS.
-- Add explicit read policies only if a future authenticated user-facing retrieval API requires them.

-- Keeps updated_at in sync automatically, matching cgi_leads, cgi_assessments,
-- cgi_attribution and cgi_answers (all use public.cgi_set_updated_at()).
drop trigger if exists trg_cgi_reports_updated_at
  on public.cgi_reports;
create trigger trg_cgi_reports_updated_at
  before update on public.cgi_reports
  for each row
  execute function public.cgi_set_updated_at();

comment on table public.cgi_reports is
  'Durable CGI report storage for idempotent report generation and retry/refresh recovery.';
comment on column public.cgi_reports.status is
  'Internal generation lifecycle: generating, ready, failed.';
comment on column public.cgi_reports.report_status is
  'API-facing report lifecycle: report_generating, report_ready, report_failed.';
comment on column public.cgi_reports.report_json is
  'Structured AI report JSON when ai_report contains valid JSON.';

-- Rollback:
-- drop table if exists public.cgi_reports;
