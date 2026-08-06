-- ============================================================
-- Earth Unseen — initial schema
-- Run this in the Supabase SQL editor (or via supabase db push).
-- ============================================================

begin;

-- Season enum --------------------------------------------------
create type public.season as enum ('winter', 'spring', 'summer', 'fall');

-- Photos table --------------------------------------------------
create table public.photos (
  id uuid primary key default gen_random_uuid(),
  season public.season not null,
  caption text not null default '',
  image_path text not null unique,
  blur_data_url text not null default '',
  width integer not null,
  height integer not null,
  sort_order bigint not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index photos_season_order_idx
  on public.photos (season, sort_order desc, created_at desc);

alter table public.photos enable row level security;

-- Keep updated_at in sync ---------------------------------------
create or replace function public.set_updated_at() returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists photos_set_updated_at on public.photos;
create trigger photos_set_updated_at
  before update on public.photos
  for each row execute function public.set_updated_at();

-- Data API access -----------------------------------------------
-- (New tables are not exposed automatically; grant explicitly.)
grant usage on schema public to anon, authenticated;
grant select on table public.photos to anon;
grant select, insert, update, delete on table public.photos to authenticated;

-- RLS policies ---------------------------------------------------
create policy "photos are publicly readable"
  on public.photos for select
  to anon, authenticated
  using (true);

create policy "admins can insert photos"
  on public.photos for insert
  to authenticated
  with check (true);

create policy "admins can update photos"
  on public.photos for update
  to authenticated
  using (true)
  with check (true);

create policy "admins can delete photos"
  on public.photos for delete
  to authenticated
  using (true);

-- Storage bucket for image files ----------------------------------
insert into storage.buckets (id, name, public)
values ('photos', 'photos', true)
on conflict (id) do nothing;

create policy "photos images are publicly readable"
  on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'photos');

create policy "admins can upload photos images"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'photos');

create policy "admins can update photos images"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'photos')
  with check (bucket_id = 'photos');

create policy "admins can delete photos images"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'photos');

commit;
