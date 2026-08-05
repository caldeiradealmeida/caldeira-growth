-- Creates the "CGI Pipeline" mini-CRM schema: crm_people, crm_people_links,
-- crm_opportunities, plus a single-admin RLS allowlist (crm_admins).
-- Apply manually after review. Do not run automatically from Codex.
--
-- Scope contract:
--   - cgi_leads is the sole source of truth for people/contacts. This migration
--     never writes to any cgi_* table, never adds a trigger on cgi_leads, and
--     never deletes/merges cgi_leads rows.
--   - crm_opportunities is 1:1 with cgi_leads.id (one row per submission/context,
--     never per person) -- status/notes/next_action belong to the opportunity.
--   - crm_people/crm_people_links are optional, manually-created groupings.
--     No automatic linking on email match in this version (v0.1): the frontend
--     only shows a hint and an explicit "vincular a pessoa existente" action.
--   - Read-only admin access to the 6 existing cgi_* tables; write access is
--     restricted to the 3 new crm_* tables below.

-- ============================================================================
-- 1. Admin allowlist
-- ============================================================================

create table public.crm_admins (
  email text primary key,
  created_at timestamptz not null default now()
);

insert into public.crm_admins (email) values ('deniscaldeira@caldeiragrowth.com');

alter table public.crm_admins enable row level security;
-- Intentionally zero policies here: nobody queries this table directly from
-- the client. is_crm_admin() below is SECURITY DEFINER and bypasses this RLS
-- to read it, which is what every other policy in this migration calls.

revoke all on public.crm_admins from anon, authenticated;

-- ============================================================================
-- 2. is_crm_admin() helper -- avoids repeating the crm_admins subquery (and
--    avoids the RLS-recursion trap of a plain subquery against a table whose
--    own RLS would otherwise block the very check that grants access to it).
-- ============================================================================

create or replace function public.is_crm_admin() returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (select 1 from public.crm_admins a where a.email = auth.email());
$$;

revoke all on function public.is_crm_admin() from public;
grant execute on function public.is_crm_admin() to authenticated;

-- ============================================================================
-- 3. crm_people (layer 1: person). Empty by default -- only populated when an
--    admin explicitly groups two or more opportunities as the same human.
-- ============================================================================

