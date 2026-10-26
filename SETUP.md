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
