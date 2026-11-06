# Schema (structured data) on sncleaningservices.co.uk

Silvia's rule: every page, including every new page, carries proper schema with as many types as truthfully apply.

## Where it comes from
- `lib/schema.js` builds every JSON-LD block. Pages never hand write JSON-LD.
- `data/business-profile.js`: address, map pin, opening hours, Google rating and review count, description, Silvia as founder, profile links (`sameAs`).
- `data/testimonials.js`: real Google reviews, word for word.
- `data/prices.js`: the from prices used in Offer markup.

## What each page gets
| Page | Schema |
| --- | --- |
| Every page | HomeAndConstructionBusiness, a LocalBusiness type (address, geo, hours, aggregateRating, offer catalogue, areas served, founder), WebSite, Person (Silvia), WebPage (AboutPage on /about/, ContactPage on /contact/), BreadcrumbList (all but home) |
| Service and area pages | Service with the from price as an Offer, FAQPage |
| Pages that show reviews (home, service, area, about) | Review markup for exactly the reviews shown |
| Blog posts, case studies, answers | BlogPosting, author Silvia (same @id as the Person) |
| Pages with videos | VideoObject |

## Keeping it true
- Check the Google rating and review count on Google Maps once a week and update `googleRating` in `data/business-profile.js`.
- Add a new profile link (LinkedIn, Facebook, Instagram, Trustpilot, Yell, Bing Places) to `sameAs` as soon as it exists.
- A new template or page type must call the builders in `lib/schema.js` before going live.
- Test after any change with validator.schema.org or Google's Rich Results Test.
