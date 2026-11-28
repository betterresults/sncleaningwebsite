// One modification date per static page. scripts/prerender.js and server.js both
// read this map, so the visible "Last updated" line, the WebPage dateModified
// and the sitemap lastmod stay on the same day. Dates are real edits, not the
// build date. Dynamic pages (posts, areas, services) pass their own row date.
const eotPrices = require('./eot-prices');
const abPrices = require('./after-builders-prices');
const eotChecklist = require('./eot-checklist');
const domesticChecklist = require('./domestic-checklist');
const airbnbChecklist = require('./airbnb-turnover-checklist');
const abChecklist = require('./after-builders-checklist');
const deepChecklist = require('./deep-cleaning-checklist');
const timeCalc = require('./house-cleaning-time-calculator');
const eotCost = require('./end-of-tenancy-cleaning-cost-calculator');
const carpetCost = require('./carpet-cleaning-cost-calculator');
const legal = require('./legal');

const MONTHS = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'];

function isoDay(value) {
  if (!value) return null;
  const text = String(value).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) return text;
  const named = text.match(/^(\d{1,2}) ([A-Za-z]+) (\d{4})$/);
  if (named) {
    const month = MONTHS.indexOf(named[2].toLowerCase());
    if (month >= 0) return new Date(Date.UTC(Number(named[3]), month, Number(named[1]))).toISOString().slice(0, 10);
  }
  const d = new Date(text);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString().slice(0, 10);
}

function laterDay(a, b) {
  const x = isoDay(a);
  const y = isoDay(b);
  if (!x) return y;
  if (!y) return x;
  return x >= y ? x : y;
}

// Area and service rows: keep the stored day, and leave off a stamp after the audit date.
function recordedDate(value) {
  const day = isoDay(value);
  if (!day || day > '2026-11-28') return null;
  return day;
}

const AI_SERVICE_MODIFIED = '2026-11-27';
const AI_SERVICES = new Set([
  'domestic-cleaning',
  'deep-house-cleaning',
  'airbnb-cleaning',
  'after-builders-cleaning',
  'end-of-tenancy-cleaning'
]);

function serviceDate(page) {
  const cms = recordedDate(page && page.updated_at);
  if (page && AI_SERVICES.has(page.slug)) return laterDay(AI_SERVICE_MODIFIED, cms);
  return cms;
}

function videoDate(slug, videos) {
  if (slug === 'end-of-tenancy-cleaning') return '2026-11-28';
  const newest = (videos || []).map((v) => v.recorded_on || v.created_at).filter(Boolean).sort().pop();
  return isoDay(newest);
}

const DATES = {
  '/': '2026-11-27',
  '/our-services': '2026-11-27',
  '/about': '2026-11-28',
  '/about/silvia-nedeva': '2026-11-27',
  '/end-of-tenancy-cleaning/faq': '2026-11-28',
  '/end-of-tenancy-cleaning/prices': isoDay(eotPrices.PRICES_LAST_UPDATED),
  '/end-of-tenancy-cleaning-checklist': isoDay(eotChecklist.PUBLISHED),
  '/domestic-cleaning-checklist': isoDay(domesticChecklist.PUBLISHED),
  '/airbnb-turnover-cleaning-checklist': isoDay(airbnbChecklist.PUBLISHED),
  '/after-builders-cleaning-checklist': isoDay(abChecklist.PUBLISHED),
  '/deep-cleaning-checklist': isoDay(deepChecklist.PUBLISHED),
  '/clean-home-report': '2026-11-26',
  '/house-cleaning-time-calculator': isoDay(timeCalc.PUBLISHED),
  '/end-of-tenancy-cleaning-cost-calculator': isoDay(eotCost.PUBLISHED),
  '/carpet-cleaning-cost-calculator': isoDay(carpetCost.PUBLISHED),
  '/after-builders-cleaning/prices': isoDay(abPrices.PUBLISHED),
  '/prices': '2026-11-28',
  '/areas': '2026-11-28',
  '/reviews': '2026-11-28',
  '/our-work': '2026-11-16',
  '/why-us': '2026-11-28',
  '/why-us/end-of-tenancy-cleaning': '2026-11-28',
  '/why-us/deep-house-cleaning': '2026-11-28',
  '/why-us/domestic-cleaning': '2026-11-24',
  '/why-us/airbnb-cleaning': '2026-11-24',
  '/why-us/after-builders-cleaning': '2026-11-28',
  '/why-us/carpet-cleaning-services': '2026-11-28',
  '/why-us/upholstery-cleaning': '2026-11-28',
  '/why-us/mattress-cleaning': '2026-11-28',
  '/blog': '2026-11-26',
  '/privacy-policy': isoDay(legal['privacy-policy'].updated),
  '/terms-and-conditions': isoDay(legal['terms-and-conditions'].updated),
  '/cookies-policy': isoDay(legal['cookies-policy'].updated),
  '/contact': '2026-11-28'
};

// A why us page that stores its own date uses that, so the guide article and
// the visible date stay on the same day.
for (const page of require('./why-us').all()) {
  if (page.date_modified) DATES[page.url] = isoDay(page.date_modified);
}

function staticDate(url) {
  const key = !url || url === '/' ? '/' : String(url).replace(/\/$/, '');
  return DATES[key] || null;
}

module.exports = {
  DATES,
  isoDay,
  laterDay,
  staticDate,
  recordedDate,
  serviceDate,
  videoDate,
  AI_SERVICE_MODIFIED
};
