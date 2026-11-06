// Builds schema.org JSON-LD blocks from the same content already stored in
// Supabase (or site_settings) — nothing here is separately authored per page,
// it's all derived from fields that already exist for another reason.
const { SITE_URL } = require('./site-config');

function absoluteUrl(pathOrUrl) {
  if (!pathOrUrl) return null;
  if (pathOrUrl.startsWith('http')) return pathOrUrl;
  // Page paths get a trailing slash (the live URL); files (/images/x.jpg) don't.
  const path = pathOrUrl === '/' || /\.[a-z0-9]+$/i.test(pathOrUrl) || pathOrUrl.includes('#') ? pathOrUrl : pathOrUrl.replace(/\/?$/, '/');
  return `${SITE_URL}${path}`;
}

const profile = require('../data/business-profile');
const { FROM_PRICES } = require('../data/prices');

const BUSINESS_ID = `${SITE_URL}/#business`;
const WEBSITE_ID = `${SITE_URL}/#website`;
const FOUNDER_ID = `${SITE_URL}/#silvia-nedeva`;

// "Essex - Brentwood" is how coverage_regions names Essex towns; schema gets the plain town name.
function placeFor(name) {
  const essex = /^Essex - /.test(name);
  const clean = String(name).replace(/^Essex - /, '').replace(/\s*\/.*$/, '').trim();
  return essex
    ? { '@type': 'City', name: clean, containedInPlace: { '@type': 'AdministrativeArea', name: 'Essex' } }
    : { '@type': 'AdministrativeArea', name: clean, containedInPlace: { '@type': 'City', name: 'London' } };
}

// "From £23/hour" -> Offer with a minimum price, per hour where the price is hourly.
function offerFor(slug, name, url) {
  const label = FROM_PRICES[slug];
  if (!label) return null;
  const m = label.match(/£(\d+(?:\.\d+)?)/);
  if (!m) return null;
  const hourly = /hour/i.test(label);
  const offer = {
    '@type': 'Offer',
    priceCurrency: 'GBP',
    price: m[1],
    priceSpecification: {
      '@type': hourly ? 'UnitPriceSpecification' : 'PriceSpecification',
      priceCurrency: 'GBP',
      minPrice: m[1],
      ...(hourly ? { unitCode: 'HUR', unitText: 'per hour' } : {})
    },
    availability: 'https://schema.org/InStock',
    seller: { '@id': BUSINESS_ID }
  };
  if (name) offer.name = name;
  if (url) offer.url = absoluteUrl(url);
  return offer;
}

function buildFounder() {
  const f = profile.founder;
  const person = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    '@id': FOUNDER_ID,
    name: f.name,
    jobTitle: f.jobTitle,
    url: absoluteUrl(f.url),
    image: absoluteUrl(f.image),
    worksFor: { '@id': BUSINESS_ID },
    knowsAbout: ['End of tenancy cleaning', 'Deep cleaning', 'Domestic cleaning', 'Airbnb cleaning', 'Carpet cleaning', 'After builders cleaning'],
    workLocation: { '@type': 'Place', name: 'Brentwood, Essex' }
  };
  if (f.sameAs && f.sameAs.length) person.sameAs = f.sameAs;
  return person;
}

function buildWebSite({ site }) {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': WEBSITE_ID,
    url: `${SITE_URL}/`,
    name: site.name,
    inLanguage: 'en-GB',
    publisher: { '@id': BUSINESS_ID }
  };
}

// The page itself: WebPage, or AboutPage / ContactPage where that is what it is.
function buildWebPage({ url, title, description, path, image }) {
  const type = /^\/about\/silvia-nedeva\/?$/.test(path)
    ? 'ProfilePage'
    : /^\/about\/?$/.test(path)
      ? 'AboutPage'
      : /^\/contact\/?$/.test(path)
        ? 'ContactPage'
        : 'WebPage';
  const page = {
    '@context': 'https://schema.org',
    '@type': type,
    '@id': `${url}#webpage`,
    url,
    name: title,
    isPartOf: { '@id': WEBSITE_ID },
    about: { '@id': BUSINESS_ID },
    inLanguage: 'en-GB'
  };
  if (description) page.description = description;
  if (image) page.primaryImageOfPage = { '@type': 'ImageObject', url: image };
  if (type === 'ProfilePage') page.mainEntity = { '@id': FOUNDER_ID };
  if (type === 'AboutPage') page.mainEntity = { '@id': BUSINESS_ID };
  return page;
}

