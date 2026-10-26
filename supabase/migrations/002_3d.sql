-- Eidolon: 3D generation support.
-- Run once in Supabase: SQL Editor -> New query -> paste -> Run.

alter table public.profiles add column if not exists bonus_3d integer not null default 0;

alter table public.generations add column if not exists task_id text;
alter table public.generations add column if not exists status text not null default 'done';
alter table public.generations add column if not exists used_bonus boolean not null default false;

create index if not exists generations_task on public.generations (task_id);

-- To give someone a plan or extra 3D models later (run in the SQL Editor):
--   update public.profiles set plan = 'Pro' where id = (select id from auth.users where email = 'person@example.com');
--   update public.profiles set bonus_3d = bonus_3d + 5 where id = (select id from auth.users where email = 'person@example.com');
