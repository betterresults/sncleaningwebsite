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

1. **Hero:** breadcrumbs, H1 "{Service} in {Area}", `quick_answer`, "From £" badge, quote form.
2. **Local:** `local_intro` + `intro`, with `postcodes` and `neighbourhoods` boxes.
3. **What's included:** `included_tasks`, or the main service page's list if empty.
4. **Guide section 1:** first item in `content_sections`, with the "Why book with us" box.
5. **Reviews:** automatic. Reviews that mention the area show first.
6. **How it works:** automatic, per service.
7. **FAQs:** `faqs`, also output as FAQ schema.
8. **Guide sections 2+:** the rest of `content_sections`.
9. **Other services in {Area}:** automatic. Links to the same area for each other service, or the next level up if that page doesn't exist.
10. **Areas:** automatic, from `coverage_regions.parent_id`. Borough pages list their towns. Town pages list the other towns in the same borough and link back up.
11. **Final call to action.**

The page deliberately does **not** show:

- the full price list (customers click *Get a quote* for an exact price)
- extras / add-ons
- the "People you can trust" section

These live on the main service page. Repeating them on every area page only adds duplicate text.

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
   - Prices come from the price list: end of tenancy from £179, domestic from £23/hour, carpet from £20 (rooms from £45).
   - The oven is cleaned as part of every end of tenancy clean and priced by size: £49 single, £79 double, £98 range, £129 AGA.
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
