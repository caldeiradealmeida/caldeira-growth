-- Rollback de 20260825120000_cgi_consent_and_report_access.sql
--
-- Deliberadamente NAO derruba as quatro colunas de cgi_leads. Derrubar coluna
-- apaga consentimento e revogacao -- exatamente o dado que a migration existe
-- para proteger -- e um rollback que perde consentimento e pior que o problema
-- que ele resolve. As colunas sao aditivas e nulaveis: com o codigo revertido,
-- elas ficam simplesmente sem uso, sem custo e sem risco.
--
-- O que este script desfaz e a SUPERFICIE: a view e as duas funcoes. Isso
-- devolve o banco ao comportamento anterior sem destruir nada.
--
-- Depois de rodar isto, o Pipe volta a nao encontrar crm_report_access_v e a
-- leitura fail-soft assume -- que e exatamente o estado de Production hoje, ja
-- validado em Preview.

begin;

drop view if exists public.crm_report_access_v;

drop function if exists public.cgi_marketing_optin(text, text);
drop function if exists public.cgi_marketing_optout(text);

-- Indices e CHECK sao aditivos e inofensivos; ficam. Se algum dia for mesmo
-- necessario remove-los (nao e), as linhas abaixo fazem isso sem tocar em dado:
--
--   drop index if exists public.cgi_leads_contact_token_hash_uidx;
--   drop index if exists public.cgi_leads_marketing_optin_idx;
--   alter table public.cgi_leads drop constraint if exists cgi_leads_consent_source_chk;

commit;
