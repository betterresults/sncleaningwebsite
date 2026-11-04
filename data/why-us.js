// "Why us" pages: one per service at /why-us/{service-slug}/.
// Content lives in data/why-us/{service-slug}.json (see docs in that folder's files).
// Order here is the order in the menu and on the /why-us hub.
const fs = require('fs');
const path = require('path');

const ORDER = [
  'end-of-tenancy-cleaning',
  'deep-house-cleaning',
  'domestic-cleaning',
  'airbnb-cleaning',
  'after-builders-cleaning',
  'carpet-cleaning-services',
  'upholstery-cleaning',
  'mattress-cleaning'
];

const DIR = path.join(__dirname, 'why-us');
const pages = ORDER.map((slug) => {
  const file = path.join(DIR, `${slug}.json`);
  if (!fs.existsSync(file)) return null;
  const d = JSON.parse(fs.readFileSync(file, 'utf8'));
  return { ...d, slug: d.service_slug, url: `/why-us/${d.service_slug}` };
}).filter(Boolean);

module.exports = {
  all: () => pages,
  get: (slug) => pages.find((p) => p.slug === slug) || null
};
