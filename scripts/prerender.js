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
const editorContent = require('../lib/editor-content');
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
    { url: '/about/silvia-nedeva', out: 'about/silvia-nedeva/index.html', sitemap: true },
    { url: '/end-of-tenancy-cleaning/faq', out: 'end-of-tenancy-cleaning/faq/index.html', sitemap: true },
    { url: '/our-work', out: 'our-work/index.html', sitemap: true },
    { url: '/why-us', out: 'why-us/index.html', sitemap: true },
    ...require('../data/why-us').all().map((p) => ({ url: p.url, out: `${p.url.slice(1)}/index.html`, sitemap: true })),
    { url: '/gallery', out: 'gallery/index.html', sitemap: true },
    { url: '/blog', out: 'blog/index.html', sitemap: true },
    { url: '/privacy-policy', out: 'privacy-policy/index.html', sitemap: true },
    { url: '/terms-and-conditions', out: 'terms-and-conditions/index.html', sitemap: true },
    { url: '/cookies-policy', out: 'cookies-policy/index.html', sitemap: true },
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

  // One "all videos" page per service that has at least one job video.
  const jobVideos = await content.getJobVideos();
  const videoRoutes = [...new Set(jobVideos.map((v) => v.service_slug))]
    .map((slug) => ({ url: `/videos/${slug}`, out: `videos/${slug}/index.html`, sitemap: true }));

  // Questions answered (Supabase public.faq_answers)
  const faqAnswers = await content.getFaqAnswers();
  const questionRoutes = faqAnswers.length ? [
    { url: '/questions', out: 'questions/index.html', sitemap: true, lastmod: faqAnswers.map((a) => a.updated_at).sort().pop() },
    ...faqAnswers.map((a) => ({ url: `/questions/${a.slug}`, out: `questions/${a.slug}/index.html`, sitemap: true, lastmod: a.updated_at }))
  ] : [];

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
    url: p.legacy_root ? `/${p.slug}` : `/blog/${p.slug}`,
    out: p.legacy_root ? `${p.slug}/index.html` : `blog/${p.slug}/index.html`,
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
  // Case studies written in the website editor, and the hidden templates the
  // editor uses to preview new posts before they are published.
  const cases = editorContent.editorPosts('case');
  const caseRoutes = cases.length
    ? [{ url: '/case-studies', out: 'case-studies/index.html', sitemap: true, lastmod: cases[0].updated_at },
       ...cases.map((p) => ({ url: `/case-studies/${p.slug}`, out: `case-studies/${p.slug}/index.html`, sitemap: !p.noindex, lastmod: p.updated_at }))]
    : [];
  const editorTemplates = [
    { url: '/blog/_template', out: 'blog/_template/index.html', sitemap: false },
    { url: '/case-studies/_template', out: 'case-studies/_template/index.html', sitemap: false }
  ];

  // Pages edited in the website editor: hidden from Google, or last edited on.
  const all = [...fixed, ...videoRoutes, ...questionRoutes, ...bookRoutes, ...serviceRoutes, ...blogRoutes, ...areaRoutes, ...caseRoutes, ...editorTemplates].filter((r) => !MOVED.test(r.url));
  for (const r of all) {
    const m = editorContent.pageMeta(r.url);
    if (!m) continue;
    if (m.seo && m.seo.noindex) r.sitemap = false;
    if (m.updatedAt && (!r.lastmod || new Date(m.updatedAt) > new Date(r.lastmod))) r.lastmod = m.updatedAt;
  }
  blogPosts.filter((p) => p.noindex).forEach((p) => { const r = all.find((x) => x.url === `/blog/${p.slug}`); if (r) r.sitemap = false; });
  return all;
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

// Content photos on a page (inside <main>), for the image sitemap.
function pageImages(html) {
  const a = html.indexOf('<main>'), b = html.lastIndexOf('</main>');
  if (a < 0 || b < a) return [];
  const out = new Set();
  for (const m of html.slice(a, b).matchAll(/<img[^>]+src="(\/images\/[^"?]+\.(?:jpe?g|png|webp))[^"]*"/gi)) {
    if (!/\/images\/(_r|favicon)\/|logo/.test(m[1])) out.add(m[1]);
  }
  return [...out].slice(0, 20);
}

