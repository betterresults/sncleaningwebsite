// End of tenancy prices page (/end-of-tenancy-cleaning/prices/), built 24 Nov 2026 at Silvia's request.
// This is the ONE page allowed to show prices per property size and per extra (every other page shows only "from £179").
// Prices are copied from the live Dilvon price list (get_booking_forms_and_pricing, service "End Of Tenancy Cleaning").
// When Dilvon prices change, update this file, then regenerate the PDF with scripts/eot-price-pdf.py.
// Times, team sizes and the pricing explanation come from Silvia (24 Nov 2026). Do not add facts she has not given.

// The only date to change when these prices are refreshed. The "Prices last updated" line
// and this page's WebPage dateModified both read it. Use a full ISO date (YYYY-MM-DD).
const PRICES_LAST_UPDATED = '2026-11-24';

function pricesUpdatedLabel(iso) {
  const [year, month] = iso.split('-').map(Number);
  const monthName = new Intl.DateTimeFormat('en-GB', { month: 'long', timeZone: 'UTC' }).format(new Date(Date.UTC(year, month - 1, 1)));
  return `${monthName} ${year}`;
}


// [unfurnished, part furnished, furnished]
const flats = [
  { key: 'studio', label: 'Studio flat', beds: 0, prices: [179, 199, 215] },
  { key: 'flat-1', label: '1 bedroom flat', beds: 1, prices: [205, 225, 245] },
  { key: 'flat-2', label: '2 bedroom flat', beds: 2, prices: [229, 249, 275] },
  { key: 'flat-3', label: '3 bedroom flat', beds: 3, prices: [275, 299, 329] },
  { key: 'flat-4', label: '4 bedroom flat', beds: 4, prices: [319, 349, 385] },
  { key: 'flat-5', label: '5 bedroom flat', beds: 5, prices: [359, 395, 429] },
  { key: 'flat-6', label: '6 bedroom flat', beds: 6, prices: [399, 439, 479] }
];
const houses = [
  { key: 'house-1', label: '1 bedroom house', beds: 1, prices: [229, 249, 275] },
  { key: 'house-2', label: '2 bedroom house', beds: 2, prices: [259, 285, 309] },
  { key: 'house-3', label: '3 bedroom house', beds: 3, prices: [305, 335, 365] },
  { key: 'house-4', label: '4 bedroom house', beds: 4, prices: [349, 385, 439] },
  { key: 'house-5', label: '5 bedroom house', beds: 5, prices: [385, 425, 489] },
  { key: 'house-6', label: '6 bedroom house', beds: 6, prices: [429, 469, 545] }
];

const furnishing = ['Unfurnished', 'Part furnished', 'Furnished'];

// Same flats and houses the AggregateOffer uses for lowPrice and highPrice (extras are not included).
function baseOfferExtremes() {
  let low = null;
  let high = null;
  for (const row of [...flats, ...houses]) {
    row.prices.forEach((price, furnIndex) => {
      const item = { price, row, furnIndex };
      if (!low || price < low.price) low = item;
      if (!high || price > high.price) high = item;
    });
  }
  return { low, high };
}

function gbp(n) {
  return '£' + (Number.isInteger(n) ? n : n.toFixed(2));
}

// "an empty studio flat" / "the largest furnished home" when the extremes are those homes.
function lowHomePhrase(item) {
  if (item.row.key === 'studio' && item.furnIndex === 0) return 'an empty studio flat';
  return `a ${furnishing[item.furnIndex].toLowerCase()} ${item.row.label.toLowerCase()}`;
}

function highHomePhrase(item) {
  const maxBeds = Math.max(...[...flats, ...houses].map((row) => row.beds));
  if (item.furnIndex === furnishing.length - 1 && item.row.beds === maxBeds && item.row.key.startsWith('house')) {
    return 'the largest furnished home';
  }
  return `a ${furnishing[item.furnIndex].toLowerCase()} ${item.row.label.toLowerCase()}`;
}

