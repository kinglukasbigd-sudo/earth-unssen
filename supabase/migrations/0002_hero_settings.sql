-- ============================================================
-- Earth Unseen — start-screen hero background setting
-- Run this in the Supabase SQL editor (or via supabase db push)
-- AFTER 0001_init.sql.
-- ============================================================

begin;

create table public.settings (
  id integer primary key default 1 check (id = 1),
  hero_image_path text,
  hero_image_width integer,
  hero_image_height integer,
  hero_blur_data_url text,
  updated_at timestamptz not null default now()
);

alter table public.settings enable row level security;

-- Keep updated_at in sync (function is idempotent; may already exist).
create or replace function public.set_updated_at() returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists settings_set_updated_at on public.settings;
create trigger settings_set_updated_at
  before update on public.settings
  for each row execute function public.set_updated_at();

-- Data API access -----------------------------------------------
grant usage on schema public to anon, authenticated;
grant select on table public.settings to anon;
grant select, insert, update, delete on table public.settings to authenticated;

-- RLS policies ---------------------------------------------------
create policy "settings are publicly readable"
  on public.settings for select
  to anon, authenticated
  using (true);

create policy "admins can insert settings"
  on public.settings for insert
  to authenticated
  with check (true);

create policy "admins can update settings"
  on public.settings for update
  to authenticated
  using (true)
  with check (true);

create policy "admins can delete settings"
  on public.settings for delete
  to authenticated
  using (true);

-- The single settings row must exist before updates can apply.
insert into public.settings (id) values (1)
on conflict (id) do nothing;

commit;
