-- Adds 'enviar_proposta' ("Enviar proposta") to the commercial status
-- vocabulary, between reuniao_agendada and proposta_enviada.
--
-- Additive only: the new set is a strict superset of the previous one, so no
-- existing row is read, rewritten or invalidated. Verified before and after by
-- comparing row counts, per-status counts and an md5 checksum over
-- (lead_id, status, updated_at) -- all identical.
--
-- No automation consumes this status yet. The abandonment commercial guard is
-- binary ("is it novo or not"), so the new value blocks automation by simply
-- not being 'novo' -- no rule change required.
--
-- Reverse: restore the previous CHECK without 'enviar_proposta' (only safe
-- while no row uses the new value).

alter table public.crm_opportunities
  drop constraint crm_opportunities_status_check;

alter table public.crm_opportunities
  add constraint crm_opportunities_status_check
  check (status = any (array[
    'novo'::text,
    'revisado'::text,
    'contato_pendente'::text,
    'contato_realizado'::text,
    'reuniao_agendada'::text,
    'enviar_proposta'::text,
    'proposta_enviada'::text,
    'convertido'::text,
    'sem_interesse'::text,
    'descartado'::text
  ]));
