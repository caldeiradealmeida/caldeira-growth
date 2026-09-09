-- Classificação canônica de qualidade do lead.
--
-- POR QUE EM cgi_leads, E NÃO EM crm_opportunities
--
-- Já existe uma flag de exclusão, crm_opportunities.is_test_excluded, lida em
-- buildOpportunities.ts. Ela não resolve o problema por duas razões que se
-- somam: nada no produto a escreve (nenhum endpoint, nenhum formulário), e ela
-- mora numa tabela que nasce tarde -- crm_opportunities só é criada quando um
-- admin edita o card pela primeira vez. Os cinco registros que motivaram esta
-- migration (um troll e quatro testes) não têm linha em crm_opportunities, e
-- portanto hoje não há como escondê-los nem manualmente.
--
-- A classificação precisa morar onde a pessoa entra no sistema.
--
-- COEXISTÊNCIA COM is_test_excluded
--
-- is_test_excluded NÃO é migrada nem removida nesta rodada, de propósito. As
-- duas passam a coexistir e o Pipe respeita ambas: uma linha some se
-- is_test_excluded for true OU se classification não for 'legitimate'. Zero
-- linhas estão marcadas hoje, então na prática a flag antiga não esconde nada.
-- A remoção dela é uma decisão separada, para depois de a classificação estar
-- em uso.
--
-- DEFAULT
--
-- 'legitimate' preserva exatamente o comportamento atual: toda linha existente
-- passa a carregar o valor que a mantém visível e elegível. Nenhum lead
-- desaparece, nenhuma automação muda de comportamento por causa desta
-- migration sozinha.

alter table public.cgi_leads
  add column if not exists classification text not null default 'legitimate';

alter table public.cgi_leads add column if not exists classified_at timestamptz;
alter table public.cgi_leads add column if not exists classified_by text;
alter table public.cgi_leads add column if not exists classification_note text;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'cgi_leads_classification_chk'
  ) then
    alter table public.cgi_leads
      add constraint cgi_leads_classification_chk
      check (classification in ('legitimate', 'test', 'spam', 'invalid'));
  end if;
end
$$;

-- Índice parcial: a varredura que interessa é sempre "quem NÃO é legítimo",
-- que é a minoria. Um índice cheio sobre uma coluna com 99% do mesmo valor não
-- seria usado.
create index if not exists cgi_leads_classification_idx
  on public.cgi_leads (classification)
  where classification <> 'legitimate';

comment on column public.cgi_leads.classification is
  'legitimate | test | spam | invalid. Exclui do Pipe operacional e das automações quando <> legitimate. Nunca apaga.';
comment on column public.cgi_leads.classified_at is
  'Quando alguém classificou. Nulo para as linhas que nunca foram tocadas -- não é data histórica inventada.';
comment on column public.cgi_leads.classified_by is
  'E-mail do admin que classificou, preenchido pelo servidor a partir do JWT. Nunca vem do cliente.';

-- ESCRITA: RPC, não GRANT de UPDATE.
--
-- authenticated tem hoje apenas SELECT em cgi_leads, e é assim que deve
-- continuar. Dar UPDATE, mesmo por coluna, abriria a tabela inteira ao browser
-- do CRM. A RPC é SECURITY DEFINER, checa is_crm_admin() por dentro e -- o
-- ponto que mais importa -- preenche classified_by com auth.email() no
-- servidor. O cliente não consegue forjar quem classificou.
create or replace function public.cgi_classify_lead(
  p_lead_id uuid,
  p_classification text,
  p_note text default null
)
returns void
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_email text;
begin
  if not public.is_crm_admin() then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  if p_classification not in ('legitimate', 'test', 'spam', 'invalid') then
    raise exception 'invalid_classification' using errcode = '22023';
  end if;

  v_email := nullif(auth.email(), '');

  update public.cgi_leads
     set classification = p_classification,
         classified_at = now(),
         classified_by = v_email,
         classification_note = nullif(btrim(coalesce(p_note, '')), '')
   where id = p_lead_id;
end;
$$;

revoke all on function public.cgi_classify_lead(uuid, text, text) from public;
grant execute on function public.cgi_classify_lead(uuid, text, text) to authenticated;
