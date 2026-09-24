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
  'airbnb-cleaning': 'From £24/hour',
  'carpet-cleaning-services': 'From £49'
  // upholstery-cleaning and mattress-cleaning: no "from" price shown (Get a price)
};

function servicePrice(slug) {
  return FROM_PRICES[slug] || null;
}

module.exports = { FROM_PRICES, servicePrice };
