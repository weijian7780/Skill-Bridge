-- Trusted role store for SkillBridge.
--
-- Why this exists: the app must NOT decide "student vs employer" from
-- auth.user_metadata, because a signed-in user can edit their own
-- user_metadata (PUT /auth/v1/user) and silently promote themselves to
-- "employer". This table is the single source of truth for role. It is
-- written once, by a database trigger, when the account is created, and
-- Row Level Security gives clients read-only access — they can never change
-- their own role. The server reads role from here using the service-role key.

create table if not exists public.user_roles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  role text not null default 'student' check (role in ('student', 'employer')),
  created_at timestamptz not null default now()
);

alter table public.user_roles enable row level security;

-- Clients may READ their own role. There is intentionally NO insert/update/
-- delete policy: with RLS enabled, that means clients cannot modify this table
-- at all. Only the trigger below (security definer) and the service-role key
-- bypass RLS.
drop policy if exists "users can read own role" on public.user_roles;

create policy "users can read own role"
  on public.user_roles
  for select
  using (auth.uid() = user_id);

-- Assign the role exactly once, at signup, from the metadata supplied during
-- registration. Anything other than an explicit 'employer' choice becomes the
-- least-privilege 'student'. Because this only runs on INSERT into auth.users,
-- later edits to user_metadata can never change a user's role.
create or replace function public.assign_user_role()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.user_roles (user_id, role)
  values (
    new.id,
    case
      when new.raw_user_meta_data ->> 'role' = 'employer' then 'employer'
      else 'student'
    end
  )
  on conflict (user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
after insert on auth.users
for each row
execute function public.assign_user_role();

-- Backfill: lock in a role for accounts that already exist. Existing employer
-- accounts keep their role; everyone else defaults to 'student'.
insert into public.user_roles (user_id, role)
select
  id,
  case
    when raw_user_meta_data ->> 'role' = 'employer' then 'employer'
    else 'student'
  end
from auth.users
on conflict (user_id) do nothing;
