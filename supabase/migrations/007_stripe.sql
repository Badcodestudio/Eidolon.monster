-- Eidolon: Stripe payments (plans get their Stripe ids; accounts remember their Stripe customer).
-- Safe to run more than once. Run in Supabase: SQL Editor -> New query -> paste -> Run.

-- Each plan: the Stripe buy button, the publishable key it was made with (safe to be public),
-- and the Stripe price id that tells the webhook which plan was bought.
alter table public.plans add column if not exists stripe_buy_button_id text;
alter table public.plans add column if not exists stripe_publishable_key text;
alter table public.plans add column if not exists stripe_price_id text;

alter table public.profiles add column if not exists stripe_customer_id text;
alter table public.profiles add column if not exists stripe_subscription_id text;
create index if not exists profiles_stripe_customer on public.profiles (stripe_customer_id);

-- Remembers which Stripe events were already handled (Stripe can send the same one twice).
create table if not exists public.stripe_events (
  id text primary key,
  type text,
  received_at timestamptz not null default now()
);
alter table public.stripe_events enable row level security; -- no policies: only the server can use it
