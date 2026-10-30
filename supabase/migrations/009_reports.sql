-- Community reports: any signed-in person can report a shared piece; the owner reviews them.
create table if not exists community_reports (
  id bigint generated always as identity primary key,
  generation_id bigint not null references generations(id) on delete cascade,
  reporter_id uuid not null,
  reason text,
  resolved boolean not null default false,
  created_at timestamptz not null default now(),
  unique (generation_id, reporter_id)
);
alter table community_reports enable row level security;
