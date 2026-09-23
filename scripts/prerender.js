/**
 * Pre-renders every route of the Express/EJS app to static HTML files in /dist,
 * and copies /public assets alongside them. This lets the site deploy to Netlify
 * (or any static host) with zero server required — the contact form is handled
 * by Netlify Forms instead (see views/contact.ejs).
 *
 * Also generates dist/robots.txt and dist/sitemap.xml straight from the same
 * route list and the same SITE_URL used for canonical tags — so all three can
 * never drift out of sync with each other or with what's actually published.
 *
 * Run with: npm run build
 */
const http = require('http');
const fs = require('fs');
const path = require('path');

const app = require('../server');
const content = require('../data/content');
const { SITE_URL } = require('../lib/site-config');
const DIST = path.join(__dirname, '..', 'dist');
const PORT = 4521;

// Fixed routes, plus one route per published service page and blog post
// (pulled live from Supabase at build time — this is what makes "add a row,
// get a page" work: every build re-reads the tables and generates a page for
// whatever is published right now). `sitemap: false` keeps low-value/private
// pages (the 404 capture route, the post-submit thank-you page) out of the
// sitemap without excluding them from the site itself.
async function buildRoutes() {
  const fixed = [
    { url: '/', out: 'index.html', sitemap: true },
    // /our-services (not /services) to match the exact URL already indexed
    // on sncleaningservices.co.uk — see server.js for the route itself.
    { url: '/our-services', out: 'our-services/index.html', sitemap: true },
    { url: '/about', out: 'about/index.html', sitemap: true },
    { url: '/gallery', out: 'gallery/index.html', sitemap: true },
    { url: '/blog', out: 'blog/index.html', sitemap: true },
    { url: '/contact', out: 'contact/index.html', sitemap: true },
    { url: '/contact/success', out: 'contact/success/index.html', sitemap: false },
    { url: '/this-page-does-not-exist', out: '404.html', sitemap: false } // captures our custom 404 view
  ];

  const [servicePages, blogPosts, areaPages, services] = await Promise.all([
    content.getServicePages(),
    content.getBlogPosts(),
    content.getAreaPages(),
    content.getServices()
  ]);

  // Booking pages: the chooser, plus one per service that has an online form.
  const bookRoutes = [
    { url: '/book', out: 'book/index.html', sitemap: false },
    ...services
      .filter((s) => s.booking_embed_url)
      .map((s) => ({ url: `/book/${s.slug}`, out: `book/${s.slug}/index.html`, sitemap: false }))
  ];

  // Service hub pages live at site root (/{slug}/, not /services/{slug}/) —
  // matching the exact URLs already indexed on sncleaningservices.co.uk
  // (e.g. /office-cleaning/, /domestic-cleaning/) so this build can take
  // over those pages with no redirect needed once the domain moves.
  const serviceRoutes = servicePages.map((p) => ({
    url: `/${p.slug}`,
    out: `${p.slug}/index.html`,
    sitemap: true,
    lastmod: p.updated_at
  }));

  const blogRoutes = blogPosts.map((p) => ({
    url: `/blog/${p.slug}`,
    out: `blog/${p.slug}/index.html`,
    sitemap: true,
    lastmod: p.updated_at
  }));

  // Each area page belongs to one service, so its URL is /{service-slug}/{area-slug}/
  // — matching the pattern already live and indexed at sncleaningservices.co.uk
  // (e.g. /end-of-tenancy-cleaning/camden/) so this build can take over those
  // exact URLs with no redirects needed once it goes live.
  const areaRoutes = areaPages
    .filter((p) => p.services)
    .map((p) => ({
      url: `/${p.services.slug}/${p.slug}`,
      out: `${p.services.slug}/${p.slug}/index.html`,
      sitemap: true,
      lastmod: p.updated_at
    }));

  // Office and nursery cleaning now live on snclean.co.uk (301s in netlify.toml),
  // so they are not built here or listed in the sitemap.
  const MOVED = /^\/(office-cleaning|nursery-cleaning)(\/|$)/;
  return [...fixed, ...bookRoutes, ...serviceRoutes, ...blogRoutes, ...areaRoutes].filter((r) => !MOVED.test(r.url));
}

