-- ============================================================
-- Earth Unseen — per-season page settings
-- Run AFTER 0003_intro_settings.sql.
-- ============================================================

begin;

create table public.season_settings (
  season public.season primary key,
  hero_image_path text,
  hero_image_width integer,
  hero_image_height integer,
  hero_blur_data_url text,
  cover_photo_id uuid references public.photos(id) on delete set null,
  tagline text,
  description text,
  updated_at timestamptz not null default now()
);

alter table public.season_settings enable row level security;

-- Keep updated_at in sync (function is idempotent; may already exist).
create or replace function public.set_updated_at() returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists season_settings_set_updated_at on public.season_settings;
create trigger season_settings_set_updated_at
  before update on public.season_settings
  for each row execute function public.set_updated_at();

-- Data API access -----------------------------------------------
grant usage on schema public to anon, authenticated;
grant select on table public.season_settings to anon;
grant select, insert, update, delete on table public.season_settings to authenticated;

-- RLS policies ---------------------------------------------------
create policy "season settings are publicly readable"
  on public.season_settings for select
  to anon, authenticated
  using (true);

create policy "admins can insert season settings"
  on public.season_settings for insert
  to authenticated
  with check (true);

create policy "admins can update season settings"
  on public.season_settings for update
  to authenticated
  using (true)
  with check (true);

create policy "admins can delete season settings"
  on public.season_settings for delete
  to authenticated
  using (true);

commit;
