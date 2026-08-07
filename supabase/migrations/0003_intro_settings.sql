-- ============================================================
-- Earth Unseen — intro-cover background setting
-- Run AFTER 0002_hero_settings.sql.
-- ============================================================

begin;

alter table public.settings
  add column if not exists intro_mode text not null default 'auto',
  add column if not exists intro_image_path text,
  add column if not exists intro_image_width integer,
  add column if not exists intro_image_height integer,
  add column if not exists intro_blur_data_url text,
  add column if not exists intro_color text;

commit;
