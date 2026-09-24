// Service page content (views/service-v2.ejs). One entry per service slug.
// Only true, confirmed claims go here. Prices come from the SN Cleaning
// Services price list (data/prices.js holds the short "From" prices).
//
// Fields: page copy (h1, lead, tiles, steps, final CTA), SEO (metaTitle,
// metaDescription), guide (long-form, service-specific sections with
// question headings), prices (tables) and extraFaqs (added to the page's
// FAQs from the database, and to the FAQPage structured data).
const COPY = {
  'domestic-cleaning': {
    h1: 'Domestic cleaning, done <em>properly</em>',
    lead: 'Regular or one-off cleaning for your home by our own trained, insured and DBS-checked team. We bring professional products and equipment, and work to a checklist for every room.',
    tilesEyebrow: 'Your schedule',
    tilesTitle: 'A clean home, as often as you need it',
    tilesIntro: "Book a regular visit and we'll send the same cleaner wherever we can, so they get to know your home. Or book a one-off clean before guests arrive, after a busy few weeks, or whenever you need a hand.",
    tiles: [
      ['Weekly', 'Your home stays on top, every week'],
      ['Fortnightly', 'Regular help without the weekly commitment'],
      ['Monthly', 'A thorough reset once a month'],
      ['One-off', 'Whenever you need a hand']
    ],
    stepsTitle: 'Booked in a few minutes',
    steps: [
      ['Tell us about your home', "Your postcode, the number of rooms and how often you'd like us to come."],
      ['See your price, pick a date', 'The booking form works out your price as you go. No hidden add-ons later.'],
      ['Come home to a clean house', 'Your cleaner arrives with everything needed and follows the checklist.']
    ],
    reviewMatch: /regular|weekly|clean/i,
    finalTitle: 'Ready for a cleaner home?',
    finalText: 'Tell us about your home, see your price and choose a date that suits you.'
  },
  'end-of-tenancy-cleaning': {
    h1: 'End of tenancy cleaning, <em>ready for inspection</em>',
    lead: 'We clean the whole property to the checklist letting agents and inventory clerks inspect against — inside the oven, limescale, skirting boards and all — so you can hand back the keys with confidence.',
    tilesEyebrow: 'Who we clean for',
    tilesTitle: 'Moving out, moving in, or between tenants',
    tilesIntro: 'Agents check the same things every time: the oven, limescale in the bathroom, skirting boards, marks on walls and doors. We pay extra attention to all of them, and we work to your moving day.',
    tiles: [
      ['Tenants', 'Moving out and want to hand back the keys with confidence'],
      ['Landlords', 'Getting the property ready for the next tenant'],
      ['Letting agents', 'A reliable team for check-outs and changeovers'],
      ['Moving in', 'A fresh, clean start in your new home']
    ],
    stepsTitle: 'From quote to keys handed back',
    steps: [
      ['Tell us about the property', 'Your postcode, the number of bedrooms and bathrooms, and any extras like carpets.'],
      ['See your price, pick your date', 'The booking form works out your price as you go. We work to your moving day.'],
      ['Hand back the keys', 'We clean every room to the inspection checklist, so the property is ready for check-out.']
    ],
    reviewMatch: /tenancy/i,
    finalTitle: 'Moving out soon?',
    finalText: 'Tell us about the property, see your price and book the clean for your moving day.'
  },
  'airbnb-cleaning': {
    h1: 'Airbnb cleaning, <em>guest-ready</em> every time',
    lead: 'Turnovers between check-out and the next check-in by our own trained, insured team. Beds made, bathroom and kitchen reset, so your listing looks the way your photos promise.',
    tilesEyebrow: 'Every turnover',
    tilesTitle: 'Everything a changeover needs',
    tilesIntro: 'Tell us your usual guest schedule and we build the clean around it, including same-day check-out to check-in turnarounds.',
    tiles: [
      ['Same-day turnovers', 'Worked around your check-out and check-in times'],
      ['Linen & towels', 'Beds made hotel-style and fresh towels laid out'],
      ['Guest essentials', 'Toilet roll, toiletries, tea and coffee restocked on request'],
      ['Anything to report', 'We let you know about damage or items guests left behind']
    ],
    stepsTitle: 'Set up in a few minutes',
    steps: [
      ['Tell us about the listing', 'Your postcode, the size of the property and how often guests change over.'],
      ['See your price, pick a date', 'The booking form works out your price as you go. No hidden add-ons later.'],
      ['Welcome your next guests', 'The property is cleaned, reset and ready for check-in.']
    ],
    reviewMatch: /airbnb|guest|host/i,
    finalTitle: 'Next guests arriving soon?',
    finalText: 'Tell us about the property, see your price and book the turnover.'
  },
  'deep-house-cleaning': {
    h1: 'Deep cleaning that gets <em>underneath</em>',
    lead: 'A top-to-bottom clean of everything a regular clean doesn’t reach: inside the oven, grout and tiles, skirting boards and behind furniture. Done by our own trained team with professional products.',
    tilesEyebrow: 'When to book',
    tilesTitle: 'A proper reset for your home',
    tilesIntro: 'You can book a deep clean for the whole home or just the rooms that need it most. Kitchens and bathrooms are the most popular.',
    tiles: [
      ['Before an event', 'Guests coming, a party or a family visit'],
      ['After a busy spell', 'When it’s been a while since the last proper clean'],
      ['New season', 'A spring or autumn reset for the whole home'],
      ['Before regular cleans', 'A fresh starting point to keep on top of']
    ],
    stepsTitle: 'Getting your deep clean booked',
    steps: [
      ['Tell us what you need', 'Your postcode, the rooms and anything that needs extra attention.'],
      ['Get your price', 'We look at the job you describe and send you a quote.'],
      ['We clean it properly', 'Our team arrives with everything needed and works through the checklist.']
    ],
    reviewMatch: /deep/i,
    finalTitle: 'Ready for a proper reset?',
    finalText: 'Tell us about your home and what needs doing, and we’ll send you a price.'
  },
  'after-builders-cleaning': {
    h1: 'After builders cleaning, <em>ready to move in</em>',
    lead: 'Building work leaves fine dust on every surface. We clean it away from floors, walls, skirting, fittings, windows and cupboards, so the space is ready to live in or hand over.',
    tilesEyebrow: 'Who we clean for',
    tilesTitle: 'After renovations, refits and new builds',
    tilesIntro: 'We clear general debris and packaging as part of the clean, and with notice we work to your handover, move-in or completion date.',
    tiles: [
      ['Homeowners', 'After a renovation, extension or new kitchen'],
      ['Landlords', 'Ready for new tenants after works'],
      ['Builders & developers', 'A clean finish before handover'],
      ['Fixed deadlines', 'Booked around your completion date']
    ],
    stepsTitle: 'Getting your clean booked',
    steps: [
      ['Tell us about the job', 'Your postcode, the size of the property and the work that was done.'],
      ['Get your price', 'We look at the job you describe and send you a quote.'],
      ['Move in or hand over', 'Every room cleaned and checked before we leave.']
    ],
    reviewMatch: /builder|renovat/i,
    finalTitle: 'Building work finished?',
    finalText: 'Tell us about the property and the work done, and we’ll send you a price.'
  },
  'carpet-cleaning-services': {
    includedTitle: 'Every step of the clean, done properly',
    h1: 'Carpet cleaning that goes <em>deeper</em>',
    lead: 'Professional equipment lifts dirt from deep in the fibres, not just the surface. We check each carpet first, treat stains before the clean and use a fast-dry method.',
    tilesEyebrow: 'Popular for',
    tilesTitle: 'Fresh carpets, room by room',
    tilesIntro: 'Book one room or the whole property. Carpet cleaning is often added to an end of tenancy or deep clean, but works just as well on its own.',
    tiles: [
      ['End of tenancy', 'Carpets ready for the check-out inspection'],
      ['Homes with pets', 'Lifts dirt, hair and odours from the fibres'],
      ['Rentals', 'Between tenants, ready for the next move-in'],
      ['Rugs', 'Rugs and runners as well as fitted carpet']
    ],
    stepsTitle: 'Booked in a few minutes',
    steps: [
      ['Tell us what needs cleaning', 'Your postcode and the rooms, rugs or items you need doing.'],
      ['See your price, pick a date', 'The booking form works out your price as you go. No hidden add-ons later.'],
      ['Enjoy fresher carpets', 'Fast-dry method, so most carpets can be walked on within a few hours.']
    ],
    reviewMatch: /carpet/i,
    finalTitle: 'Carpets need a refresh?',
    finalText: 'Tell us what needs cleaning, see your price and choose a date.'
  },
  'upholstery-cleaning': {
    includedTitle: 'Every step of the clean, done properly',
    h1: 'Upholstery cleaning for <em>sofas and chairs</em>',
    lead: 'We deep clean fabric sofas, armchairs and dining chairs with fabric-safe products, testing on a hidden area first so colours and textures stay as they are.',
    tilesEyebrow: 'What we clean',
    tilesTitle: 'Priced per item, so you only pay for what you need',
    tilesIntro: 'Book a single chair, a sofa or a whole suite. Upholstery, carpets and mattresses can all be done in one visit.',
    tiles: [
      ['Sofas', 'Two-seaters, three-seaters and corner sofas'],
      ['Armchairs', 'Single chairs and matching pairs'],
      ['Dining chairs', 'Fabric seats and backs'],
      ['Other fabric furniture', 'Ask us about delicate or antique pieces']
    ],
    stepsTitle: 'Booked in a few minutes',
    steps: [
      ['Tell us what needs cleaning', 'Your postcode and the pieces you’d like cleaned.'],
      ['See your price, pick a date', 'The booking form works out your price as you go. No hidden add-ons later.'],
      ['Sit back on a fresh sofa', 'Fast-dry method, so most pieces are ready to use within a few hours.']
    ],
    reviewMatch: /sofa|upholster/i,
    finalTitle: 'Sofa seen better days?',
    finalText: 'Tell us what needs cleaning, see your price and choose a date.'
  },
  'mattress-cleaning': {
    includedTitle: 'Every step of the clean, done properly',
    h1: 'Mattress cleaning for <em>a fresher bed</em>',
    lead: 'A deep, sanitising clean that treats stains and odours and targets dust mites, on both sides where the mattress can be turned.',
    tilesEyebrow: 'When to book',
    tilesTitle: 'The part of the bed that never gets washed',
    tilesIntro: 'Clean sheets sit on top of a mattress that builds up dust, sweat and spills over time. A professional clean once or twice a year keeps it fresh.',
    tiles: [
      ['Allergies', 'Targets dust mites and allergens'],
      ['Moving in or out', 'Often checked at end of tenancy inspections'],
      ['After a spill or illness', 'Stains and odours treated at the source'],
      ['Children’s beds', 'Products are safe for regular use once dry']
    ],
    stepsTitle: 'Booked in a few minutes',
    steps: [
      ['Tell us what needs cleaning', 'Your postcode and the size and number of mattresses.'],
      ['See your price, pick a date', 'The booking form works out your price as you go. No hidden add-ons later.'],
      ['Sleep on a fresher bed', 'Fast-dry method, so most mattresses are dry within a few hours.']
    ],
    reviewMatch: /mattress/i,
    finalTitle: 'Time for a fresher bed?',
    finalText: 'Tell us what needs cleaning, see your price and choose a date.'
  }
};

// SEO content (meta, guide, prices, extra FAQs) lives in data/service-seo.js.
const SEO = require('./service-seo');
Object.keys(SEO).forEach((slug) => { if (COPY[slug]) Object.assign(COPY[slug], SEO[slug]); });

module.exports = COPY;
