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

## Highlighted triggers

15. SQL Editor: run `supabase/migrations/004_matched.sql`.
16. Redeploy `generate-image`, `generate-3d` and `admin` (all three changed).

## Plans, limits and counters

17. SQL Editor: run `supabase/migrations/005_plans.sql` (creates the plans table with placeholder numbers).
18. Redeploy `generate-image`, `generate-3d` and `admin`.
19. Website files changed: src/lib/usage.ts, src/components/UsageBadge.tsx, src/components/GeneratorModal.tsx,
    src/pages/ThreeDStudio/index.tsx, src/pages/Pricing/index.tsx, src/pages/Admin/index.tsx,
    src/pages/Admin/PlansPanel.tsx, src/pages/Admin/ModerationPanel.tsx
20. Admin -> Plans & limits: set your real prices and limits.

---

## Update: quality tiers, permanent storage, 3D viewer, legal pages

1. **Run the new SQL.** Supabase -> SQL Editor -> New query -> paste `supabase/migrations/006_quality_storage_terms.sql` -> Run.
   (If you have not run 002, 004 and 005 yet, run those first, in order.)
2. **Redeploy three functions** (paste the new code of each, then Deploy updates):
   `generate-image`, `generate-3d`, `admin`. Check the first comment line of each file matches its name.
3. **Upload the changed site files** to GitHub in ONE upload (see the zip). One upload = one build.
4. **Admin -> Plans & limits:** each plan now has Standard images, High-quality images and 3D credits (a High-detail model uses 2). Save each plan.
5. **Edit `src/lib/legal.ts`:** put a real contact email in `CONTACT_EMAIL`. Have a lawyer read the Legal page before you take payments.
6. **Test as owner:** make a Standard image, a High image, then a 3D model from one of them. The 3D result should show a model you can drag to rotate.

---

## Stripe payments (do this in TEST mode first)

Stripe has separate Test and Live modes. Everything below must be done once in Test mode, tried with a test card, and then repeated in Live mode with the live buttons and secrets.

1. Run `supabase/migrations/007_stripe.sql` in the SQL Editor.
2. In Stripe (Test mode): for each paid plan make a Product with a monthly recurring Price, then a Buy Button for it. Note each button's `buy_btn_...` id, the `pk_test_...` publishable key and the price's `price_...` id.
3. Deploy the new function `stripe-webhook` (paste `supabase/functions/stripe-webhook/index.ts`). Turn **Verify JWT OFF** for this one function only.
4. In Stripe: Developers -> Webhooks -> Add endpoint.
   URL: `https://wdlsiufvaoefbapctusf.supabase.co/functions/v1/stripe-webhook`
   Events: `checkout.session.completed`, `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`.
   Copy the endpoint's signing secret (starts `whsec_`).
5. In Stripe: Developers -> API keys -> Create restricted key. Give it only **Checkout Sessions: Read**. Copy it.
6. In Supabase -> Edge Functions -> Secrets add `STRIPE_WEBHOOK_SECRET` (the whsec_ value) and `STRIPE_SECRET_KEY` (the restricted key). Never paste these anywhere else.
7. Redeploy `admin`, upload the site files (one batch).
8. Admin -> Plans & limits: for each paid plan fill in buy button id, publishable key and price id, then Save.
9. Test: sign in with a normal (non-owner) account, subscribe with test card `4242 4242 4242 4242` (any future date, any CVC). The account's plan should change within a few seconds. Cancel the subscription in the Stripe dashboard: the plan should return to Free.
10. Go live: repeat steps 2, 4, 5 and 6 in Live mode (new webhook endpoint, new secrets), then replace the three fields on each plan with the live values.
