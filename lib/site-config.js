// Single source of truth for the site's public URL — used to build canonical
// tags, Open Graph URLs, structured data, robots.txt and sitemap.xml so they
// can never drift out of sync with each other.
//
// The live domain is the default. A SITE_URL env var still overrides it, but a
// leftover *.netlify.app value is ignored so canonicals can never point at the
// Netlify subdomain again.
const ENV_URL = process.env.SITE_URL && !/netlify\.app/.test(process.env.SITE_URL) ? process.env.SITE_URL : null;
const SITE_URL = (ENV_URL || 'https://sncleaningservices.co.uk').replace(/\/$/, '');

module.exports = { SITE_URL };