function fetchHtml(url) {
  return new Promise((resolve, reject) => {
    http
      .get(url, (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => resolve({ status: res.statusCode, body: data }));
      })
      .on('error', reject);
  });
}

function writeFile(relPath, content) {
  const fullPath = path.join(DIST, relPath);
  fs.mkdirSync(path.dirname(fullPath), { recursive: true });
  fs.writeFileSync(fullPath, content);
}

function writeSitemap(routes) {
  const today = new Date().toISOString().slice(0, 10);
  const urls = routes
    .filter((r) => r.sitemap)
    .map((r) => {
      const lastmod = (r.lastmod ? new Date(r.lastmod).toISOString().slice(0, 10) : today);
      return `  <url>\n    <loc>${SITE_URL}${r.url}</loc>\n    <lastmod>${lastmod}</lastmod>\n  </url>`;
    })
    .join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
  writeFile('sitemap.xml', xml);
  console.log(`Wrote dist/sitemap.xml (${routes.filter((r) => r.sitemap).length} URLs)`);
}

function writeRobotsTxt() {
  // AI search/answer bots (ChatGPT, Claude, Perplexity, Google AI) are allowed
  // so the business can be found and recommended in AI search. Only
  // Bytespider (a bulk scraper, not a search engine) is kept out.
  const txt = `User-agent: *\nAllow: /\nDisallow: /apply/\n\nUser-agent: Bytespider\nDisallow: /\n\nSitemap: ${SITE_URL}/sitemap.xml\n`;
  writeFile('robots.txt', txt);
  console.log('Wrote dist/robots.txt');
}

// Inline our own stylesheets into every page so nothing blocks the first
// paint (saves a round trip per file on mobile). Lightly minified.
const cssCache = {};
function inlineCss(html) {
  return html.replace(/<link rel="stylesheet" href="\/css\/([a-z0-9-]+\.css)\?v=[^"]*"\s*\/?>/g, (tag, file) => {
    const p = path.join(__dirname, '..', 'public', 'css', file);
    if (!fs.existsSync(p)) return tag;
    if (!cssCache[file]) {
      cssCache[file] = fs.readFileSync(p, 'utf8')
        .replace(/\/\*[\s\S]*?\*\//g, '')
        .replace(/\s+/g, ' ')
        .replace(/\s*([{}:;,>])\s*/g, '$1')
        .replace(/;}/g, '}')
        .replace(/<\/style/gi, '<\\/style')
        .trim();
    }
    return `<style>${cssCache[file]}</style>`;
  });
}

async function main() {
  // Fresh dist/
  fs.rmSync(DIST, { recursive: true, force: true });
  fs.mkdirSync(DIST, { recursive: true });

  const server = app.listen(PORT, async () => {
    try {
      const ROUTES = await buildRoutes();
      for (const route of ROUTES) {
        const { status, body } = await fetchHtml(`http://localhost:${PORT}${route.url}`);
        if (status !== 200 && status !== 404) {
          throw new Error(`Unexpected status ${status} for ${route.url}`);
        }
        writeFile(route.out, inlineCss(body));
        console.log(`Rendered ${route.url} -> dist/${route.out} (${status})`);
      }

      writeSitemap(ROUTES);
      writeRobotsTxt();

      // Copy static assets (css/js/images) so absolute paths like /css/style.css resolve.
      const publicDir = path.join(__dirname, '..', 'public');
      for (const entry of fs.readdirSync(publicDir)) {
        fs.cpSync(path.join(publicDir, entry), path.join(DIST, entry), { recursive: true });
      }
      console.log('Copied /public assets into /dist');

      console.log('\nStatic build complete: dist/');
    } catch (err) {
      console.error('Prerender failed:', err);
      process.exitCode = 1;
    } finally {
      server.close();
    }
  });
}

main();
