-- Eidolon: quality tiers, permanent storage, terms acceptance.
-- Safe to run more than once. Run in Supabase: SQL Editor -> New query -> paste -> Run.

-- 1. Plans: a separate monthly allowance for High-quality images.
--    images_per_month = Standard images, images_high_per_month = High-quality images,
--    models3d_per_month = 3D "credits" (a Standard model uses 1, a High-detail model uses 2).
alter table public.plans add column if not exists images_high_per_month integer not null default 0;

-- Starting numbers (only replaces the old placeholder values, never numbers you changed in Admin).
update public.plans set images_per_month = 150, images_high_per_month = 0,   models3d_per_month = 5  where name = 'Apprentice'    and images_per_month = 200;
update public.plans set images_per_month = 300, images_high_per_month = 60,  models3d_per_month = 10 where name = 'Archetype Pro' and images_per_month = 600;
update public.plans set images_per_month = 600, images_high_per_month = 150, models3d_per_month = 20 where name = 'Studio Guild'   and images_per_month = 2000;

-- 2. Generations: which quality was used, what it cost, and where the permanent copy lives.
alter table public.generations add column if not exists quality text not null default 'standard';
alter table public.generations add column if not exists cost integer not null default 1;
alter table public.generations add column if not exists preview_url text;

-- 3. Terms acceptance (proof the person agreed, and to which version).
alter table public.profiles add column if not exists terms_version text;
alter table public.profiles add column if not exists terms_accepted_at timestamptz;

-- New sign-ups copy the terms version they accepted (sent with the sign-up form) onto their profile.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, terms_version, terms_accepted_at)
  values (
    new.id,
    new.raw_user_meta_data ->> 'terms_version',
    nullif(new.raw_user_meta_data ->> 'terms_accepted_at', '')::timestamptz
  )
  on conflict do nothing;
  return new;
end;
$$;

-- 4. Permanent storage for finished images and 3D models. Public read, server-only write.
insert into storage.buckets (id, name, public)
values ('creations', 'creations', true)
on conflict (id) do nothing;
