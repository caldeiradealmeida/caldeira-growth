-- CGI Nurture V1 -- consentimento auditavel, revogacao, e leitura minima de
-- abertura de relatorio.
--
-- Tudo aqui e ADITIVO. Nenhuma coluna existente muda de tipo, nenhuma linha
-- existente e reclassificada, e consent_marketing continua sendo a mesma
-- coluna booleana que o formulario inicial ja escreve. O que esta migration
-- acrescenta e a PROVENIENCIA (quando, por qual superficie) e a REVOGACAO --
-- sem as quais nenhum envio de nurturing pode existir.
--
-- Deliberadamente NAO cria tabela de historico de consentimento. O historico
-- que importa juridicamente ja existe: cgi_communications.consent_marketing_snapshot
-- congela o estado do consentimento em cada mensagem enviada. Uma tabela de
-- eventos separada seria uma terceira fonte de verdade sobre o mesmo fato.

begin;

-- ---------------------------------------------------------------------------
-- 1. Proveniencia e revogacao do consentimento de marketing
-- ---------------------------------------------------------------------------

alter table public.cgi_leads
  add column if not exists consent_marketing_source text,
  add column if not exists consent_marketing_at timestamptz,
  add column if not exists unsubscribed_at timestamptz,
  -- Token opaco por lead. So o SHA-256 e persistido, como em cgi_report_access.
  -- Serve aos DOIS links de contato (opt-in por email e descadastro), porque
  -- sao a mesma capacidade: "esta pessoa, provada por posse do link".
  add column if not exists contact_token_hash text;

comment on column public.cgi_leads.consent_marketing_source is
  'Onde o opt-in foi dado: cgi_initial_form | cgi_report | report_email. Nulo para consentimentos anteriores a esta migration -- ausencia de origem NAO deve ser lida como ausencia de consentimento.';
comment on column public.cgi_leads.unsubscribed_at is
  'Revogacao explicita. Suprime nurturing imediatamente. NAO suprime transacional.';

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'cgi_leads_consent_source_chk') then
    alter table public.cgi_leads
      add constraint cgi_leads_consent_source_chk
      check (consent_marketing_source is null or consent_marketing_source in
        ('cgi_initial_form', 'cgi_report', 'report_email'));
  end if;
end $$;

create unique index if not exists cgi_leads_contact_token_hash_uidx
  on public.cgi_leads (contact_token_hash)
  where contact_token_hash is not null;

-- Fila de nurturing: quem tem opt-in vivo e nao revogou.
create index if not exists cgi_leads_marketing_optin_idx
  on public.cgi_leads (consent_marketing)
  where consent_marketing is true and unsubscribed_at is null;

-- ---------------------------------------------------------------------------
-- 2. Abertura de relatorio -- superficie minima para o CRM
-- ---------------------------------------------------------------------------
--
-- cgi_report_access guarda token_hash. O browser do CRM nao tem, e nao deve
-- ter, SELECT nessa tabela: foi exatamente isso que derrubou o Pipe em
-- producao (42501, sem GRANT para authenticated). A resposta certa nao e
-- alargar o GRANT -- e expor as duas colunas que a fila comercial precisa.
--
-- A view roda com o privilegio do dono (security_invoker desligado, que e o
-- padrao), entao contorna a RLS da tabela base. O portao e o WHERE abaixo:
-- is_crm_admin() ja e SECURITY DEFINER lendo auth.email() do JWT de quem
-- chama, e e o mesmo mecanismo que protege cgi_communications e cgi_reports.
-- token_hash, expires_at e revoked_at nunca saem do banco.

create or replace view public.crm_report_access_v as
select ra.public_assessment_id,
       ra.last_accessed_at
from public.cgi_report_access ra
where public.is_crm_admin();

comment on view public.crm_report_access_v is
  'Somente public_assessment_id e last_accessed_at. token_hash jamais exposto. Portao: is_crm_admin().';

revoke all on public.crm_report_access_v from anon, authenticated;
grant select on public.crm_report_access_v to authenticated;

-- ---------------------------------------------------------------------------
-- 3. Opt-in e opt-out por posse de link
-- ---------------------------------------------------------------------------
--
-- Ambas as funcoes:
--   * aceitam o token em texto claro e comparam pelo hash;
--   * devolvem SEMPRE o mesmo resultado, valido ou nao -- nada sobre a
--     existencia do lead, o email, ou o estado anterior e observavel;
--   * sao idempotentes: chamar de novo nao e erro e nao reescreve a data
--     original;
--   * nunca tocam consent_privacy nem qualquer dado transacional.

create or replace function public.cgi_marketing_optin(p_token text, p_source text)
returns void
language plpgsql
security definer
set search_path to 'public', 'extensions'
as $fn$
declare v_hash text;
begin
  if p_token is null or length(p_token) < 16 then return; end if;
  if p_source is not distinct from null or p_source not in ('cgi_report', 'report_email') then
    return;
  end if;
  v_hash := encode(extensions.digest(p_token, 'sha256'), 'hex');

  update public.cgi_leads
     set consent_marketing = true,
         -- Uma reentrada de opt-in tambem revoga o opt-out anterior: a pessoa
         -- acabou de pedir explicitamente para voltar a receber.
         unsubscribed_at = null,
         consent_marketing_source = coalesce(consent_marketing_source, p_source),
         consent_marketing_at = coalesce(consent_marketing_at, now()),
         updated_at = now()
   where contact_token_hash = v_hash;
end;
$fn$;

create or replace function public.cgi_marketing_optout(p_token text)
returns void
language plpgsql
security definer
set search_path to 'public', 'extensions'
as $fn$
declare v_hash text;
begin
  if p_token is null or length(p_token) < 16 then return; end if;
  v_hash := encode(extensions.digest(p_token, 'sha256'), 'hex');

  update public.cgi_leads
     set consent_marketing = false,
         -- coalesce preserva a PRIMEIRA revogacao. Clicar de novo nao e erro
         -- e nao reescreve a data.
         unsubscribed_at = coalesce(unsubscribed_at, now()),
         updated_at = now()
   where contact_token_hash = v_hash;
end;
$fn$;

revoke all on function public.cgi_marketing_optin(text, text) from public;
revoke all on function public.cgi_marketing_optout(text) from public;
-- Descadastro nao pode exigir login. Opt-in por email idem. O portao e a
-- posse do token, nao a sessao.
grant execute on function public.cgi_marketing_optin(text, text) to anon, authenticated;
grant execute on function public.cgi_marketing_optout(text) to anon, authenticated;

commit;
