-- Three more Dilvon booking forms, supplied 2026-09-22.
--
-- Note the carpet mismatch: Dilvon's form lives at .../carpet-cleaning while
-- our service slug is carpet-cleaning-services. booking_embed_url is theirs and
-- booking_url is ours, so the two can differ without anything breaking.
--
-- No code change accompanies this: /book/{slug} and the static build already
-- generate a page for every service that has an embed.
--
-- Applied to project dkomihipebixlegygnoy on 2026-09-22.

update public.services set
  booking_embed_url = 'https://dilvon.com/book/sn-cleaning-services/airbnb-cleaning?embedded=true',
  booking_url = '/book/airbnb-cleaning', updated_at = now()
where slug = 'airbnb-cleaning';

update public.services set
  booking_embed_url = 'https://dilvon.com/book/sn-cleaning-services/carpet-cleaning?embedded=true',
  booking_url = '/book/carpet-cleaning-services', updated_at = now()
where slug = 'carpet-cleaning-services';

update public.services set
  booking_embed_url = 'https://dilvon.com/book/sn-cleaning-services/domestic-cleaning?embedded=true',
  booking_url = '/book/domestic-cleaning', updated_at = now()
where slug = 'domestic-cleaning';
