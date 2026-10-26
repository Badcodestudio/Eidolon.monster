-- Owner accounts skip moderation locks and limits (for testing). Run once.
alter table public.profiles add column if not exists is_owner boolean not null default false;

-- Then mark your own account (replace the email):
--   update public.profiles set is_owner = true, locked = false, strikes = 0, lock_reason = null
--   where id = (select id from auth.users where email = 'contact@eidolon.monster');