const extremes = baseOfferExtremes();
const PRICE_LOW = extremes.low.price;
const PRICE_HIGH = extremes.high.price;
const priceAnswer = `End of tenancy cleaning in London and Essex costs from ${gbp(PRICE_LOW)} for ${lowHomePhrase(extremes.low)} to ${gbp(PRICE_HIGH)} for ${highHomePhrase(extremes.high)}. The same prices apply across London and Essex, with no VAT added.`;

// Extra rooms, by furnishing [unfurnished, part furnished, furnished]
const extraRooms = [
  { label: 'Extra bathroom', prices: [35, 38.5, 42] },
  { label: 'Extra toilet', prices: [18, 19.8, 21.6] },
  { label: 'Extra living room', prices: [35, 38.5, 42] },
  { label: 'Dining room', prices: [35, 38.5, 42] },
  { label: 'Study', prices: [26, 28.6, 31.2] },
  { label: 'Utility room', prices: [26, 28.6, 31.2] },
  { label: 'Conservatory', prices: [62, 68.2, 74.4] },
  { label: 'Any other room', prices: [32, 35.2, 38.4] }
];

const ovens = [
  { key: 'none', label: 'No oven to clean', price: 0 },
  { key: 'single', label: 'Single oven', price: 49 },
  { key: 'double', label: 'Double oven', price: 79 },
  { key: 'convection', label: 'Single and convection oven', price: 79 },
  { key: 'range', label: 'Range oven', price: 98 },
  { key: 'aga', label: 'AGA', price: 129 }
];

const extras = [
  {
    group: 'Blinds and shutters (each)',
    why: 'Not every home has them, and each one is cleaned slat by slat, which takes real time. So you only pay for the ones you have.',
    items: [
      { label: 'Small blind or shutter', price: 8 },
      { label: 'Medium blind or shutter', price: 12 },
      { label: 'Large blind or shutter', price: 15 }
    ]
  },
  {
    group: 'Outside the main rooms',
    items: [
      { label: 'Balcony', price: 35 },
      { label: 'Garage', price: 49 }
    ]
  },
  {
    group: 'Waste removal',
    why: 'For anything left behind that the landlord expects gone.',
    items: [
      { label: 'Household waste', price: 89 },
      { label: 'Small van load', price: 169 }
    ]
  },
  {
    group: 'Carpet cleaning, added to your end of tenancy clean',
    why: 'Carpets are vacuumed as standard. If your agent asks for professional carpet cleaning, these are the prices when it is booked together with the end of tenancy clean.',
    items: [
      { label: 'Single bedroom', price: 45 },
      { label: 'Double bedroom', price: 59 },
      { label: 'Master bedroom', price: 79 },
      { label: 'Living room', price: 79 },
      { label: 'Dining room', price: 69 },
      { label: 'Staircase', price: 49 },
      { label: 'Hallway', price: 20 },
      { label: 'Small or medium rug', price: 29 },
      { label: 'Large rug', price: 59 }
    ]
  },
  {
    group: 'Sofas and soft furnishings',
    items: [
      { label: '2 seater sofa', price: 69 },
      { label: '3 seater sofa', price: 89 },
      { label: 'Corner sofa', price: 119 },
      { label: 'Armchair', price: 29 },
      { label: 'Dining chair', price: 12 },
      { label: 'Ottoman', price: 29 },
      { label: 'Headboard', price: 25 },
      { label: 'Curtains, half length', price: 29 },
      { label: 'Curtains, full length', price: 49 }
    ]
  },
  {
    group: 'Mattresses',
    items: [
      { label: 'Single', price: 39 },
      { label: 'Double', price: 49 },
      { label: 'King', price: 59 },
      { label: 'Super king', price: 69 }
    ]
  }
];

const sameDaySunday = 50;

