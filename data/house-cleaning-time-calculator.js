// House cleaning time calculator (public page).
// Copy, FAQs and the published from-prices only.
// Estimator maths lives in public/js/house-cleaning-time-calculator.js
// (estimate). The route calls it for the first paint; the browser calls it
// again on each change. Do not duplicate the hour table here.

const { servicePrice } = require('./prices');

const PUBLISHED = '2026-11-26';
const PUBLISHED_LABEL = '26 November 2026';

// Layout appends " | SN Cleaning Services" when the result is 60 characters or
// under. Rendered <title> is the 53-character string with no prices.
const TITLE = 'House Cleaning Time Calculator';
const H1 = 'How long will a house clean take?';
const META_DESCRIPTION = 'Work out how long a house clean may take in London or Essex, by rooms, condition, pets and optional add-ons, then open the matching booking form.';

const PATH = '/house-cleaning-time-calculator/';

const HONESTY_NOTE = 'This is a guide, not a confirmed quote. Add-ons and the exact price are shown in the live booking form before you confirm. Weekly or fortnightly regular visits, and whether equipment is provided, can change the hourly rate — the published from rate is the starting point.';

const ADDON_NOTE = 'These are extras, not standalone services. Any extra cost is shown in the booking form before you confirm.';

// Slugs passed to app.locals.bookUrl. deep-house-cleaning maps to Dilvon deep-cleaning.
const BOOK_SLUG = {
  regular: 'domestic-cleaning',
  deep: 'deep-house-cleaning',
  eot: 'end-of-tenancy-cleaning'
};

const PRICE_LABELS = {
  regular: servicePrice('domestic-cleaning'),
  deep: servicePrice('deep-house-cleaning'),
  eot: servicePrice('end-of-tenancy-cleaning')
};

function hourlyFrom(label) {
  const match = String(label || '').match(/£(\d+(?:\.\d+)?)\/hour/);
  return match ? Number(match[1]) : null;
}

function rateInputs() {
  return {
    regularHourly: hourlyFrom(PRICE_LABELS.regular),
    deepHourly: hourlyFrom(PRICE_LABELS.deep),
    labels: PRICE_LABELS
  };
}

// First paint, and the checked controls in the template.
const DEFAULT_STATE = {
  service: 'regular',
  bedrooms: '2',
  bathrooms: '1',
  condition: 'average',
  pets: 'none',
  oven: false,
  fridge: false,
  windows: false
};

const faqs = [
  {
    q: 'What is the minimum booking time?',
    a: 'Regular domestic and deep cleaning visits have a 3-hour minimum on the booking form, and you choose the total time in half-hour steps. End of tenancy cleaning is not charged by the hour; a typical visit takes our team 3 to 6 hours, and a one bedroom property can take 3 to 4 hours depending on whether it is furnished or unfurnished.'
  },
  {
    q: 'Is this calculator a confirmed quote?',
    a: 'No. It is a guide to help you choose hours, or to understand a typical visit. The published from prices are from £23/hour for regular domestic cleaning, from £27/hour for a deep clean, and from £179 for end of tenancy cleaning. Add-ons and the exact total are shown in the live booking form before you confirm.'
  },
  {
    q: 'Is oven cleaning included?',
    a: 'Cleaning inside the oven is an optional add-on, not a standalone oven-cleaning service. A regular domestic visit includes wiping the oven exterior and control panel. On a deep clean or an end of tenancy clean you choose your oven type when you book — including no oven cleaning if you do not need it — and the booking form shows the price before you confirm.'
  },
  {
    q: 'Do you clean inside the fridge and the inside of the windows?',
    a: 'An end of tenancy clean includes the fridge and freezer (please switch them off so they can be defrosted) and the inside of the windows and other internal glass. Outside windows are not included. A regular domestic visit includes the fridge exterior. On a deep clean, the fridge and freezer are cleaned inside if they are empty or you can make room. Tell us what you would like included when you book.'
  },
  {
    q: 'How many cleaners will come?',
    a: 'On an end of tenancy clean, a furnished home always gets at least two cleaners, because furniture has to be moved. An empty one or two bedroom flat with one bathroom can be done by one cleaner working a longer day. Two or three bedroom homes usually get two cleaners, sometimes three for a larger home, and four bedrooms or more usually three. For a regular or deep clean you choose the total hours on the booking form (3-hour minimum); one cleaner is typical for a regular visit.'
  }
];

module.exports = {
  PUBLISHED,
  PUBLISHED_LABEL,
  TITLE,
  H1,
  META_DESCRIPTION,
  PATH,
  HONESTY_NOTE,
  ADDON_NOTE,
  BOOK_SLUG,
  PRICE_LABELS,
  rateInputs,
  DEFAULT_STATE,
  faqs
};
