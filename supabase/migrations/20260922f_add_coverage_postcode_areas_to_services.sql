-- Which postcode AREAS (the letter prefix of an outward code - "RM" in
-- "RM1 3AB") a service actually covers. The hero quote form checks a typed
-- postcode against this list, so coverage is editable data rather than a
-- hardcoded list in the template.
--
-- Deliberately per-service: end of tenancy covers all London and Essex, but a
-- service with a smaller footprint can carry a shorter list without any code
-- change.
--
-- Applied to project dkomihipebixlegygnoy on 2026-09-22.

alter table public.services
  add column if not exists coverage_postcode_areas jsonb not null default '[]'::jsonb;

comment on column public.services.coverage_postcode_areas is
  'Postcode area prefixes this service covers, e.g. ["RM","CM","E"]. Empty means no check is performed and any postcode is accepted.';

-- End of tenancy: all London postcode areas plus all Essex ones.
--
-- London = the eight London-postal-district areas (E, EC, N, NW, SE, SW, W,
-- WC) plus the outer Greater London areas (BR, CR, DA, EN, HA, IG, KT, RM, SM,
-- TW, UB, WD).
--
-- Essex = CM (Chelmsford), CO (Colchester) and SS (Southend). RM, IG and EN
-- already appear above and straddle the London/Essex boundary. CB and IP are
-- deliberately excluded: only a small western/southern sliver of each falls in
-- Essex, so claiming them whole would promise coverage we do not have.
update public.services
set coverage_postcode_areas = '["E","EC","N","NW","SE","SW","W","WC","BR","CR","DA","EN","HA","IG","KT","RM","SM","TW","UB","WD","CM","CO","SS"]'::jsonb,
    updated_at = now()
where slug = 'end-of-tenancy-cleaning';
