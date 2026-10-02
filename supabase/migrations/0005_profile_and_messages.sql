-- ============================================================
-- Earth Unseen — photographer profile + contact-form inbox
-- Run AFTER 0004_season_settings.sql.
-- ============================================================

begin;

-- Profile -------------------------------------------------------
-- Name, bio, location, email and links, edited in the studio's
-- Profile window and shown on About, Contact and the footer.
alter table public.settings
  add column if not exists profile jsonb not null default '{}'::jsonb;

-- Messages ------------------------------------------------------
create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 120),
  email text not null check (char_length(email) between 3 and 254),
  subject text not null default '' check (char_length(subject) <= 160),
  message text not null check (char_length(message) between 1 and 5000),
  read boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists messages_created_idx
  on public.messages (created_at desc);

alter table public.messages enable row level security;

-- Data API access -----------------------------------------------
-- Visitors may only insert; reading and managing is for the admin.
grant usage on schema public to anon, authenticated;
grant insert on table public.messages to anon, authenticated;
grant select, update, delete on table public.messages to authenticated;

-- RLS policies ---------------------------------------------------
create policy "anyone can send a message"
  on public.messages for insert
  to anon, authenticated
  with check (read = false);

create policy "admins can read messages"
  on public.messages for select
  to authenticated
  using (true);

create policy "admins can update messages"
  on public.messages for update
  to authenticated
  using (true)
  with check (true);

create policy "admins can delete messages"
  on public.messages for delete
  to authenticated
  using (true);

commit;