// One short answer per home size (Silvia, 24 Nov 2026: two prices, unfurnished and furnished).
const sizeAnswers = [
  { key: 'studio', q: 'How much is an end of tenancy clean for a studio flat?', a: "£179 if it's empty and £215 if it's furnished. Furnished costs a bit more because the wardrobe, drawers and bed are cleaned inside and underneath too." },
  { key: 'flat-1', q: 'How much is an end of tenancy clean for a one bedroom flat?', a: '£205 unfurnished and £245 furnished. One and two bedroom flats are the homes we clean most.' },
  { key: 'flat-2', q: 'How much is an end of tenancy clean for a two bedroom flat?', a: '£229 unfurnished and £275 furnished. A second bathroom is £35 more, or £42 if the flat is furnished.' },
  { key: 'flat-3', q: 'How much is an end of tenancy clean for a three bedroom flat?', a: '£275 unfurnished and £329 furnished. Furnished takes longer because every piece of furniture is cleaned inside, on top and underneath.' },
  { key: 'flat-4', q: 'How much is an end of tenancy clean for a four bedroom flat?', a: '£319 unfurnished and £385 furnished, for everything the letting agent will check.' },
  { key: 'flat-5', q: 'How much is an end of tenancy clean for a five or six bedroom flat?', a: 'A five bed flat is £359 unfurnished and £429 furnished. A six bed is £399 unfurnished and £479 furnished.' },
  { key: 'house-1', q: 'How much is an end of tenancy clean for a one bedroom house?', a: '£229 unfurnished and £275 furnished. A little more than a one bed flat, because a house has stairs and a landing and is usually bigger.' },
  { key: 'house-2', q: 'How much is an end of tenancy clean for a two bedroom house?', a: '£259 unfurnished and £309 furnished. A two bed house is bigger than a two bed flat, with stairs and a landing to clean.' },
  { key: 'house-3', q: 'How much is an end of tenancy clean for a three bedroom house?', a: "£305 unfurnished and £365 furnished. When we clean a house, it's most often a three bed like this. Many have a second bathroom or toilet, which is added on top." },
  { key: 'house-4', q: 'How much is an end of tenancy clean for a four bedroom house?', a: '£349 unfurnished and £439 furnished, with all products and equipment included.' },
  { key: 'house-5', q: 'How much is an end of tenancy clean for a five bedroom house?', a: '£385 unfurnished and £489 furnished, covering every room, the stairs and the landings.' },
  { key: 'house-6', q: 'How much is an end of tenancy clean for a six bedroom house?', a: '£429 unfurnished and £545 furnished, with the deposit back guarantee and the free 7 day re clean included.' }
];

// Time and team guide (Silvia, 24 Nov 2026). Hours are for the whole team on site, not per cleaner.
const timeGuide = [
  { home: 'Studio flat', team: '1 cleaner, or 2', hours: '4 to 5 hours alone, about 2.5 hours for two' },
  { home: '1 bedroom flat', team: '2 cleaners (1 if empty)', hours: '3 to 4 hours for two, 4 to 6 hours alone' },
  { home: '2 bedroom flat', team: '2 cleaners (1 if empty, one bathroom)', hours: '4 to 5 hours for two, 6 to 8 hours alone' },
  { home: '3 bedroom flat', team: '2 cleaners', hours: 'about 5 hours, 5.5 to 6 with a second bathroom' },
  { home: 'Houses', team: 'as the same size flat', hours: 'about half an hour to an hour longer than the flat' },
  { home: '4 bedrooms and more', team: 'usually 3 cleaners', hours: 'we confirm the time when you book' }
];

// Worked examples: the sum spelled out, so nothing is hidden.
const examples = [
  {
    title: 'Furnished 2 bedroom flat, single oven',
    lines: [['2 bedroom flat, furnished', 275], ['Single oven', 49]],
    note: 'One of the cleans we do most.'
  },
  {
    title: 'Empty 1 bedroom flat, nothing extra',
    lines: [['1 bedroom flat, unfurnished', 205]],
    note: 'The size and the furniture are the whole price.'
  },
  {
    title: 'Furnished 3 bedroom house, two bathrooms, double oven, 4 medium blinds',
    lines: [['3 bedroom house, furnished', 365], ['Second bathroom, furnished', 42], ['Double oven', 79], ['4 medium blinds', 48]],
    note: 'Each extra is only added because the home has it.'
  },
  {
    title: 'Unfurnished 2 bedroom flat, booked for a Sunday',
    lines: [['2 bedroom flat, unfurnished', 229], ['Sunday clean', 50]],
    note: 'Same day cleans are the same £50.'
  }
];

