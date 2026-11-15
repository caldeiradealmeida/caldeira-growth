-- Contact submissions remain separate from CGI assessments. Never expose PII publicly.
create table public.contact_submissions (
 id uuid primary key default gen_random_uuid(),
 request_id uuid not null unique,
 created_at timestamptz not null default now(),
 nome text not null, email text not null, empresa text not null default '',
 cargo text not null default '', tema text not null, mensagem text not null,
 source_url text not null default '',
 status text not null default 'novo' check (status in ('novo','em_atendimento','proposta','convertido','encerrado')),
 classification text not null default 'valido' check (classification in ('valido','suspeito','spam')),
 notes text not null default ''
);
create index contact_submissions_email on public.contact_submissions(email);
create table public.contact_rate_limits (
 key text primary key, window_start timestamptz not null, hits integer not null
);
create table public.contact_deliveries (
 id uuid primary key default gen_random_uuid(),
 lead_id uuid not null references public.contact_submissions(id),
 destination text not null check (destination in ('email','sheet','chief_of_staff')),
 status text not null default 'pending' check (status in ('pending','processing','sent')),
 attempts integer not null default 0, available_at timestamptz not null default now(),
 sent_at timestamptz, last_error text,
 unique(lead_id,destination)
);
create index contact_deliveries_pending on public.contact_deliveries(available_at) where status <> 'sent';
alter table public.contact_submissions enable row level security;
alter table public.contact_rate_limits enable row level security;
alter table public.contact_deliveries enable row level security;
revoke all on public.contact_submissions, public.contact_rate_limits, public.contact_deliveries from anon, authenticated;
grant all on public.contact_submissions, public.contact_rate_limits, public.contact_deliveries to service_role;

create function public.submit_contact(p_request_id uuid, p_payload jsonb, p_ip_hash text, p_email_hash text)
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare existing_id uuid; new_id uuid; bucket text; count_hits integer;
begin
 -- Serializes repeated requests with the same idempotency key.
 perform pg_advisory_xact_lock(hashtextextended(p_request_id::text, 0));
 select id into existing_id from contact_submissions where request_id = p_request_id;
 if existing_id is not null then return jsonb_build_object('id',existing_id); end if;
 foreach bucket in array array['ip:' || p_ip_hash, 'email:' || p_email_hash] loop
  insert into contact_rate_limits as limits(key,window_start,hits) values(bucket, now(), 1)
  on conflict(key) do update set
   hits = case when limits.window_start < now() - interval '15 minutes' then 1 else limits.hits + 1 end,
   window_start = case when limits.window_start < now() - interval '15 minutes' then now() else limits.window_start end
  returning hits into count_hits;
  if count_hits > (case when bucket like 'ip:%' then 5 else 3 end) then
   return jsonb_build_object('error','rate_limited');
  end if;
 end loop;
 insert into contact_submissions(request_id,nome,email,empresa,cargo,tema,mensagem,source_url)
 values(p_request_id,p_payload->>'nome',p_payload->>'email',coalesce(p_payload->>'empresa',''),coalesce(p_payload->>'cargo',''),p_payload->>'tema',p_payload->>'mensagem',coalesce(p_payload->>'source_url','')) returning id into new_id;
 insert into contact_deliveries(lead_id,destination) values(new_id,'email'),(new_id,'sheet'),(new_id,'chief_of_staff');
 delete from contact_rate_limits where window_start < now() - interval '1 day';
 return jsonb_build_object('id',new_id);
end $$;

create function public.claim_contact_deliveries(p_lead_id uuid default null)
returns setof public.contact_deliveries language sql security definer set search_path = public, pg_temp as $$
 update contact_deliveries set status='processing', attempts=attempts+1, available_at=now()+interval '10 minutes'
 where id in (
  select id from contact_deliveries where status <> 'sent' and available_at <= now()
  and (p_lead_id is null or lead_id=p_lead_id)
  order by available_at limit 30 for update skip locked
 ) returning *;
$$;
revoke all on function public.submit_contact(uuid,jsonb,text,text) from public,anon,authenticated;
revoke all on function public.claim_contact_deliveries(uuid) from public,anon,authenticated;
grant execute on function public.submit_contact(uuid,jsonb,text,text) to service_role;
grant execute on function public.claim_contact_deliveries(uuid) to service_role;
