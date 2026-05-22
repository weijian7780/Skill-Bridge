create table if not exists public.job_search_cache (
  cache_key text primary key,
  provider text not null default 'auto',
  role text not null,
  location text not null,
  payload jsonb not null,
  expires_at timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists job_search_cache_expires_at_idx
  on public.job_search_cache (expires_at);

alter table public.job_search_cache enable row level security;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_job_search_cache_updated_at on public.job_search_cache;

create trigger set_job_search_cache_updated_at
before update on public.job_search_cache
for each row
execute function public.set_updated_at();
