-- The hero quote calculator prices a property from the bedroom count, so each
-- pricing tier needs a machine-readable bedroom number rather than only the
-- human label ("2 bedroom flat or house"). Bathrooms beyond the first add a
-- flat uplift.
--
-- Applied to project dkomihipebixlegygnoy on 2026-09-22.

alter table public.area_pages
  add column if not exists extra_bathroom_price integer not null default 25;

comment on column public.area_pages.extra_bathroom_price is
  'Uplift per bathroom beyond the first, used by the hero quote calculator.';

-- Tag the existing Romford tiers with their bedroom counts. `beds` is what the
-- calculator matches on; the label stays the customer-facing wording.
update public.area_pages ap
set pricing_tiers = '[
    {"beds":0,"property":"Studio flat","price":140},
    {"beds":1,"property":"1 bedroom","price":165},
    {"beds":2,"property":"2 bedrooms","price":195},
    {"beds":3,"property":"3 bedrooms","price":245},
    {"beds":4,"property":"4 bedrooms","price":295},
    {"beds":5,"property":"5+ bedrooms","price":355}
  ]'::jsonb,
  updated_at = now()
from public.services s
where ap.service_id = s.id and s.slug = 'end-of-tenancy-cleaning' and ap.slug = 'romford';
