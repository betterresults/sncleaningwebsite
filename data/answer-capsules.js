// 2026 answer capsules for the four core service pages.
// Every price is derived from data/prices.js. Deep clean hours come from the
// published house cleaning time calculator (well kept home, one bathroom, no add ons).
// Visible sentences use spaces, never compound hyphens. Do not link to a
// prices URL that 404s.

const { FROM_PRICES } = require('./prices');
const { estimate } = require('../public/js/house-cleaning-time-calculator');
const { rateInputs } = require('./house-cleaning-time-calculator');

function hourly(slug) {
  const match = String(FROM_PRICES[slug] || '').match(/£(\d+(?:\.\d+)?)\/hour/);
  if (!match) throw new Error('answer capsule missing hourly from price for ' + slug);
  return Number(match[1]);
}

function starting(slug) {
  const match = String(FROM_PRICES[slug] || '').match(/£(\d+(?:\.\d+)?)/);
  if (!match) throw new Error('answer capsule missing from price for ' + slug);
  return Number(match[1]);
}

function gbp(n) {
  const pennies = Math.round(Number(n) * 100);
  if (!Number.isFinite(pennies)) throw new Error('answer capsule bad amount');
  if (pennies % 100 === 0) return '£' + String(pennies / 100);
  return '£' + (pennies / 100).toFixed(2);
}

function hoursLabel(n) {
  const rounded = Math.round(Number(n) * 100) / 100;
  if (Math.abs(rounded - Math.round(rounded)) < 1e-9) return String(Math.round(rounded));
  return String(rounded);
}

function times(hours, rate) {
  return {
    label: hoursLabel(hours) + ' hours at ' + gbp(rate) + ' an hour',
    amount: gbp(hours * rate)
  };
}

function deepVisit(bedrooms) {
  const result = estimate({
    service: 'deep',
    bedrooms: String(bedrooms),
    bathrooms: '1',
    condition: 'well',
    pets: 'none',
    oven: false,
    fridge: false,
    windows: false
  }, rateInputs());
  const rate = hourly('deep-house-cleaning');
  return { hours: result.mid, rate, row: times(result.mid, rate) };
}

const domesticRate = hourly('domestic-cleaning');
const deepRate = hourly('deep-house-cleaning');
const airbnbRate = hourly('airbnb-cleaning');
const buildersFrom = starting('after-builders-cleaning');
const twoHours = times(2, domesticRate);
const threeHours = times(3, domesticRate);
const airbnbMinimum = times(2, airbnbRate);
const airbnbThree = times(3, airbnbRate);
const deepTwoBed = deepVisit(2);
const deepThreeBed = deepVisit(3);

