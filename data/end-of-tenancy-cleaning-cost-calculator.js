// End of tenancy cleaning cost calculator (public page).
// Copy, FAQs, the default selection and the verified deposit-scheme figures.
// Every price is read from data/eot-prices.js. Do not copy the price matrix
// into this file. Estimator maths lives in
// public/js/end-of-tenancy-cleaning-cost-calculator.js (estimate). The route
// calls it for the first paint; the browser calls it again on each change.

const eot = require('./eot-prices');
const { PRICE_NOTES } = require('./prices');

const PUBLISHED = '2026-11-26';
const PUBLISHED_LABEL = '26 November 2026';

// Layout appends " | SN Cleaning Services" when the result is 60 characters or
// under. Rendered <title> is the 53-character string with no prices.
const TITLE = 'End of Tenancy Cost Calculator';
const H1 = 'What will an end of tenancy clean cost?';
const META_DESCRIPTION = 'Estimate your end of tenancy cleaning cost in London or Essex from our published price list, then open the booking form.';

const PATH = '/end-of-tenancy-cleaning-cost-calculator/';

const HONESTY_NOTE = 'This is a guide estimate based on our published end of tenancy price list. The exact confirmed price is shown in the booking form before you confirm.';

const LONDON_NOTE = 'The same prices apply in London and Essex, and no VAT is added. In London the Congestion Charge, if the home is in the zone, and any parking fees are added on top. In Essex we can usually find free parking.';

const FRIDGE_NOTE = 'Included in a standard end of tenancy clean (£0 extra). Please empty and defrost before arrival.';

const GUARANTEE_RECLEAN = 'Tell us within 7 days, ideally with photos, and we come back and clean it again at no extra cost.';

const GUARANTEE_DEPOSIT = 'The deposit back guarantee covers everything related to the clean you booked.';

const HOURS_NOTE = 'Hours are for the whole team on site, not per cleaner.';

const OVEN_SHORT = {
  none: 'None',
  single: 'Single',
  double: 'Double',
  convection: 'Single + convection',
  range: 'Range',
  aga: 'AGA'
};

function gbp(n) {
  const pennies = Math.round(Number(n) * 100);
  if (!isFinite(pennies)) return '';
  if (pennies % 100 === 0) return '£' + String(pennies / 100);
  return '£' + (pennies / 100).toFixed(2);
}

function carpetGroup() {
  const group = eot.extras.find((g) => g.group.indexOf('Carpet cleaning') === 0);
  if (!group) throw new Error('End of tenancy price list has no carpet cleaning add-ons');
  return group;
}

