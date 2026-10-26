
-- Plans and limits live in the database so you can adjust them from the Admin page.
-- Run once in the SQL Editor.

create table if not exists public.plans (
  name text primary key,
  sort integer not null default 0,
  price_cents integer not null default 0,
  images_per_month integer not null default 0,
  models3d_per_month integer not null default 0,
  description text not null default '',
  active boolean not null default true
);

alter table public.plans enable row level security;

-- Anyone may read plans (the Pricing page needs them). Only the server writes.
drop policy if exists "plans readable" on public.plans;
create policy "plans readable" on public.plans for select using (true);

-- PLACEHOLDER numbers: edit them in Admin -> Plans once you know your costs.
insert into public.plans (name, sort, price_cents, images_per_month, models3d_per_month, description) values
  ('Free',          0,     0,    0,  0, 'Browse the gallery and see what Eidolon can do.'),
  ('Apprentice',    1,  1900,  200,  5, 'For independent artists getting started.'),
  ('Archetype Pro', 2,  4900,  600, 10, 'For working character artists and worldbuilders.'),
  ('Studio Guild',  3, 12900, 2000, 30, 'For studios and heavy users.')
on conflict (name) do nothing;

-- Earlier test accounts used the plan name 'Pro'.
update public.profiles set plan = 'Archetype Pro' where plan = 'Pro';