// Sitewide business identity: included on every page so Google and AI tools
// build one consistent picture of the business wherever someone lands.
// Type: HomeAndConstructionBusiness, the schema.org LocalBusiness subtype for home services
// (schema.org has no cleaning company type; "HousekeepingService" is not a real type).
function buildLocalBusiness({ site, coverageAreas, services }) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'HomeAndConstructionBusiness',
    '@id': BUSINESS_ID,
    name: site.name,
    description: profile.description,
    url: `${SITE_URL}/`,
    logo: { '@type': 'ImageObject', url: absoluteUrl(site.logoUrl) },
    image: absoluteUrl(site.logoUrl),
    telephone: site.phone,
    email: site.email,
    address: { '@type': 'PostalAddress', ...profile.address },
    geo: { '@type': 'GeoCoordinates', ...profile.geo },
    hasMap: profile.googleMapsUrl,
    openingHoursSpecification: profile.openingHours.map((h) => ({
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: h.days,
      opens: h.opens,
      closes: h.closes
    })),
    priceRange: '££',
    currenciesAccepted: 'GBP',
    employee: { '@id': FOUNDER_ID },
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'customer service',
      telephone: site.phone,
      email: site.email,
      areaServed: 'GB',
      availableLanguage: 'English'
    },
    knowsAbout: ['End of tenancy cleaning', 'Deep cleaning', 'Domestic cleaning', 'Airbnb cleaning', 'Carpet cleaning', 'After builders cleaning', 'Upholstery cleaning', 'Mattress cleaning']
  };

  if (profile.googleRating && profile.googleRating.reviewCount) {
    schema.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: profile.googleRating.ratingValue,
      reviewCount: profile.googleRating.reviewCount,
      bestRating: 5,
      worstRating: 1
    };
  }

  if (coverageAreas && coverageAreas.length) {
    schema.areaServed = coverageAreas.map(placeFor);
  }

  if (services && services.length) {
    schema.hasOfferCatalog = {
      '@type': 'OfferCatalog',
      name: 'Cleaning services',
      itemListElement: services
        .map((s) => {
          const offer = offerFor(s.slug, s.title, `/${s.slug}`) || { '@type': 'Offer', url: absoluteUrl(`/${s.slug}`) };
          offer.itemOffered = { '@type': 'Service', name: s.title, url: absoluteUrl(`/${s.slug}`) };
          return offer;
        })
    };
  }

  const sameAs = [
    site.social && site.social.facebook,
    site.social && site.social.instagram,
    profile.googleMapsUrl,
    site.googleBusinessUrl,
    ...(profile.sameAs || [])
  ].filter(Boolean);
  if (sameAs.length) schema.sameAs = [...new Set(sameAs)];

  return schema;
}

// Real Google reviews shown on a page, marked up as reviews of the business.
function buildReviews(reviews) {
  if (!reviews || !reviews.length) return null;
  return {
    '@context': 'https://schema.org',
    '@type': 'HomeAndConstructionBusiness',
    '@id': BUSINESS_ID,
    name: 'SN Cleaning Services',
    url: `${SITE_URL}/`,
    image: absoluteUrl('/images/logo.png'),
    telephone: '020 3835 5033',
    address: { '@type': 'PostalAddress', ...profile.address },
    review: reviews.map((t) => ({
      '@type': 'Review',
      author: { '@type': 'Person', name: t.name },
      reviewRating: { '@type': 'Rating', ratingValue: t.rating, bestRating: 5, worstRating: 1 },
      reviewBody: t.quote,
      publisher: { '@type': 'Organization', name: 'Google' }
    }))
  };
}

