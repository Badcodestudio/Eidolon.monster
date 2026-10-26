-- Eidolon: accounts, limits and generation log.
-- Run once in Supabase: SQL Editor -> New query -> paste -> Run.

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  plan text not null default 'Free',
  strikes numeric not null default 0,
  locked boolean not null default false,
  lock_reason text,
  created_at timestamptz not null default now()
);

create table if not exists public.generations (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  kind text not null default 'image',
  prompt text,
  result_url text,
  blocked boolean not null default false,
  block_reason text,
  ip text,
  created_at timestamptz not null default now()
);

create index if not exists generations_user_time on public.generations (user_id, created_at desc);

-- Row Level Security: users can only read their own rows.
-- Only the server (service role, inside Edge Functions) can write.
alter table public.profiles enable row level security;
alter table public.generations enable row level security;

drop policy if exists "read own profile" on public.profiles;
create policy "read own profile" on public.profiles
  for select using (auth.uid() = id);

drop policy if exists "read own generations" on public.generations;
create policy "read own generations" on public.generations
  for select using (auth.uid() = user_id);

-- Create a profile automatically for every new sign-up.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id) values (new.id) on conflict do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
