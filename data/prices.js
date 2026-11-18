// The ONLY prices shown anywhere on the site (Silvia, Sept 2026): one "from"
// price per service. Pages must not list other prices; customers get the
// exact price from the booking form (Get a quote). Hourly rates are per cleaner per hour.
// Services not listed here simply show no price.
const FROM_PRICES = {
  'domestic-cleaning': 'From £23/hour',
  'residential-cleaning': 'From £23/hour',
  'deep-house-cleaning': 'From £27/hour',
  'end-of-tenancy-cleaning': 'From £179',
  'after-builders-cleaning': 'From £179',
  'airbnb-cleaning': 'From £25/hour',
  'carpet-cleaning-services': 'From £49',
  'upholstery-cleaning': 'From £69',
  'mattress-cleaning': 'From £39'
};

// Short note shown next to the from price (Silvia, 18 Nov 2026): carpet,
// upholstery and mattress use the same machine, so one visit has a £120
// minimum and customers can combine items from all three to reach it.
const MACHINE_MINIMUM = 'Minimum visit charge £120. Combine carpets, sofas and mattresses to reach it.';
const PRICE_NOTES = {
  'carpet-cleaning-services': MACHINE_MINIMUM,
  'upholstery-cleaning': MACHINE_MINIMUM,
  'mattress-cleaning': MACHINE_MINIMUM
};

function servicePrice(slug) {
  return FROM_PRICES[slug] || null;
}

function priceNote(slug) {
  return PRICE_NOTES[slug] || null;
}

module.exports = { FROM_PRICES, PRICE_NOTES, servicePrice, priceNote };
