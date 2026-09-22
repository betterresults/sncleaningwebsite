-- coverage_regions.name is an internal operations label ("Essex - Romford /
-- Thurrock Edge") used for grouping coverage. Putting that in an H1 or title
-- tag reads as nonsense to a customer and dilutes the keyword, so pages now
-- render display_name where it is set and fall back to name where it is not.
--
-- Applied to project dkomihipebixlegygnoy on 2026-09-22.

alter table public.coverage_regions
  add column if not exists display_name text;

comment on column public.coverage_regions.display_name is
  'Customer-facing place name used in H1s, titles and body copy (e.g. "Romford"). Falls back to name when null.';

update public.coverage_regions set display_name = 'Romford'
where name = 'Essex - Romford / Thurrock Edge';
