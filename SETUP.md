# Eidolon backend setup (Supabase)

Project: https://wdlsiufvaoefbapctusf.supabase.co

1. Database: Supabase -> SQL Editor -> New query -> paste `supabase/migrations/001_init.sql` -> Run.
2. Auth: Authentication -> Providers -> Email. For quick testing turn OFF "Confirm email" (turn back on before launch).
3. Secret: Edge Functions -> Secrets -> add `FAL_KEY` = your fal.ai key. Optional: `DAILY_IMAGE_LIMIT` (default 30).
4. Function: Edge Functions -> Deploy a new function -> name `generate-image` -> paste `supabase/functions/generate-image/index.ts` -> Deploy.
   (Leave "Verify JWT" ON.)
5. GitHub: repo Settings -> Secrets and variables -> Actions -> Variables:
   - `VITE_SUPABASE_URL` = https://wdlsiufvaoefbapctusf.supabase.co
   - `VITE_SUPABASE_ANON_KEY` = your sb_publishable_... key
   Then Actions -> Deploy to GitHub Pages -> Re-run.

## 3D (Tripo)

7. SQL Editor: paste `supabase/migrations/002_3d.sql` and Run.
8. Edge Functions -> Secrets: add `TRIPO_KEY` = your Tripo API key.
9. Edge Functions -> Deploy a new function -> name `generate-3d` -> paste `supabase/functions/generate-3d/index.ts` -> Deploy (Verify JWT on).
10. Plans: new accounts are `Free` (0 3D models). Pro gets 5 a month. To upgrade someone, run in the SQL Editor:
    update public.profiles set plan = 'Pro' where id = (select id from auth.users where email = 'person@example.com');
    Extra purchased models: update public.profiles set bonus_3d = bonus_3d + 5 where id = (select id from auth.users where email = '...');
Note: Tripo's download links expire, so models should be saved to Supabase Storage next.

## Moderation admin + 18+ (latest)

11. SQL Editor: run `supabase/migrations/003_owner.sql`, then mark yourself owner (see the comment in that file).
12. Deploy a NEW function named `admin` from `supabase/functions/admin/index.ts` (Verify JWT on).
13. Redeploy `generate-image` and `generate-3d` (moderation rules changed: weapons removed, explicit = instant lock).
14. After the site redeploys: sign in with your owner account, open /admin -> Moderation tab.
