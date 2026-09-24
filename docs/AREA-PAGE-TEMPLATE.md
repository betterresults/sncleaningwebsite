# Area page template

**Read this before creating or editing any area page.**

An area page is one service in one place, for example:

- `/end-of-tenancy-cleaning/romford/` (town)
- `/end-of-tenancy-cleaning/havering/` (borough)
- `/domestic-cleaning/croydon/`

Every area page, for every service, uses the same template: `views/area-v2.ejs`.
The reference page is **`/end-of-tenancy-cleaning/romford/`**. Make new pages look and read like it.

## Where the content lives

| What | Where |
| --- | --- |
| Page text (one row per page) | Supabase table `area_pages` |
| **Field guide: what each column is, where it shows, how to write it, example** | Supabase table `area_page_template` (read it first) |
| Areas and their parents (town → borough) | Supabase table `coverage_regions` (`parent_id`) |
| Layout | `views/area-v2.ejs` |
| Route | `server.js`, `app.get('/:serviceSlug/:areaSlug')` |
| Styles | `public/css/home.css` (`s-local`, `s-chips`, `s-benefit-list`, ...) |

To read the field guide:

```sql
select field, page_section, purpose, how_to_write, must_be_unique, example
from area_page_template order by display_order;
```

## Page structure (top to bottom)

People first (sections 1-4 decide whether a visitor books), local detail for Google after that.

1. **Hero** — breadcrumbs, H1 "{Service} in {Area}", `quick_answer` (people/benefit-focused), the one "From £" badge, quote form.
2. **Why people in {Area} book with us** — 4 benefits (automatic).
3. **What's included** — `included_tasks`, or the main service page's list if empty.
4. **Reviews** — automatic; reviews that mention the area show first.
5. **How it works** — automatic, per service.
6. **Local** — `local_intro` + `intro`, with `postcodes` and `neighbourhoods`.
7. **Guide** — all `content_sections`.
8. **FAQs** — `faqs` (also output as FAQ schema).
9. **Other services in {Area}** — automatic, links to the same area for each other service (or the next level up if that page doesn't exist).
10. **Areas** — automatic from `coverage_regions.parent_id` (map on London/Essex pages).
11. **Final call to action.**

## Structure and URLs

```
Main service page     /end-of-tenancy-cleaning/            map: London + Essex
  Region              /end-of-tenancy-cleaning/london/     all boroughs
    Borough           /end-of-tenancy-cleaning/havering/   its towns
      Town            /end-of-tenancy-cleaning/romford/    other towns in Havering + link up
```

- The parent comes from `coverage_regions.parent_id`, not from the URL.
- **Keep old addresses.** Before creating a page, check the Search Console export (`google-indexed-pages.csv`). If Google already knows an address for that service and area, use exactly that slug.

## Rules for content (to avoid duplicate / doorway pages)

1. **True only.** No invented claims, statistics, local stories or prices.
   - **Price rule (whole site): only ONE price per service, the "from" price.** End of tenancy £179, domestic £23/hour, deep cleaning £27/hour, Airbnb £24/hour, after builders £179, carpet £49; upholstery and mattress show no price. Never write prices for bedrooms, rooms, ovens, rugs or extras — customers get the exact price with Get a quote. The from prices live in `data/prices.js`.
   - The oven is cleaned as part of every end of tenancy clean and priced by its size (don't list the oven prices).
   - Re-clean window: 72 hours for end of tenancy, 24 hours for everything else.
2. **Unique where it matters.** `quick_answer`, `local_intro`, `intro`, `content_sections` and `faqs` must be written for that area. Never copy them from another page and swap the town name.
3. **Local, specific detail.** Real neighbourhoods, postcodes, property types and street/area names that someone from there would recognise.
4. **Questions as headings.** Guide headings and FAQs should be what people actually search.
5. **Don't repeat the service page.** The general guide for each service is in `data/service-seo.js`. Area pages add the local angle.
6. **No "eco-friendly" wording.** Say "professional products".
7. **Publish only when complete.** Set `published = true` only when every required field in `area_page_template` is filled and checked.

## Checklist for a new area page

- [ ] Region exists in `coverage_regions` with the right `parent_id`.
- [ ] Slug matches the old Google address, if there is one.
- [ ] All required fields filled, following `area_page_template`.
- [ ] Nothing copied from another area page.
- [ ] Prices match the price list.
- [ ] Page checked at `/{service}/{slug}/` on desktop and mobile.
