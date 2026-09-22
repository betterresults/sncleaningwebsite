-- Extends area_pages so each service+area landing page can carry genuinely
-- area-specific content instead of the same boilerplate with the place name
-- swapped in. Google treats near-identical mass-generated local pages as
-- doorway pages, so the differentiators below (postcodes actually served,
-- named neighbourhoods, local property-stock notes) are what make each page
-- stand on its own.
--
-- Every column is nullable or defaulted, so existing rows keep rendering
-- unchanged and can be enriched incrementally.
--
-- Applied to project dkomihipebixlegygnoy on 2026-09-22.

alter table public.area_pages
  add column if not exists price_from integer,
  add column if not exists pricing_tiers jsonb not null default '[]'::jsonb,
  add column if not exists postcodes jsonb not null default '[]'::jsonb,
  add column if not exists neighbourhoods jsonb not null default '[]'::jsonb,
  add column if not exists quick_answer text,
  add column if not exists local_intro text,
  add column if not exists included_tasks jsonb not null default '[]'::jsonb,
  add column if not exists add_ons jsonb not null default '[]'::jsonb;

comment on column public.area_pages.quick_answer is
  'Direct 40-60 word answer used for the featured-snippet block. No marketing padding.';
comment on column public.area_pages.local_intro is
  'Area-specific context (housing stock, agent expectations). Keep unique per area - this is what stops these reading as doorway pages.';
