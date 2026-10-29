-- Community sharing: people can share their own (unblocked) images; the owner can review and remove.
alter table public.generations add column if not exists shared boolean not null default false;
alter table public.generations add column if not exists shared_at timestamptz;
alter table public.generations add column if not exists share_title text;
alter table public.generations add column if not exists removed_by_admin boolean not null default false;
create index if not exists generations_shared_idx on public.generations (shared_at desc) where shared = true;

create table if not exists public.community_likes (
  generation_id bigint not null references public.generations(id) on delete cascade,
  user_id uuid not null,
  created_at timestamptz not null default now(),
  primary key (generation_id, user_id)
);
alter table public.community_likes enable row level security;
-- No policies on purpose: only the server (service role) reads or writes likes.