// Real jobs, already published on /our-work (postcode district only).
const realJobs = [
  { area: 'Enfield, EN3', date: '31 October 2026', text: 'Two bedrooms, two bathrooms, unfurnished, with an oven clean added. Just over 6 hours.' },
  { area: 'Shoeburyness, SS3', date: '6 October 2026', text: 'An empty property, just under 6 hours, with key collection arranged through us.' },
  { area: 'Woodford Green, IG8', date: '3 November 2026', text: 'A full day: 11.5 hours, with balcony cleaning and waste removal added.' }
];

const faqs = [
  { q: 'Is the oven included in an end of tenancy clean?', a: "Yes, we clean the oven as part of the service. You choose your oven type when you book because a single oven takes far less time than a double oven, a range or an AGA, and some homes don't need it at all. That way nobody pays for an oven they don't have: single £49, double £79, range £98, AGA £129." },
  { q: 'What is included in the price?', a: 'Everything inside the home, top to bottom: inside every kitchen cupboard and drawer, fridge and freezer, hob, extractor and microwave, bathrooms descaled, internal windows and glass, skirting boards, doors, switches and radiators, carpets vacuumed and hard floors washed. What you select when you book only tells us what your home has, so we can plan the time.' },
  { q: 'Are windows included?', a: 'Inside windows and all internal glass, yes. Outside windows are not included.' },
  { q: 'Why does a furnished property cost more?', a: 'Every wardrobe, chest of drawers, bed and sofa has to be cleaned inside, on top and underneath, and furniture has to be moved to clean behind it. That takes more time, so it costs more.' },
  { q: 'Why do you price everything separately?', a: "Because homes are different. If one tenant has blinds on every window, a double oven and two bathrooms, and another has none of that, it isn't fair for them to pay the same. You pay for the size of your home and for what we actually need to clean." },
  { q: 'Are the prices the same in London and Essex?', a: 'Yes, the prices are the same. In London the Congestion Charge (if the home is in the zone) and any parking fees are added on top. In Essex we can usually find free parking.' },
  { q: 'Do your prices include VAT?', a: 'SN Cleaning Services is not VAT registered, so there is no VAT to add. The price you see is the price you pay.' },
  { q: 'Do you charge more for same day or Sunday cleans?', a: 'Yes, £50 extra for a same day clean or a Sunday clean. Saturdays and weekdays are the normal price.' },
  { q: 'When do I pay?', a: 'You add your card when you book. 48 hours before the clean the amount is authorised on your card, and it is only charged once the job is completed.' },
  { q: 'Can you collect and return the keys?', a: 'Yes. Within one mile of the property it is free, up to three miles £15 and up to five miles £25. Further than that, get in touch first.' },
  { q: 'What if the agent says something is not clean enough?', a: 'Tell us through your account or on WhatsApp within 7 days, ideally with photos, and we come back and clean it again at no extra cost. Our deposit back guarantee covers everything related to the clean you booked.' },
  { q: 'Is professional carpet cleaning included?', a: "Carpets are vacuumed as standard. Professional carpet cleaning is separate, because not every home has carpets and not every agent asks for it. If yours does, add it when you book: from £45 for a single bedroom when it's done with your end of tenancy clean." },
  { q: 'Do I have to pay for a professional clean when I move out?', a: "No. Since the Tenant Fees Act 2019 a landlord in England can't make you pay for a professional clean. But you have to hand the home back as clean as it was at check in, allowing for fair wear and tear, or the landlord can claim cleaning costs from your deposit.", source: { name: 'GOV.UK Tenant Fees Act 2019 guidance', url: 'https://www.gov.uk/government/publications/tenant-fees-act-2019-guidance' } }
];

module.exports = {
  flats, houses, furnishing, extraRooms, ovens, extras, sameDaySunday, sizeAnswers, timeGuide, examples, realJobs, faqs,
  PRICES_LAST_UPDATED,
  pricesUpdatedLabel: pricesUpdatedLabel(PRICES_LAST_UPDATED),
  PRICE_LOW,
  PRICE_HIGH,
  priceAnswer
};
