// Airbnb changeover price guard (Dana, 24 Nov 2026). The Dilvon booking form is the source of truth:
// check in / check out cleans are £26 per hour with cleaning products, 2 hour minimum (refresh cleans are £23).
// Older CMS text on Airbnb area pages (area_pages) says "Airbnb cleaning starts from £23", and the daily CMS
// rewrite of quick_answer can bring it back, so the text is corrected here, after the CMS row is read.
// Only sentences about Airbnb/changeover pricing change; sentences about domestic, regular, deep or refresh
// cleans keep their own prices. Remove this file's use in server.js once the CMS text is clean for good.
const SKIP = /domestic|regular|refresh|deep clean|house clean/i;
const AIRBNB_PRICE = /(Airbnb cleaning(?: is)?(?: starts)? from )£23\b/g;

function fixText(t) {
  if (typeof t !== 'string' || t.indexOf('£23') === -1) return t;
  return t.split(/(?<=[.!?])(\s+)/).map((s) => {
    if (s.indexOf('£23') === -1) return s;
    if (SKIP.test(s)) return s.replace(AIRBNB_PRICE, '$1£26');
    return s.replace(', the lowest rate on our Airbnb price list,', ',').replace(/£23\b/g, '£26');
  }).join('');
}

function guardAirbnbPrices(page) {
  if (!page || !page.services || page.services.slug !== 'airbnb-cleaning') return page;
  const next = { ...page };
  // Visible copy only. meta_description is not rewritten: a price must not be written into a meta tag.
  ['intro', 'local_intro', 'quick_answer'].forEach((k) => { next[k] = fixText(page[k]); });
  if (Array.isArray(page.content_sections)) {
    next.content_sections = page.content_sections.map((c) => ({ ...c, body: Array.isArray(c.body) ? c.body.map(fixText) : c.body }));
  }
  if (Array.isArray(page.faqs)) next.faqs = page.faqs.map((f) => ({ ...f, answer: fixText(f.answer) }));
  return next;
}

module.exports = { guardAirbnbPrices, fixText };