function buildBreadcrumbList(items) {
  if (!items || !items.length) return null;
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      item: absoluteUrl(item.url)
    }))
  };
}

// One Service entry per service page, linked back to the business via @id so
// Google can associate "Airbnb Cleaning" etc. with the same business.
function buildService({ service, page, coverageAreas }) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    serviceType: service.title,
    name: service.title,
    description: page.meta_description || service.short_description,
    provider: { '@id': BUSINESS_ID },
    url: absoluteUrl(`/${service.slug}`)
  };

  if (page.images && page.images.length) {
    schema.image = absoluteUrl(page.images[0]);
  }
  if (coverageAreas && coverageAreas.length) {
    schema.areaServed = coverageAreas.map(placeFor);
  }
  const offer = offerFor(service.slug, service.title, `/${service.slug}`);
  if (offer) schema.offers = offer;
  schema.category = 'Cleaning service';

  return schema;
}

// One Service entry per service+area combo page (e.g. "End of Tenancy
// Cleaning in Camden"), scoped to that single area rather than the sitewide
// coverage list — mirrors buildService() but for /{service-slug}/{area-slug}/.
function buildServiceAreaPage({ service, page, region, image }) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    serviceType: service.title,
    name: `${service.title} in ${region.name}`,
    description: page.meta_description || `${service.title} in ${region.name}.`,
    provider: { '@id': BUSINESS_ID },
    url: absoluteUrl(`/${service.slug}/${page.slug}`),
    areaServed: { '@type': 'Place', name: String(region.name).replace(/^Essex - /, '') },
    category: 'Cleaning service'
  };
  if (page.postcodes && page.postcodes.length) {
    schema.areaServed.address = { '@type': 'PostalAddress', postalCode: page.postcodes.join(', '), addressCountry: 'GB' };
  }
  const offer = offerFor(service.slug, `${service.title} in ${String(region.name).replace(/^Essex - /, '')}`, `/${service.slug}/${page.slug}`);
  if (offer) schema.offers = offer;
  if (image) schema.image = absoluteUrl(image);

  return schema;
}

function buildFaqPage(faqs) {
  if (!faqs || !faqs.length) return null;
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((f) => ({
      '@type': 'Question',
      name: f.question,
      acceptedAnswer: { '@type': 'Answer', text: f.answer }
    }))
  };
}

// BlogPosting for each published post — reuses fields blog posts already have
// (title, excerpt, cover_image, published_at, updated_at); no new columns needed.
// Blog posts, case studies and answers are written by Silvia (shown in the author box on the page).
const AUTHOR = {
  '@type': 'Person',
  '@id': FOUNDER_ID,
  name: 'Silvia Nedeva',
  jobTitle: profile.founder.jobTitle,
  url: absoluteUrl(profile.founder.url),
  image: absoluteUrl('/images/silvia.webp'),
  sameAs: profile.founder.sameAs
};

function buildArticle({ post, site, url }) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.meta_description || post.excerpt,
    url: absoluteUrl(url ? url + '/' : post.legacy_root ? `/${post.slug}/` : `/blog/${post.slug}/`),
    author: { ...AUTHOR, worksFor: { '@id': BUSINESS_ID } },
    publisher: { '@id': BUSINESS_ID },
    inLanguage: 'en-GB'
  };
  schema.mainEntityOfPage = { '@id': `${schema.url}#webpage` };
  schema.isPartOf = { '@id': WEBSITE_ID };
  if (post.cover_image) schema.image = absoluteUrl(post.cover_image);
  if (post.published_at) schema.datePublished = post.published_at;
  if (post.updated_at) schema.dateModified = post.updated_at;
  return schema;
}

module.exports = {
  absoluteUrl,
  buildFounder,
  buildWebSite,
  buildWebPage,
  buildReviews,
  buildLocalBusiness,
  buildBreadcrumbList,
  buildService,
  buildServiceAreaPage,
  buildFaqPage,
  buildArticle
};
