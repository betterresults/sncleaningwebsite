-- Real pricing, taken from SN's own price list (2026).
--
-- End of tenancy is priced on three axes, not one: property type (flat or
-- house), bedroom count, and how furnished the property is. Extra rooms beyond
-- the bedrooms are charged individually at the same three furnishing levels.
-- The previous single-price-per-bedroom shape could not express that, so
-- pricing_tiers now carries a prices object per row and extra_rooms replaces
-- the flat extra_bathroom_price.
--
-- Applied to project dkomihipebixlegygnoy on 2026-09-22. The Romford seed
-- values are in that migration run; see the row for current copy.

alter table public.area_pages
  add column if not exists extra_rooms jsonb not null default '[]'::jsonb;

comment on column public.area_pages.extra_rooms is
  'Rooms charged on top of the base property price: [{ "name": "Bathroom", "prices": {"unfurnished":35,"part":38.5,"furnished":42} }].';

-- Where the quote buttons send people. Null falls back to the on-site contact
-- form, so the pages work until the external booking form links are supplied.
alter table public.services
  add column if not exists booking_url text;

comment on column public.services.booking_url is
  'External booking form for this service. Null means use the on-site /contact route.';
