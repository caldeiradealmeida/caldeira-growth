-- Communication Engine -- Fase 1 (estrutural).
--
-- Cria UMA tabela nova: public.cgi_communications, o livro-razao de tudo que o
-- CGI ja comunicou (e, no futuro, do que ainda vai comunicar). Nada aqui altera
-- tabela, coluna, constraint, indice, policy ou grant existente.
--
-- CONTRATO DE CONVIVENCIA COM O QUE JA ESTA EM PRODUCAO
-- -----------------------------------------------------
-- cgi_assessments.report_email_sent_at e cgi_assessments.abandonment_email_sent_at
-- CONTINUAM sendo a fonte operacional primaria de idempotencia dos dois e-mails
-- automaticos. Esta tabela e ADITIVA: registra o que aconteceu, nao decide se
-- pode acontecer. Enquanto durar a migracao:
--   * o executor de envio le e escreve os marcadores exatamente como hoje;
--   * a linha em cgi_communications e gravada DEPOIS, em best-effort;
--   * uma falha ao gravar aqui NUNCA pode impedir/desfazer um e-mail
--     transacional ja validamente enviado -- ela vira log/telemetria.
-- A inversao (esta tabela virar a fonte primaria) e assunto de uma fase futura,
-- e so depois de os dois registros conviverem e baterem por tempo suficiente.
--
-- PII: nao guardamos o e-mail em claro. cgi_leads ja e a fonte de verdade do
-- destinatario; aqui fica so a forma mascarada (l***@dominio.com), suficiente
-- para auditar "para quem foi" sem duplicar dado pessoal em mais uma tabela.

-- ============================================================================
-- 1. Tabela
-- ============================================================================

create table if not exists public.cgi_communications (
  id uuid primary key default gen_random_uuid(),

  -- Vinculos. Ambos opcionais e ON DELETE SET NULL: o historico de uma
  -- comunicacao sobrevive ao apagamento do lead/assessment (LGPD: o conteudo
  -- identificavel esta no lead, nao aqui).
  lead_id uuid null references public.cgi_leads (id) on delete set null,
  assessment_id uuid null references public.cgi_assessments (id) on delete set null,
  -- Guardado tambem em texto porque e o identificador que todos os executores
  -- e endpoints manipulam, e porque ele permanece legivel se a FK virar null.
  public_assessment_id text null,

  -- O QUE foi comunicado.
  communication_type text not null,
  -- Classe congelada no momento do registro (nao derivada em leitura): se o
  -- mapa type->class mudar depois, o historico continua contando a verdade do
  -- dia em que a mensagem saiu.
  communication_class text not null,
  channel text not null default 'email',

  -- EM QUE ESTADO. Ver secao 4 (guarda de monotonicidade).
  status text not null,

  -- Idempotencia. Chave explicita, calculada pelo dominio (api/_cgi-communications.ts)
  -- e unica no banco -- e o banco, nao a aplicacao, que impede a duplicata em
  -- corrida entre cron, retry e backfill.
  dedupe_key text not null,

  scheduled_at timestamptz null,
  sent_at timestamptz null,
  failed_at timestamptz null,
  cancelled_at timestamptz null,

  recipient_masked text null,
  subject text null,

  provider text null,
  -- Reservado: o relay atual (Apps Script + MailApp) nao devolve id de
  -- mensagem. Fica nulo ate existir um provider que devolva.
  provider_message_id text null,

  error_code text null,
  error_message text null,

  -- Por que foi cancelada/suprimida, e quem causou o registro
  -- ('system:cron', 'system:completion', 'human:<email>').
  reason text null,
  actor text null,

  -- Foto do consentimento de marketing no instante do registro. Transacional
  -- nao consulta este campo (regra atual, preservada); nurturing futuro exige
  -- true e fica auditavel aqui.
  consent_marketing_snapshot boolean null,

  metadata jsonb not null default '{}'::jsonb,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint cgi_communications_dedupe_key_uk unique (dedupe_key),

  constraint cgi_communications_type_chk check (communication_type = any (array[
    'report_delivery',
    'report_followup_d2',
    'report_followup_d5',
    'abandon_lead_d1',
    'abandon_progress_d1',
    'insight_d2',
    'howto_d7',
    'strategic_d21',
    'checkin_d45',
    'revisit_d90',
    'commercial_followup',
    'manual_email'
  ])),

  constraint cgi_communications_class_chk check (communication_class = any (array[
    'transactional',
    'nurturing',
    'commercial'
  ])),

  constraint cgi_communications_channel_chk check (channel = any (array[
    'email',
    'whatsapp',
    'manual'
  ])),

  constraint cgi_communications_status_chk check (status = any (array[
    'scheduled',
    'sending',
    'sent',
    'failed',
    'cancelled',
    'suppressed'
  ])),

  -- Coerencia minima entre estado e carimbo. Deliberadamente so numa direcao:
  -- uma linha que falhou, foi retentada e enviou mantem failed_at preenchido.
  constraint cgi_communications_sent_at_chk check (status <> 'sent' or sent_at is not null),
  constraint cgi_communications_failed_at_chk check (status <> 'failed' or failed_at is not null),
  constraint cgi_communications_cancelled_at_chk check (status <> 'cancelled' or cancelled_at is not null),
  constraint cgi_communications_scheduled_at_chk check (status <> 'scheduled' or scheduled_at is not null)
);

