// Prices hub (/prices/). From prices come only from data/prices.js.
// Included lines come from the service page tiles in data/service-content.js.
// Oven cleaning is an add on, never its own service. Do not link a prices URL that 404s.

const { FROM_PRICES, PRICE_NOTES } = require('./prices');
const copy = require('./service-content');

function tiles(slug) {
  return ((copy[slug] && copy[slug].tiles) || []).map(([name, text]) => ({ name, text }));
}

const services = [
  {
    slug: 'domestic-cleaning',
    name: 'Domestic cleaning',
    price: FROM_PRICES['domestic-cleaning'],
    href: '/domestic-cleaning/',
    summary: 'Regular or one off cleaning for a home you live in. Weekly and fortnightly visits are booked by the hour, with a 3 hour minimum, and cleaning products are included. A missed spot is covered by a 24 hour re clean guarantee. No VAT is added.',
    included: tiles('domestic-cleaning'),
    links: [
      { href: '/domestic-cleaning/', text: 'Domestic cleaning' },
      { href: '/domestic-cleaning-checklist/', text: 'Domestic cleaning checklist' },
      { href: '/house-cleaning-time-calculator/', text: 'House cleaning time calculator' }
    ]
  },
  {
    slug: 'end-of-tenancy-cleaning',
    name: 'End of tenancy cleaning',
    price: FROM_PRICES['end-of-tenancy-cleaning'],
    href: '/end-of-tenancy-cleaning/',
    summary: 'A move out clean for tenants, landlords and agents, priced by the size of the home and whether it is furnished. The full list, extras and calculator are on the prices page. Cleaning inside the oven is an optional add on, not a standalone oven cleaning service. Empty homes have a 7 day re clean. No VAT is added.',
    included: tiles('end-of-tenancy-cleaning'),
    links: [
      { href: '/end-of-tenancy-cleaning/', text: 'End of tenancy cleaning' },
      { href: '/end-of-tenancy-cleaning/prices/', text: 'End of tenancy cleaning prices' },
      { href: '/end-of-tenancy-cleaning-checklist/', text: 'End of tenancy cleaning checklist' },
      { href: '/end-of-tenancy-cleaning-cost-calculator/', text: 'End of tenancy cost calculator' }
    ]
  },
  {
    slug: 'deep-house-cleaning',
    name: 'Deep house cleaning',
    price: FROM_PRICES['deep-house-cleaning'],
    href: '/deep-house-cleaning/',
    summary: 'A top to bottom clean of the areas a regular visit does not reach. The price is per cleaner per hour. Cleaning inside the oven is an optional add on, not a standalone oven cleaning service. A home you live in has a 24 hour re clean guarantee. No VAT is added.',
    included: tiles('deep-house-cleaning'),
    links: [
      { href: '/deep-house-cleaning/', text: 'Deep house cleaning' },
      { href: '/deep-cleaning-checklist/', text: 'Deep cleaning checklist' },
      { href: '/house-cleaning-time-calculator/', text: 'House cleaning time calculator' }
    ]
  },
  {
    slug: 'airbnb-cleaning',
    name: 'Airbnb cleaning',
    price: FROM_PRICES['airbnb-cleaning'],
    href: '/airbnb-cleaning/',
    summary: 'A check in and check out changeover for a short let. The rate is per cleaner, with a 2 hour minimum, and cleaning products are included. Photo proof is available on request. A missed spot is covered by a 24 hour re clean guarantee. No VAT is added.',
    included: tiles('airbnb-cleaning'),
    links: [
      { href: '/airbnb-cleaning/', text: 'Airbnb cleaning' },
      { href: '/airbnb-turnover-cleaning-checklist/', text: 'Airbnb turnover cleaning checklist' }
    ]
  },
  {
    slug: 'after-builders-cleaning',
    name: 'After builders cleaning',
    price: FROM_PRICES['after-builders-cleaning'],
    href: '/after-builders-cleaning/',
    summary: 'Fine dust removal after building work, with HEPA filtered vacuums. An empty home is priced by size. One room in a home you live in, or a cleaner for a builder, is priced by the hour on the prices page. Cleaning inside the oven is an optional add on, not a standalone oven cleaning service. On an empty home the re clean guarantee is 7 days. If you already live there, it is 24 hours. No VAT is added.',
    included: tiles('after-builders-cleaning'),
    links: [
      { href: '/after-builders-cleaning/', text: 'After builders cleaning' },
      { href: '/after-builders-cleaning/prices/', text: 'After builders cleaning prices' },
      { href: '/after-builders-cleaning-checklist/', text: 'After builders cleaning checklist' }
    ]
  },
  {
    slug: 'carpet-cleaning-services',
    name: 'Carpet cleaning',
    price: FROM_PRICES['carpet-cleaning-services'],
    href: '/carpet-cleaning-services/',
    note: PRICE_NOTES['carpet-cleaning-services'],
    summary: 'Fitted carpets, stairs and rugs, with stains pre treated and a fast dry finish. The from price is for a single bedroom. Carpets, sofas and mattresses can be combined in one visit. Use the calculator for a guide, then confirm the total on the booking form.',
    included: tiles('carpet-cleaning-services'),
    links: [
      { href: '/carpet-cleaning-services/', text: 'Carpet cleaning' },
      { href: '/carpet-cleaning-cost-calculator/', text: 'Carpet cleaning cost calculator' }
    ]
  },
  {
    slug: 'upholstery-cleaning',
    name: 'Upholstery cleaning',
    price: FROM_PRICES['upholstery-cleaning'],
    href: '/upholstery-cleaning/',
    note: PRICE_NOTES['upholstery-cleaning'],
    summary: 'Fabric sofas, armchairs and dining chairs, tested on a hidden area first. The from price is for a 2 seater sofa. Leather is not priced here: tell us when you book and we will advise. Sofas can be combined with carpets and mattresses to reach the minimum visit.',
    included: tiles('upholstery-cleaning'),
    links: [
      { href: '/upholstery-cleaning/', text: 'Upholstery cleaning' },
      { href: '/carpet-cleaning-cost-calculator/', text: 'Carpet, sofa and mattress calculator' }
    ]
  },
  {
    slug: 'mattress-cleaning',
    name: 'Mattress cleaning',
    price: FROM_PRICES['mattress-cleaning'],
    href: '/mattress-cleaning/',
    note: PRICE_NOTES['mattress-cleaning'],
    summary: 'A sanitising clean for stains, odours and dust mites, on both sides where the mattress can be turned. The from price is for a single mattress. Mattresses can be combined with carpets and sofas to reach the minimum visit.',
    included: tiles('mattress-cleaning'),
    links: [
      { href: '/mattress-cleaning/', text: 'Mattress cleaning' },
      { href: '/carpet-cleaning-cost-calculator/', text: 'Carpet, sofa and mattress calculator' }
    ]
  }
];

const serialised = JSON.stringify(services);
if (serialised.includes('/deep-house-cleaning/prices') || serialised.includes('/carpet-cleaning-services/prices')) {
  throw new Error('prices hub links to a prices page that 404s');
}
for (const service of services) {
  if (!service.price) throw new Error('prices hub missing from price for ' + service.slug);
  if (/[A-Za-z0-9]+-[A-Za-z0-9]+/.test(service.summary + service.name + (service.note || ''))) {
    throw new Error('compound hyphen in prices hub copy for ' + service.slug);
  }
}

module.exports = services;
