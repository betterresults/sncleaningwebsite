-- A named local person with a photo is the single strongest trust signal on a
-- local landing page, and the thing a generated page normally cannot fake.
-- These columns let an area page carry a real area manager; the block hides
-- entirely when they are null, so nothing invents a person.
--
-- Applied to project dkomihipebixlegygnoy on 2026-09-22.

alter table public.area_pages
  add column if not exists manager_name text,
  add column if not exists manager_role text,
  add column if not exists manager_photo text,
  add column if not exists manager_note text,
  add column if not exists rating numeric(2,1),
  add column if not exists review_count integer,
  add column if not exists review_url text;

comment on column public.area_pages.manager_note is
  'First-person note from the named area manager. Must be a real person - leave null rather than inventing one.';
comment on column public.area_pages.rating is
  'Real average review score. Leave null unless it matches the public review profile.';