const CAPSULES = {
  'domestic-cleaning': {
    eyebrow: '2026 prices',
    title: '2026 answer capsule and worked examples',
    answer: 'Domestic cleaning in London and Essex starts from ' + gbp(domesticRate) + ' an hour with our own DBS checked team. Weekly and fortnightly visits are booked by the hour, with a 3 hour minimum, and a missed spot is covered by a 24 hour re clean guarantee. No VAT is added.',
    support: [
      'The figures below use the published from rate. The booking form shows your exact price before you confirm, because how often we visit can change the hourly rate.'
    ],
    examples: [
      {
        title: '2 hour weekly or fortnightly visit',
        lines: [twoHours],
        total: twoHours.amount,
        note: 'This is 2 hours at the published from rate for one cleaner. A bookable regular visit starts at the 3 hour minimum, so most weekly and fortnightly cleans begin at the next example.'
      },
      {
        title: '3 hour weekly or fortnightly visit',
        lines: [threeHours],
        total: threeHours.amount,
        note: 'One cleaner for a 3 hour visit, which is the minimum on the booking form. Cleaning products are included.'
      },
      {
        title: 'One off domestic visit',
        lines: [threeHours],
        total: threeHours.amount,
        note: 'A one off visit is also priced from ' + gbp(domesticRate) + ' an hour. A regular weekly or fortnightly visit can cost less per hour than a one off. The booking form shows the exact price.'
      }
    ],
    facts: [
      'Own DBS checked team',
      '24 hour re clean guarantee',
      'No VAT added'
    ],
    links: [
      { href: '/domestic-cleaning-checklist/', text: 'Domestic cleaning checklist' },
      { href: '/house-cleaning-time-calculator/', text: 'House cleaning time calculator' }
    ]
  },
  'deep-house-cleaning': {
    eyebrow: '2026 prices',
    title: '2026 answer capsule and worked examples',
    answer: 'Deep house cleaning in London and Essex starts from ' + gbp(deepRate) + ' an hour with our own DBS checked team. Inside oven cleaning is an optional add on only, never a standalone service. A home you live in has a 24 hour re clean guarantee, and no VAT is added.',
    support: [
      'The hour guides below come from our house cleaning time calculator for a well kept home with one bathroom and no add ons. A flat and a house with the same number of bedrooms use the same guide. They are not a confirmed quote.'
    ],
    examples: [
      {
        title: '2 bed flat deep clean',
        lines: [deepTwoBed.row],
        total: deepTwoBed.row.amount,
        note: 'Guide only. The time calculator starts a deep clean of a well kept 2 bed with one bathroom at about ' + hoursLabel(deepTwoBed.hours) + ' hours. The booking form shows the exact price.'
      },
      {
        title: '3 bed house deep clean',
        lines: [deepThreeBed.row],
        total: deepThreeBed.row.amount,
        note: 'Guide only. The time calculator starts a deep clean of a well kept 3 bed with one bathroom at about ' + hoursLabel(deepThreeBed.hours) + ' hours. The booking form shows the exact price.'
      }
    ],
    facts: [
      'Own DBS checked team',
      '24 hour re clean guarantee',
      'Oven cleaning is an add on only',
      'No VAT added'
    ],
    links: [
      { href: '/deep-cleaning-checklist/', text: 'Deep cleaning checklist' }
    ]
  },
  'airbnb-cleaning': {
    eyebrow: '2026 prices',
    title: '2026 answer capsule and worked examples',
    answer: 'Airbnb cleaning in London and Essex starts from ' + gbp(airbnbRate) + ' an hour for a check in and check out changeover. The rate is per cleaner, with a 2 hour minimum, and cleaning products are included. Photo proof is available on request, a missed spot is covered by a 24 hour re clean guarantee, and no VAT is added.',
    support: [
      'A 1 bed turnover at the minimum and a longer 2 bed changeover are worked out below from that published from rate. The booking form shows the exact hours and price before you confirm.'
    ],
    examples: [
      {
        title: '1 bed Airbnb turnover',
        lines: [airbnbMinimum],
        total: airbnbMinimum.amount,
        note: 'A 1 bed turnover at the 2 hour minimum, for one cleaner, with photo proof available on request after the clean.'
      },
      {
        title: '2 bed changeover',
        lines: [airbnbThree],
        total: airbnbThree.amount,
        note: 'A worked example of 3 hours at the published from rate for one cleaner. Every changeover still has a 2 hour minimum, which is ' + airbnbMinimum.amount + '. The booking form shows the real hours and total.'
      }
    ],
    facts: [
      'Photo proof on request',
      '24 hour re clean guarantee',
      '2 hour minimum',
      'No VAT added'
    ],
    links: [
      { href: '/airbnb-turnover-cleaning-checklist/', text: 'Airbnb turnover cleaning checklist' }
    ]
  },
  'after-builders-cleaning': {
    eyebrow: '2026 prices',
    title: '2026 answer capsule and worked examples',
    answer: 'After builders cleaning in London and Essex starts from ' + gbp(buildersFrom) + '. The clean includes HEPA fine dust removal with HEPA filtered vacuums. On an empty home the re clean guarantee is 7 days. If you already live in the property, it is 24 hours. No VAT is added.',
    support: [
      'A kitchen extension and a full flat renovation both start from that published price when the home is empty after the work. If you still live there and only one area was renovated, the prices page sets out that visit. The booking form shows the exact total.'
    ],
    examples: [
      {
        title: 'Kitchen extension after builders clean',
        lines: [{ label: 'Empty home after the work, starting price', amount: gbp(buildersFrom) }],
        total: gbp(buildersFrom),
        note: 'When the home is empty after the work, a kitchen extension clean is priced by size and starts from ' + gbp(buildersFrom) + '. If you live there and only the new kitchen needs cleaning, use the prices page. No VAT is added.'
      },
      {
        title: 'Full flat renovation clean',
        lines: [{ label: 'Empty flat, starting price', amount: gbp(buildersFrom) }],
        total: gbp(buildersFrom),
        note: 'A full renovation clean of an empty flat starts from ' + gbp(buildersFrom) + '. Larger flats cost more, and every size is on the prices page.'
      }
    ],
    facts: [
      'HEPA fine dust removal',
      '7 day re clean on empty homes',
      'Own DBS checked team',
      'No VAT added'
    ],
    links: [
      { href: '/after-builders-cleaning-checklist/', text: 'After builders cleaning checklist' },
      { href: '/after-builders-cleaning/prices/', text: 'After builders cleaning prices' }
    ]
  }
};

const HYPHEN = /[A-Za-z0-9]+-[A-Za-z0-9]+/;
function walk(value, path) {
  if (typeof value === 'string') {
    if (/\.href$/.test(path)) return;
    if (HYPHEN.test(value)) throw new Error('compound hyphen in answer capsule ' + path + ': ' + value);
    return;
  }
  if (Array.isArray(value)) value.forEach((item, index) => walk(item, path + '[' + index + ']'));
  else if (value && typeof value === 'object') {
    Object.keys(value).forEach((key) => walk(value[key], path + '.' + key));
  }
}
walk(CAPSULES, 'capsule');

const serialised = JSON.stringify(CAPSULES);
if (serialised.includes('/deep-house-cleaning/prices') || serialised.includes('/carpet-cleaning-services/prices')) {
  throw new Error('answer capsule links to a prices page that 404s');
}

function forSlug(slug) {
  return CAPSULES[slug] || null;
}

module.exports = { forSlug, CAPSULES };