create table public.crm_people (
  id uuid primary key default gen_random_uuid(),
  display_name text null,
  primary_email_normalized text null,
  phone text null,
  notes text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_crm_people_email on public.crm_people (primary_email_normalized);

-- ============================================================================
-- 4. crm_people_links (opportunity -> person). PK on lead_id enforces exactly
--    one person per opportunity. ON DELETE RESTRICT on person_id: deleting a
--    person with existing links fails loudly -- admin must unlink first.
-- ============================================================================

create table public.crm_people_links (
  lead_id uuid primary key references public.cgi_leads (id) on delete cascade,
  person_id uuid not null references public.crm_people (id) on delete restrict,
  linked_by_email text not null,
  linked_at timestamptz not null default now()
);

create index idx_crm_people_links_person on public.crm_people_links (person_id);

-- Never trust a client-supplied linked_by_email. This trigger unconditionally
-- overwrites it with the authenticated caller's own email on every insert --
-- whether the row came from crm_link_person() below or a direct PostgREST
-- insert -- so the audit trail cannot be spoofed from the frontend.

create or replace function public.crm_force_linked_by_email() returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.linked_by_email := auth.email();
  if new.linked_by_email is null then
    raise exception 'crm_people_links.linked_by_email could not be resolved from auth.email()';
  end if;
  return new;
end;
$$;

create trigger trg_crm_people_links_force_email
  before insert on public.crm_people_links
  for each row execute function public.crm_force_linked_by_email();

-- ============================================================================
-- 5. crm_opportunities (layer 2: opportunity/diagnosis). 1:1 with cgi_leads.id.
-- ============================================================================

create table public.crm_opportunities (
  lead_id uuid primary key references public.cgi_leads (id) on delete cascade,
  status text not null default 'novo',
  owner_email text null,
  notes text null,
  next_action_at timestamptz null,
  last_contact_at timestamptz null,
  estimated_value numeric null,
  lost_reason text null,
  is_test_excluded boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint crm_opportunities_status_check check (status in (
    'novo', 'revisado', 'contato_pendente', 'contato_realizado',
    'reuniao_agendada', 'proposta_enviada', 'convertido',
    'sem_interesse', 'descartado'
  )),
  constraint crm_opportunities_estimated_value_check check (
    estimated_value is null or estimated_value >= 0
  )
);

-- ============================================================================
-- 6. updated_at maintenance
-- ============================================================================

create or replace function public.crm_set_updated_at() returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trg_crm_people_updated_at
  before update on public.crm_people
  for each row execute function public.crm_set_updated_at();

create trigger trg_crm_opportunities_updated_at
  before update on public.crm_opportunities
  for each row execute function public.crm_set_updated_at();

-- ============================================================================
-- 7. Manual linking RPCs. SECURITY INVOKER on purpose: these run as the
--    calling (authenticated) user, so they stay fully governed by the RLS
--    policies below -- no privilege escalation, no bypass path.
-- ============================================================================

create or replace function public.crm_link_person(p_lead_id uuid, p_person_id uuid)
returns void
language sql
security invoker
set search_path = public
as $$
  insert into public.crm_people_links (lead_id, person_id, linked_by_email)
  values (p_lead_id, p_person_id, auth.email());
$$;

create or replace function public.crm_unlink_person(p_lead_id uuid)
returns void
language sql
security invoker
set search_path = public
as $$
  delete from public.crm_people_links where lead_id = p_lead_id;
$$;

revoke all on function public.crm_link_person(uuid, uuid) from public;
revoke all on function public.crm_unlink_person(uuid) from public;
grant execute on function public.crm_link_person(uuid, uuid) to authenticated;
grant execute on function public.crm_unlink_person(uuid) to authenticated;

-- ============================================================================
-- 8. Table grants. This project's default ACL grants anon+authenticated full
--    privileges on every new public table (see cgi_reports). Revoke that
--    first, then grant back only what each role actually needs.
-- ============================================================================

revoke all on public.crm_people from anon, authenticated;
revoke all on public.crm_people_links from anon, authenticated;
revoke all on public.crm_opportunities from anon, authenticated;

grant select, insert, update, delete on public.crm_people to authenticated;
grant select, insert, delete on public.crm_people_links to authenticated;
grant select, insert, update, delete on public.crm_opportunities to authenticated;

-- The 5 cgi_* tables below currently grant nothing at all to authenticated
-- (only cgi_reports does, pre-existing, out of scope here) -- without this,
-- the read-only policies in section 9 would never even be reached.
grant select on public.cgi_leads to authenticated;
grant select on public.cgi_assessments to authenticated;
grant select on public.cgi_answers to authenticated;
grant select on public.cgi_attribution to authenticated;
grant select on public.cgi_funnel_events to authenticated;

-- ============================================================================
-- 9. RLS policies
-- ============================================================================

alter table public.crm_people enable row level security;
alter table public.crm_people_links enable row level security;
alter table public.crm_opportunities enable row level security;

create policy crm_people_all on public.crm_people
  for all
  using (public.is_crm_admin())
  with check (public.is_crm_admin());

create policy crm_people_links_select on public.crm_people_links
  for select using (public.is_crm_admin());
create policy crm_people_links_insert on public.crm_people_links
  for insert with check (public.is_crm_admin());
create policy crm_people_links_delete on public.crm_people_links
  for delete using (public.is_crm_admin());
-- No update policy: a link is created or deleted, never edited in place.

create policy crm_opportunities_all on public.crm_opportunities
  for all
  using (public.is_crm_admin())
  with check (public.is_crm_admin());

-- Read-only admin access to the CGI tables. Writes to these stay exclusive
-- to the CGI backend's service-role key -- no write policy is added here.
create policy cgi_leads_select_admin on public.cgi_leads
  for select using (public.is_crm_admin());
create policy cgi_assessments_select_admin on public.cgi_assessments
  for select using (public.is_crm_admin());
create policy cgi_answers_select_admin on public.cgi_answers
  for select using (public.is_crm_admin());
create policy cgi_attribution_select_admin on public.cgi_attribution
  for select using (public.is_crm_admin());
create policy cgi_reports_select_admin on public.cgi_reports
  for select using (public.is_crm_admin());
create policy cgi_funnel_events_select_admin on public.cgi_funnel_events
  for select using (public.is_crm_admin());