function writeSitemap(routes) {
  // lastmod only when we really know when a page changed (Supabase rows, posts,
  // editor edits), so Google can trust it. Photos on each page are listed too.
  const escXml = (u) => u.replace(/&/g, '&amp;').replace(/</g, '&lt;');
  const urls = routes
    .filter((r) => r.sitemap)
    .map((r) => {
      const lastmod = r.lastmod && !isNaN(new Date(r.lastmod)) ? `\n    <lastmod>${new Date(r.lastmod).toISOString().slice(0, 10)}</lastmod>` : '';
      const imgs = (r.images || []).map((src) => `\n    <image:image><image:loc>${escXml(SITE_URL + src)}</image:loc></image:image>`).join('');
      return `  <url>\n    <loc>${SITE_URL}${r.url === '/' ? '/' : r.url.replace(/\/?$/, '/')}</loc>${lastmod}${imgs}\n  </url>`;
    })
    .join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n${urls}\n</urlset>\n`;
  writeFile('sitemap.xml', xml);
  console.log(`Wrote dist/sitemap.xml (${routes.filter((r) => r.sitemap).length} URLs)`);
}

// Page title and meta description, for the recent changes feed.
function pageTitle(html) {
  const m = html.match(/<title>([^<]*)<\/title>/i);
  return m ? m[1].trim() : '';
}
function pageDescription(html) {
  const m = html.match(/<meta\s+name="description"\s+content="([^"]*)"/i);
  return m ? m[1].trim() : '';
}

// Small Atom feed of the most recently changed pages (dist/feed.xml). Google
// recommends a sitemap for all pages plus a feed for recent changes: it fetches
// small feeds more often, so new and updated pages are found sooner. Only pages
// that are in the sitemap and have a real last changed date are listed.
function writeFeed(routes) {
  const esc = (t) => String(t).replace(/&(?!(amp|lt|gt|quot|#\d+);)/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const items = routes
    .filter((r) => r.sitemap && r.lastmod && !isNaN(new Date(r.lastmod)))
    .sort((a, b) => new Date(b.lastmod) - new Date(a.lastmod))
    .slice(0, 50);
  const updated = items.length ? new Date(items[0].lastmod).toISOString() : new Date().toISOString();
  const entries = items.map((r) => {
    const loc = SITE_URL + (r.url === '/' ? '/' : r.url.replace(/\/?$/, '/'));
    return `  <entry>\n    <title>${esc(r.title || loc)}</title>\n    <link href="${esc(loc)}"/>\n    <id>${esc(loc)}</id>\n    <updated>${new Date(r.lastmod).toISOString()}</updated>${r.description ? `\n    <summary>${esc(r.description)}</summary>` : ''}\n  </entry>`;
  }).join('\n');
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<feed xmlns="http://www.w3.org/2005/Atom">\n  <title>SN Cleaning Services: new and updated pages</title>\n  <link href="${SITE_URL}/"/>\n  <link rel="self" href="${SITE_URL}/feed.xml"/>\n  <id>${SITE_URL}/feed.xml</id>\n  <updated>${updated}</updated>\n  <author><name>SN Cleaning Services</name></author>\n${entries}\n</feed>\n`;
  writeFile('feed.xml', xml);
  console.log(`Wrote dist/feed.xml (${items.length} entries)`);
}

function writeRobotsTxt() {
  // AI search/answer bots (ChatGPT, Claude, Perplexity, Google AI) are allowed
  // so the business can be found and recommended in AI search. Only
  // Bytespider (a bulk scraper, not a search engine) is kept out.
  const txt = `User-agent: *\nAllow: /\nDisallow: /apply/\nDisallow: /apply-rep/\nDisallow: /admin/\nDisallow: /team/\n\nUser-agent: Bytespider\nDisallow: /\n\nSitemap: ${SITE_URL}/sitemap.xml\nSitemap: ${SITE_URL}/feed.xml\n`;
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

// Every page is published at /{path}/ (with the slash), which is the address in
// the sitemap and the canonical tag. Links written as /{path} make Google go
// through a 301 first and see two versions of each page. After the build, point
// every internal link and structured-data URL straight at the real address,
// but only when that page really exists in dist/ (so files, /api routes and
// redirects are left alone).
function fixInternalLinks() {
  const isPage = (p) => p !== '/' && !p.endsWith('/') && !/\.[a-z0-9]+$/i.test(p) &&
    fs.existsSync(path.join(DIST, p, 'index.html'));
  const files = [];
  (function walk(dir) {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, e.name);
      if (e.isDirectory()) walk(full);
      else if (e.name.endsWith('.html')) files.push(full);
    }
  })(DIST);

  const site = SITE_URL.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const hrefRe = /(href=["'])(\/[^"'?#\s]*)([?#][^"']*)?(["'])/g;
  const absRe = new RegExp(`(${site})(/[^"'?#\\s<>\\\\]*)`, 'g');
  let changed = 0;
  for (const f of files) {
    const before = fs.readFileSync(f, 'utf8');
    const after = before
      .replace(hrefRe, (m, a, p, rest = '', q) => (isPage(p) ? `${a}${p}/${rest}${q}` : m))
      .replace(absRe, (m, s, p) => (isPage(p) ? `${s}${p}/` : m));
    if (after !== before) { fs.writeFileSync(f, after); changed++; }
  }
  console.log(`Pointed internal links at the real (slash) address in ${changed} pages`);
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
        route.images = pageImages(body);
        route.title = pageTitle(body);
        route.description = pageDescription(body);
        console.log(`Rendered ${route.url} -> dist/${route.out} (${status})`);
      }

      writeSitemap(ROUTES);
      writeFeed(ROUTES);
      writeRobotsTxt();

      // Copy static assets (css/js/images) so absolute paths like /css/style.css resolve.
      const publicDir = path.join(__dirname, '..', 'public');
      for (const entry of fs.readdirSync(publicDir)) {
        fs.cpSync(path.join(publicDir, entry), path.join(DIST, entry), { recursive: true });
      }
      console.log('Copied /public assets into /dist');

      fixInternalLinks();

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
