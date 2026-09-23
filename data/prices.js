// "From" prices shown on the service cards, taken from the SN Cleaning
// Services domestic price list. Hourly rates are per cleaner per hour.
// Services not listed here simply show no price.
const FROM_PRICES = {
  'domestic-cleaning': 'From £22/hour',
  'residential-cleaning': 'From £22/hour',
  'deep-house-cleaning': 'From £23/hour',
  'end-of-tenancy-cleaning': 'From £179',
  'carpet-cleaning-services': 'From £20',
  'upholstery-cleaning': 'From £12',
  'mattress-cleaning': 'From £39'
};

function servicePrice(slug) {
  return FROM_PRICES[slug] || null;
}

module.exports = { FROM_PRICES, servicePrice };