function carpetKey(label) {
  return String(label).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function mustCarpet(label) {
  const item = carpetGroup().items.find((i) => i.label === label);
  if (!item) throw new Error('Missing carpet price: ' + label);
  return item.price;
}

function mustOven(key) {
  const item = eot.ovens.find((o) => o.key === key);
  if (!item) throw new Error('Missing oven price: ' + key);
  return item;
}

function machineAmount() {
  const note = PRICE_NOTES['carpet-cleaning-services'];
  const match = String(note || '').match(/£\d+(?:\.\d+)?/);
  if (!match) throw new Error('Published carpet machine minimum has no amount');
  return match[0];
}

const MACHINE_AMOUNT = machineAmount();

const CARPET_NOTE = carpetGroup().why + ' The ' + MACHINE_AMOUNT + ' minimum visit charge for a standalone carpet, upholstery or mattress visit does not apply when carpet cleaning is added to an end of tenancy clean.';

function catalogue() {
  const bath = eot.extraRooms.find((r) => r.label === 'Extra bathroom');
  if (!bath) throw new Error('End of tenancy price list has no extra bathroom rate');
  return {
    flats: eot.flats.map((r) => ({ key: r.key, beds: r.beds, label: r.label, prices: r.prices.slice() })),
    houses: eot.houses.map((r) => ({ key: r.key, beds: r.beds, label: r.label, prices: r.prices.slice() })),
    furnishing: eot.furnishing.slice(),
    extraBathroom: bath.prices.slice(),
    ovens: eot.ovens.map((o) => ({
      key: o.key,
      label: o.label,
      short: OVEN_SHORT[o.key] || o.label,
      price: o.price,
      priceLabel: gbp(o.price)
    })),
    carpets: carpetGroup().items.map((i) => ({
      key: carpetKey(i.label),
      label: i.label,
      price: i.price,
      priceLabel: gbp(i.price)
    })),
    timeGuide: eot.timeGuide.map((row) => ({ home: row.home, team: row.team, hours: row.hours }))
  };
}

// First paint, and the checked controls in the template.
const DEFAULT_STATE = {
  property: 'flat',
  bedrooms: '2',
  bathrooms: '1',
  furnishing: '0',
  oven: 'none',
  carpets: {}
};

const singleOven = mustOven('single');
const doubleOven = mustOven('double');
const convectionOven = mustOven('convection');
const rangeOven = mustOven('range');
const agaOven = mustOven('aga');

const faqs = [
  {
    q: 'Is this a confirmed quote?',
    a: 'No. It is a guide estimate based on our published end of tenancy price list. The booking form shows the exact confirmed price before you book. There is no VAT to add, and the same prices apply in London and Essex. In London the Congestion Charge, if the home is in the zone, and any parking fees are added on top.'
  },
  {
    q: 'Is the fridge and freezer an extra?',
    a: 'No. The fridge and freezer are included in a standard end of tenancy clean at no extra charge. Please empty them and defrost them before we arrive. There is no separate fridge add-on.'
  },
  {
    q: 'Is oven cleaning a standalone service?',
    a: 'No. You choose an oven type as part of the end of tenancy clean, or no oven if the home does not need one. It is not a standalone oven-cleaning service. A single oven is ' + gbp(singleOven.price) + ', a double oven is ' + gbp(doubleOven.price) + ', a single and convection oven is ' + gbp(convectionOven.price) + ', a range is ' + gbp(rangeOven.price) + ' and an AGA is ' + gbp(agaOven.price) + '.'
  },
  {
    q: 'Is professional carpet cleaning included?',
    a: 'Carpets are vacuumed as standard. Professional carpet cleaning is optional. Added to an end of tenancy clean, a double bedroom is ' + gbp(mustCarpet('Double bedroom')) + ', a living room is ' + gbp(mustCarpet('Living room')) + ', a staircase is ' + gbp(mustCarpet('Staircase')) + ' and a hallway is ' + gbp(mustCarpet('Hallway')) + '. A standalone carpet, upholstery or mattress visit has a minimum visit charge of ' + MACHINE_AMOUNT + '. That minimum does not apply when carpet cleaning is added to an end of tenancy clean.'
  },
  {
    q: 'Can a landlord require a professional clean?',
    a: 'No. GOV.UK guidance on the Tenant Fees Act 2019 says a landlord cannot require a professional clean by default. The property has to be returned to the same standard of cleanliness as at check-in, fair wear and tear excepted. Cleaning is still the issue that comes up most often. The DPS says 29.38% of 2025 deposit claims involved cleaning, the top cause for five years running. TDS, in its 2024/25 statistical briefing, says cleaning featured in 54% of its insured dispute cases. Those figures are from separate schemes and are not one combined number.'
  }
];

// Official figures only. Each scheme stays separate. Do not average them, and
// do not invent a typical cleaning deduction in pounds. None of these sources
// publishes one.
const deposit = {
  heading: 'Why cleaning is the #1 UK tenancy deposit dispute',
  intro: 'Cleaning is the issue that comes up most often when a UK tenancy deposit is disputed. Each scheme publishes its own figures. They are kept separate here, and this page does not turn them into one average or into a typical deduction in pounds.',
  schemes: [
    {
      id: 'tds',
      kicker: 'TDS Statistical Briefing 2024/25',
      period: 'Year to March 2025, England and Wales',
      stat: '54%',
      caption: 'of TDS Insured dispute cases included cleaning',
      facts: [
        'Average protected deposit in England and Wales: £1,175',
        'Across 4,706,470 protected deposits',
        '1.00% went to adjudication'
      ],
      rows: [
        { label: 'Cleaning', value: '54%' },
        { label: 'Damage', value: '49%' },
        { label: 'Redecoration', value: '31%' },
        { label: 'Gardening', value: '14%' },
        { label: 'Rent arrears', value: '10%' }
      ],
      rowsTitle: 'TDS Insured dispute cases, Table 9. These heads overlap, so a case can count under more than one.',
      note: '',
      sourceName: 'TDS Statistical Briefing 2024/25 (PDF)',
      url: 'https://7fb334f1-4cb2-487c-a4bf-6cbf5bf762cb.usrfiles.com/ugd/7fb334_0e2b37ea7946459b93512a57d5904ca0.pdf'
    },
    {
      id: 'dps',
      kicker: 'The DPS',
      period: 'Official release, 11 June 2026',
      stat: '29.38%',
      caption: 'of 2025 DPS deposit claims involved cleaning',
      facts: [
        'Top cause for the fifth year running',
        'Up from 24.57% in 2021'
      ],
      rows: [
        { label: 'Cleaning', value: '29.38%' },
        { label: 'Damage', value: '18.42%' },
        { label: 'Rent arrears', value: '16.45%' },
        { label: 'Redecoration', value: '10.88%' }
      ],
      rowsTitle: 'Share of 2025 DPS deposit claims',
      note: '',
      sourceName: 'The DPS, 11 June 2026',
      url: 'https://www.depositprotection.com/news-insights/cleaning-main-cause-of-tenancy-deposit-deductions-for-a-fifth-year-running'
    },
    {
      id: 'mydeposits',
      kicker: 'mydeposits',
      period: 'Official guide for deposit deductions',
      stat: '',
      caption: '',
      quote: 'Around 30% of all cases deal with an aspect of cleaning.',
      facts: [],
      rows: [],
      rowsTitle: '',
      note: "This is mydeposits' own wording. It is not a figure calculated from the TDS or DPS numbers above.",
      sourceName: 'mydeposits: rules of claiming for deposit deductions',
      url: 'https://www.mydeposits.co.uk/content-hub/rules-of-claiming-for-deposit-deductions/'
    }
  ],
  law: {
    kicker: 'GOV.UK',
    title: 'A landlord cannot require a professional clean by default',
    text: 'Under the Tenant Fees Act 2019 guidance, a landlord cannot require a professional clean by default. The property has to be returned to the same standard of cleanliness as at check-in, fair wear and tear excepted.',
    sourceName: 'GOV.UK Tenant Fees Act 2019 guidance',
    url: 'https://www.gov.uk/government/publications/tenant-fees-act-2019-guidance'
  }
};

const RENDERED_TITLE = TITLE + ' | SN Cleaning Services';
if (RENDERED_TITLE.length > 60) throw new Error('Calculator title renders over 60 characters');
if (TITLE.indexOf('£') !== -1 || META_DESCRIPTION.indexOf('£') !== -1) throw new Error('Title or meta description contains a price');
if (META_DESCRIPTION.length > 155) throw new Error('Meta description is over 155 characters');
if (faqs.length !== 5) throw new Error('Calculator page needs exactly 5 FAQs');

module.exports = {
  PUBLISHED,
  PUBLISHED_LABEL,
  TITLE,
  H1,
  META_DESCRIPTION,
  PATH,
  HONESTY_NOTE,
  LONDON_NOTE,
  FRIDGE_NOTE,
  GUARANTEE_RECLEAN,
  GUARANTEE_DEPOSIT,
  HOURS_NOTE,
  CARPET_NOTE,
  MACHINE_AMOUNT,
  gbp,
  catalogue,
  DEFAULT_STATE,
  faqs,
  deposit
};
