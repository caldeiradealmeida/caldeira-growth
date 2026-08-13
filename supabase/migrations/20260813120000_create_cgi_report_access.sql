-- Secure, revocable, expiring access to an individual CGI report via a
-- bearer token delivered in a URL fragment (never a query string, never
-- persisted client-side). One row per assessment -- issuing a new token
-- for the same public_assessment_id replaces the previous one in place
-- (the old link stops working immediately; this is how "revoke and
-- reissue" works without a separate action).
--
-- Deliberately simpler than an earlier, never-applied design: only the
-- plaintext token's SHA-256 hash is stored, never a recoverable
-- ciphertext. This means a lost/not-yet-sent token cannot be recovered --
-- only reissued (new token, new hash, old one now invalid). That trade-off
-- is intentional: this table has no requirement today to resend the exact
-- same link, only to grant/revoke access.
--
-- Apply manually after review. Do not run automatically from Codex.

create table public.cgi_report_access (
  id uuid primary key default gen_random_uuid(),
  public_assessment_id text not null unique references public.cgi_assessments (public_assessment_id) on delete cascade,
  token_hash text not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  expires_at timestamptz not null,
  revoked_at timestamptz null,
  last_accessed_at timestamptz null
);

create index idx_cgi_report_access_expires_at on public.cgi_report_access (expires_at);

alter table public.cgi_report_access enable row level security;
-- Zero policies on purpose: this table has no client-side access story at
-- all (unlike the CRM tables). It is only ever touched by server-side code
-- using the service role key.
revoke all on public.cgi_report_access from anon, authenticated;

create trigger trg_cgi_report_access_updated_at
  before update on public.cgi_report_access
  for each row execute function public.cgi_set_updated_at();

comment on table public.cgi_report_access is
  'Bearer-token access to a single CGI report via public_assessment_id. Token itself is never stored -- only its SHA-256 hash. Read-only lookup path (resolveReportAccessToken); never touches cgi_reports/cgi_assessments beyond the read-only report fetch it authorizes.';
comment on column public.cgi_report_access.token_hash is
  'SHA-256 hex digest of the plaintext bearer token. The plaintext exists only transiently server-side at issuance time and in the emailed/copied link -- never persisted.';
comment on column public.cgi_report_access.revoked_at is
  'Set to block access immediately without waiting for expires_at. Issuing a new token (which replaces this row) also implicitly un-revokes, since the row is fully replaced.';

-- Rollback:
-- drop table if exists public.cgi_report_access;
