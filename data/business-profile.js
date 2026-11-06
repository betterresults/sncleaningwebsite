// Business facts used in the structured data (schema) on every page.
// Keep these in step with the Google Business Profile: the agent re-checks the
// review count on Google Maps and updates it here when it changes.
module.exports = {
  // Office shown on the contact page and the Google Business Profile
  address: {
    streetAddress: '15A Shenfield Road',
    addressLocality: 'Brentwood',
    addressRegion: 'Essex',
    postalCode: 'CM15 8AG',
    addressCountry: 'GB'
  },
  // Map pin of the Google Business Profile listing
  geo: { latitude: 51.6219825, longitude: 0.3067626 },
  googleMapsUrl: 'https://maps.google.com/?cid=16363345078455134139',
  // Same hours as the site footer (site_settings.hours_note)
  openingHours: [
    { days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'], opens: '07:00', closes: '22:00' },
    { days: ['Saturday', 'Sunday'], opens: '08:00', closes: '17:00' }
  ],
  // Google rating as shown on Google Maps (checked 6 Nov 2026: 5.0 from 19 reviews)
  googleRating: { ratingValue: 5, reviewCount: 19, checked: '2026-11-06' },
  description:
    'SN Cleaning Services is a domestic cleaning company based in Brentwood, Essex, run by Silvia Nedeva. Our own trained, insured and DBS checked teams do end of tenancy, deep, regular, Airbnb, after builders and carpet cleaning across London and Essex.',
  founder: {
    name: 'Silvia Nedeva',
    jobTitle: 'Cleaning specialist',
    image: '/images/silvia.webp',
    url: '/about/',
    // Silvia's own profiles (given by Silvia, 6 Nov 2026)
    sameAs: [
      'https://www.linkedin.com/in/silvia-nedeva/',
      'https://www.facebook.com/silvia.ivanova.nedeva/',
      'https://www.instagram.com/silvinedeva/',
      'https://www.tiktok.com/@silvinedeva'
    ]
  },
  // Other profiles of the business (Facebook, Instagram, Trustpilot, Yell...) go here as they are created
  sameAs: []
};
