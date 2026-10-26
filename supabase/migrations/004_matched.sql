-- Remember which words tripped moderation, so the admin screen can highlight them. Run once.
alter table public.generations add column if not exists matched text;
