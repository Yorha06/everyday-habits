create sequence if not exists public.participant_code_seq start with 1;

create table if not exists public.submissions (
  id uuid primary key default gen_random_uuid(),
  participant_code text not null unique,
  participant_name text not null check (char_length(participant_name) between 1 and 20),
  total_score numeric(6,2) not null check (total_score between 0 and 100),
  submission_token uuid not null unique,
  request_hash text not null check (request_hash ~ '^[0-9a-f]{64}$'),
  submitted_at timestamptz not null default now()
);

create index if not exists submissions_submitted_at_idx on public.submissions (submitted_at desc);
create index if not exists submissions_participant_name_idx on public.submissions using btree (participant_name);

create table if not exists public.session_results (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid not null references public.submissions(id) on delete cascade,
  session_key text not null check (session_key in ('practice','assessment')),
  session_number integer not null check (session_number in (1,2)),
  total_score numeric(6,2) not null check (total_score between 0 and 100),
  level_scores jsonb not null default '{}'::jsonb,
  answer_details jsonb not null default '[]'::jsonb,
  unique (submission_id, session_key),
  check (jsonb_typeof(level_scores)='object'),
  check (jsonb_typeof(answer_details)='array')
);

create index if not exists session_results_submission_id_idx on public.session_results (submission_id);

alter table public.submissions enable row level security;
alter table public.session_results enable row level security;
revoke all on table public.submissions,public.session_results from anon,authenticated;
grant select on table public.submissions,public.session_results to authenticated;
grant delete on table public.submissions to authenticated;

create or replace function public.is_submission_admin()
returns boolean
language sql
stable
set search_path = pg_catalog, public, auth
as $$
  select coalesce(auth.jwt()->'app_metadata'->>'role'='admin',false);
$$;

grant execute on function public.is_submission_admin() to authenticated;
drop policy if exists "Admins can read submissions" on public.submissions;
create policy "Admins can read submissions" on public.submissions
for select to authenticated using (public.is_submission_admin());
drop policy if exists "Admins can delete submissions" on public.submissions;
create policy "Admins can delete submissions" on public.submissions
for delete to authenticated using (public.is_submission_admin());
drop policy if exists "Admins can read session results" on public.session_results;
create policy "Admins can read session results" on public.session_results
for select to authenticated using (
  public.is_submission_admin()
  and exists (
    select 1 from public.submissions s
    where s.id=session_results.submission_id
  )
);

create or replace function public.submit_submission(
  p_submission_token uuid,
  p_request_hash text,
  p_participant_name text,
  p_total_score numeric,
  p_sessions jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_submission public.submissions%rowtype;
  v_session jsonb;
  v_session_key text;
  v_session_number integer;
  v_code bigint;
begin
  if p_submission_token is null
    or p_request_hash is null
    or p_request_hash !~ '^[0-9a-f]{64}$'
    or p_participant_name is null
    or char_length(p_participant_name) not between 1 and 20
    or p_total_score is null
    or p_total_score not between 0 and 100
    or p_sessions is null then
    raise exception 'invalid submission';
  end if;
  if jsonb_typeof(p_sessions) <> 'array' or jsonb_array_length(p_sessions) <> 2 then
    raise exception 'invalid submission';
  end if;

  if exists (
    select 1 from jsonb_array_elements(p_sessions) item
    where item->>'session_key' not in ('practice','assessment')
       or item->>'session_number' not in ('1','2')
       or coalesce((item->>'total_score')::numeric,-1) not between 0 and 100
       or jsonb_typeof(item->'level_scores') <> 'object'
       or jsonb_typeof(item->'answer_details') <> 'array'
  ) or (
    select count(distinct item->>'session_key') from jsonb_array_elements(p_sessions) item
  ) <> 2 then
    raise exception 'invalid session results';
  end if;

  v_code:=nextval('public.participant_code_seq');
  insert into public.submissions (
    participant_code,participant_name,total_score,submission_token,request_hash
  ) values (
    'EH-' || lpad(v_code::text,greatest(4,char_length(v_code::text)),'0'),
    btrim(p_participant_name),p_total_score,p_submission_token,p_request_hash
  ) on conflict (submission_token) do nothing
  returning * into v_submission;

  if not found then
    select * into v_submission from public.submissions where submission_token=p_submission_token;
    if v_submission.request_hash<>p_request_hash then
      raise exception 'submission token reused with a different payload';
    end if;
    return jsonb_build_object(
      'id',v_submission.id,
      'participant_code',v_submission.participant_code,
      'total_score',v_submission.total_score,
      'submitted_at',v_submission.submitted_at
    );
  end if;

  for v_session in select value from jsonb_array_elements(p_sessions)
  loop
    v_session_key:=v_session->>'session_key';
    v_session_number:=(v_session->>'session_number')::integer;
    if (v_session_key='practice' and v_session_number<>1)
      or (v_session_key='assessment' and v_session_number<>2) then
      raise exception 'invalid session identity';
    end if;
    insert into public.session_results (
      submission_id,session_key,session_number,total_score,level_scores,answer_details
    ) values (
      v_submission.id,
      v_session_key,
      v_session_number,
      (v_session->>'total_score')::numeric,
      v_session->'level_scores',
      v_session->'answer_details'
    );
  end loop;

  return jsonb_build_object(
    'id',v_submission.id,
    'participant_code',v_submission.participant_code,
    'total_score',v_submission.total_score,
    'submitted_at',v_submission.submitted_at
  );
end;
$$;

revoke all on function public.submit_submission(uuid,text,text,numeric,jsonb) from public,anon,authenticated;
grant execute on function public.submit_submission(uuid,text,text,numeric,jsonb) to service_role;
