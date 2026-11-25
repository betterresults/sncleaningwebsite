// After builders cleaning prices page (/after-builders-cleaning/prices/), built 25 Nov 2026 at Silvia's request.
// Three ways to price (Silvia, 25 Nov 2026):
//   1. Empty home after the work: priced by size, the same grid as the Dilvon "After Builders Cleaning" form.
//   2. A lived in home where one part was renovated: a set number of hours.
//   3. Builders and developers, bigger homes or builders still on site: a number of cleaners for the day.
//   Hourly and daily work is £29 per cleaner per hour.
// The size grid, extra rooms, oven and extras are identical to the end of tenancy price list in Dilvon, so they are reused.
const eot = require('./eot-prices');

const hourlyRate = 29;
const fullDayHours = 8;

const methods = [
  {
    key: 'size',
    title: 'Empty home after the work',
    price: 'from £179',
    text: 'Nobody lives there yet and the work is finished. You pay for the size of the home and what it has, just like a move in clean: flat or house, bedrooms, bathrooms, furniture and the oven.'
  },
  {
    key: 'hours',
    title: 'One room or one area, while you live there',
    price: `£${hourlyRate} per cleaner per hour`,
    text: 'A new kitchen, a bathroom or a loft conversion in the home you live in. We agree the number of hours with you and send a cleaner to clean the areas the builders worked in.'
  },
  {
    key: 'day',
    title: 'Builders and developers: cleaners by the day',
    price: `£${hourlyRate * fullDayHours} per cleaner per day`,
    text: `Bigger homes, or builders still working on site. You book a number of cleaners for the day (${fullDayHours} hours each), and they clean as much as the day allows, starting with the areas the work touched.`
  }
];

// Real jobs (Dilvon bookings, completed and paid). Postcode district only; the client is not named.
const realJobs = [
  {
    area: 'Maldon, CM9',
    date: 'September 2026',
    title: 'Four bedroom house, two cleaners for a day',
    text: 'Four bedrooms, three bathrooms, a living room and a dining room after building work. Two cleaners spent the day on the entrance, stairs, toilets, bathrooms and the top floor rooms where the builders had worked, then dusted and did the floors in the rooms that had been closed off.',
    price: 464
  },
  {
    area: 'Ingatestone, CM4',
    date: 'November 2026',
    title: 'Large house, one cleaner for a day',
    text: 'The builder had no cleaning in the job, but could not hand the home back dusty. One cleaner spent the day dusting and cleaning the areas the work had reached.',
    price: 232
  }
];

const faqs = [
  { q: 'Which way of pricing is right for my after builders clean?', a: 'If the home is empty and the work is finished, the price by size is usually best, because everything is cleaned top to bottom for a set price. If you live there and only one room or area was done, book a few hours. If you are a builder or developer, or the builders are still on site, book cleaners by the day.' },
  { q: 'How much is an after builders clean per hour?', a: `£${hourlyRate} per cleaner per hour. A full day of ${fullDayHours} hours is £${hourlyRate * fullDayHours} for one cleaner and £${hourlyRate * fullDayHours * 2} for two.` },
  { q: 'Can you clean while the builders are still working?', a: 'Yes. Book cleaners by the day and they work around the trades, starting with the finished areas.' },
  { q: 'Do builders and developers book you for their clients?', a: "Yes. Many builders don't include cleaning in their quote to keep the price down, but still want to hand the home back clean. Booking one or two cleaners for a day lets them do that for a fraction of a full clean." },
  { q: 'What is included in an after builders clean?', a: 'Building dust removed from walls, skirting boards, light fittings, vents and sills, kitchen and bathroom fixtures, cabinets and drawers cleaned inside and out, floors vacuumed and mopped, internal windows and frames cleaned, and paint splashes and tape residue removed where possible.' },
  { q: 'Is waste removal included?', a: 'Packaging and small debris are cleared. Larger waste can be added: household waste £89, or a small van load £169.' },
  { q: 'What if something is missed?', a: 'Tell us through your account or on WhatsApp. For an empty home you have 7 days, and for a home people live in 24 hours, and we come back to clean it again at no extra cost.' },
  { q: 'Are the prices the same in London and Essex?', a: 'Yes. In London the Congestion Charge (if the home is in the zone) and any parking fees are added on top. In Essex we can usually find free parking.' },
  { q: 'Do your prices include VAT?', a: 'SN Cleaning Services is not VAT registered, so there is no VAT to add.' }
];

module.exports = {
  hourlyRate,
  fullDayHours,
  methods,
  realJobs,
  faqs,
  flats: eot.flats,
  houses: eot.houses,
  furnishing: eot.furnishing,
  extraRooms: eot.extraRooms,
  ovens: eot.ovens,
  extras: eot.extras
};
