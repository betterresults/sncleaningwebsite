// Builds schema.org JSON-LD blocks from the same content already stored in
// Supabase (or site_settings) — nothing here is separately authored per page,
// it's all derived from fields that already exist for another reason.
const { SITE_URL } = require('./site-config');

function absoluteUrl(pathOrUrl) {
  if (!pathOrUrl) return null;
  return pathOrUrl.startsWith('http') ? pathOrUrl : `${SITE_URL}${pathOrUrl}`;
}

// Sitewide business identity — included on every page so Google can build a
// consistent picture of the business regardless of which page someone lands on.
// Uses "HousekeepingService" (a schema.org LocalBusiness subtype) since that's
// the most specific accurate type for a residential/commercial cleaning company.
function buildLocalBusiness({ site, coverageAreas }) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'HousekeepingService',
    '@id': `${SITE_URL}/#business`,
    name: site.name,
    url: SITE_URL,
    image: absoluteUrl(site.logoUrl),
    telephone: site.phone,
    email: site.email
  };

  if (coverageAreas && coverageAreas.length) {
    schema.areaServed = coverageAreas.map((name) => ({ '@type': 'Place', name }));
  }

  const sameAs = [site.social && site.social.facebook, site.social && site.social.instagram, site.googleBusinessUrl].filter(
    Boolean
  );
  if (sameAs.length) schema.sameAs = sameAs;

  return schema;
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
// Google can associate "Airbnb Cleaning" etc. with the same HousekeepingService.
function buildService({ service, page, coverageAreas }) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    serviceType: service.title,
    name: service.title,
    description: page.meta_description || service.short_description,
    provider: { '@id': `${SITE_URL}/#business` },
    url: absoluteUrl(`/${service.slug}`)
  };

  if (page.images && page.images.length) {
    schema.image = absoluteUrl(page.images[0]);
  }
  if (coverageAreas && coverageAreas.length) {
    schema.areaServed = coverageAreas.map((name) => ({ '@type': 'Place', name }));
  }

  return schema;
}

// One Service entry per service+area combo page (e.g. "End of Tenancy
// Cleaning in Camden"), scoped to that single area rather than the sitewide
// coverage list — mirrors buildService() but for /{service-slug}/{area-slug}/.
function buildServiceAreaPage({ service, page, region }) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    serviceType: service.title,
    name: `${service.title} in ${region.name}`,
    description: page.meta_description || `${service.title} in ${region.name}.`,
    provider: { '@id': `${SITE_URL}/#business` },
    url: absoluteUrl(`/${service.slug}/${page.slug}`),
    areaServed: { '@type': 'Place', name: region.name }
  };

  // Postcode districts double as a much more precise areaServed signal than the
  // borough name alone — "RM1" is unambiguous in a way that "Romford" is not.
  if (page.postcodes && page.postcodes.length) {
    schema.areaServed = [
      { '@type': 'Place', name: region.name },
      ...page.postcodes.map((pc) => ({ '@type': 'PostalCodeSpecification', postalCode: pc }))
    ];
  }

  // The price table, expressed as an offer catalogue. Each tier becomes one
  // Offer so Google can read "1 bedroom flat, from £165" rather than guessing
  // a price range off the page text.
  const tiers = page.pricing_tiers || [];
  if (tiers.length) {
    schema.hasOfferCatalog = {
      '@type': 'OfferCatalog',
      name: `${service.title} prices in ${region.name}`,
      itemListElement: tiers.map((t) => ({
        '@type': 'Offer',
        name: t.property,
        price: String(t.price),
        priceCurrency: 'GBP',
        priceSpecification: {
          '@type': 'PriceSpecification',
          price: String(t.price),
          priceCurrency: 'GBP',
          valueAddedTaxIncluded: true,
          // These are "from" prices — saying so in the markup keeps the rich
          // result honest when the final quote comes in higher.
          minPrice: String(t.price)
        }
      }))
    };
  }

  const priceFrom = page.price_from || (tiers.length ? Math.min(...tiers.map((t) => t.price)) : null);
  if (priceFrom) {
    schema.offers = {
      '@type': 'Offer',
      priceCurrency: 'GBP',
      price: String(priceFrom),
      availability: 'https://schema.org/InStock',
      url: absoluteUrl(`/${service.slug}/${page.slug}`)
    };
  }

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
function buildArticle({ post, site }) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.meta_description || post.excerpt,
    url: absoluteUrl(`/blog/${post.slug}`),
    author: { '@type': 'Organization', name: site.name },
    publisher: { '@type': 'Organization', name: site.name, logo: { '@type': 'ImageObject', url: absoluteUrl(site.logoUrl) } }
  };
  if (post.cover_image) schema.image = absoluteUrl(post.cover_image);
  if (post.published_at) schema.datePublished = post.published_at;
  if (post.updated_at) schema.dateModified = post.updated_at;
  return schema;
}

module.exports = {
  absoluteUrl,
  buildLocalBusiness,
  buildBreadcrumbList,
  buildService,
  buildServiceAreaPage,
  buildFaqPage,
  buildArticle
};