-- ============================================================================
-- 2. Indices
-- ============================================================================

-- Historico por lead/assessment: o que a coluna "Mensagens" do Pipe vai ler.
create index if not exists idx_cgi_communications_lead
  on public.cgi_communications (lead_id, created_at desc);

create index if not exists idx_cgi_communications_assessment
  on public.cgi_communications (assessment_id, created_at desc);

create index if not exists idx_cgi_communications_public_assessment
  on public.cgi_communications (public_assessment_id);

-- "Proxima comunicacao": parcial, so o que ainda esta agendado.
create index if not exists idx_cgi_communications_due
  on public.cgi_communications (scheduled_at)
  where status = 'scheduled';

-- Metrica por tipo ("quantos abandon_lead_d1 sairam esta semana").
create index if not exists idx_cgi_communications_type_sent
  on public.cgi_communications (communication_type, sent_at desc);

-- ============================================================================
-- 3. RLS + grants -- mesmo padrao das tabelas cgi_* existentes: o CRM le pelo
--    anon key autenticado sob is_crm_admin(); a escrita acontece unicamente
--    pelo service role em api/ (que ignora RLS), portanto nenhuma policy de
--    insert/update/delete e criada aqui.
-- ============================================================================

alter table public.cgi_communications enable row level security;

revoke all on public.cgi_communications from anon, authenticated;
grant select on public.cgi_communications to authenticated;

-- drop antes de criar: torna a migration re-executavel sem erro. Os dois
-- objetos abaixo pertencem exclusivamente a tabela criada acima, entao o drop
-- nunca alcanca nada pre-existente.
drop policy if exists cgi_communications_select_admin on public.cgi_communications;
create policy cgi_communications_select_admin on public.cgi_communications
  for select using (public.is_crm_admin());

-- ============================================================================
-- 4. Triggers (apenas nesta tabela nova)
-- ============================================================================

-- Reusa a funcao ja existente no schema.
drop trigger if exists trg_cgi_communications_updated_at on public.cgi_communications;
create trigger trg_cgi_communications_updated_at
  before update on public.cgi_communications
  for each row execute function public.cgi_set_updated_at();

-- Monotonicidade: uma comunicacao nunca regride. 'sent', 'cancelled' e
-- 'suppressed' sao terminais; 'failed' e o unico estado nao-terminal apos uma
-- tentativa, porque retry e legitimo. Implementado no banco, e nao so no
-- dominio, para que nenhum caminho futuro (script, backfill, endpoint novo)
-- consiga escrever uma regressao por engano.
create or replace function public.cgi_communications_guard_status()
returns trigger
language plpgsql
as $fn$
declare
  allowed text[];
begin
  if new.status = old.status then
    return new;
  end if;

  allowed := case old.status
    when 'scheduled' then array['sending','sent','failed','cancelled','suppressed']
    when 'sending'   then array['sent','failed','cancelled']
    when 'failed'    then array['sending','sent','cancelled']
    when 'sent'      then array[]::text[]
    when 'cancelled' then array[]::text[]
    when 'suppressed' then array[]::text[]
    else array[]::text[]
  end;

  if not (new.status = any (allowed)) then
    raise exception
      'cgi_communications: transicao de status invalida % -> % (id %)',
      old.status, new.status, old.id
      using errcode = 'check_violation';
  end if;

  return new;
end;
$fn$;

drop trigger if exists trg_cgi_communications_guard_status on public.cgi_communications;
create trigger trg_cgi_communications_guard_status
  before update of status on public.cgi_communications
  for each row execute function public.cgi_communications_guard_status();

-- ============================================================================
-- 5. ROLLBACK (documentado, nao executado)
-- ============================================================================
-- drop trigger if exists trg_cgi_communications_guard_status on public.cgi_communications;
-- drop trigger if exists trg_cgi_communications_updated_at on public.cgi_communications;
-- drop function if exists public.cgi_communications_guard_status();
-- drop table if exists public.cgi_communications;
--
-- Nenhum objeto pre-existente e tocado por esta migration, entao o rollback e
-- exatamente o inverso dela e nao deixa residuo.
