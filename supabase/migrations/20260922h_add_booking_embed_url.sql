-- The booking form is an embedded Dilvon page rather than a link we send people
-- off to. booking_embed_url is the iframe source; booking_url is where the
-- buttons point, which is now our own /book/{slug} page carrying that embed, so
-- the customer never leaves the site and we keep the header, footer and phone
-- number around them.
--
-- Applied to project dkomihipebixlegygnoy on 2026-09-22.

alter table public.services
  add column if not exists booking_embed_url text;

comment on column public.services.booking_embed_url is
  'Source URL for the embedded booking form iframe on /book/{slug}. Null means the service has no embedded form and buttons fall back to /contact.';

update public.services
set booking_embed_url = 'https://dilvon.com/book/sn-cleaning-services/end-of-tenancy-cleaning?embedded=true',
    booking_url = '/book/end-of-tenancy-cleaning',
    updated_at = now()
where slug = 'end-of-tenancy-cleaning';
