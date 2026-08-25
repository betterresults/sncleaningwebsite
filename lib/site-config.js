// Single source of truth for the site's public URL — used to build canonical
// tags, Open Graph URLs, structured data, robots.txt and sitemap.xml so they
// can never drift out of sync with each other.
//
// IMPORTANT: once the custom domain (sncleaningservices.co.uk) is connected
// in Netlify, set SITE_URL as an environment variable there (Site settings ->
// Environment variables) to "https://sncleaningservices.co.uk" and redeploy.
// Until then this defaults to the netlify.app URL the site actually serves from.
const SITE_URL = (process.env.SITE_URL || 'https://sncleaningwebsite.netlify.app').replace(/\/$/, '');

module.exports = { SITE_URL };
