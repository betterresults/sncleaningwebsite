// Turns on the in-memory content cache in data/content.js. Must run before
// server.js (and content.js) load. Unset for `npm start` and Netlify Functions.
process.env.PRERENDER = '1';

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
    { url: '/end-of-tenancy-cleaning/prices', out: 'end-of-tenancy-cleaning/prices/index.html', sitemap: true },
    { url: '/end-of-tenancy-cleaning-checklist', out: 'end-of-tenancy-cleaning-checklist/index.html', sitemap: true, lastmod: '2026-11-26' },
    { url: '/domestic-cleaning-checklist', out: 'domestic-cleaning-checklist/index.html', sitemap: true, lastmod: '2026-11-26' },
    { url: '/airbnb-turnover-cleaning-checklist', out: 'airbnb-turnover-cleaning-checklist/index.html', sitemap: true, lastmod: '2026-11-26' },
    { url: '/after-builders-cleaning-checklist', out: 'after-builders-cleaning-checklist/index.html', sitemap: true, lastmod: '2026-11-27' },
    { url: '/deep-cleaning-checklist', out: 'deep-cleaning-checklist/index.html', sitemap: true, lastmod: '2026-11-27' },
    { url: '/clean-home-report', out: 'clean-home-report/index.html', sitemap: true, lastmod: '2026-11-26' },
    { url: '/house-cleaning-time-calculator', out: 'house-cleaning-time-calculator/index.html', sitemap: true, lastmod: '2026-11-26' },
    { url: '/end-of-tenancy-cleaning-cost-calculator', out: 'end-of-tenancy-cleaning-cost-calculator/index.html', sitemap: true, lastmod: '2026-11-26' },
    { url: '/carpet-cleaning-cost-calculator', out: 'carpet-cleaning-cost-calculator/index.html', sitemap: true, lastmod: '2026-11-27' },
    { url: '/after-builders-cleaning/prices', out: 'after-builders-cleaning/prices/index.html', sitemap: true },
    { url: '/prices', out: 'prices/index.html', sitemap: true },
    { url: '/areas', out: 'areas/index.html', sitemap: true },
    { url: '/reviews', out: 'reviews/index.html', sitemap: true },
    { url: '/our-work', out: 'our-work/index.html', sitemap: true },
    { url: '/why-us', out: 'why-us/index.html', sitemap: true },
    ...require('../data/why-us').all().map((p) => ({ url: p.url, out: `${p.url.slice(1)}/index.html`, sitemap: true })),
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
  // Listed in the sitemap only when the service page links to it ("View all", shown above 3 videos);
  // with 3 or fewer the page repeats the service page's own video section (noindex, see server.js).
  const videoRoutes = [...new Set(jobVideos.map((v) => v.service_slug))]
    .map((slug) => ({ url: `/videos/${slug}`, out: `videos/${slug}/index.html`, sitemap: jobVideos.filter((v) => v.service_slug === slug).length > 3 }));

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
  // AI search crawlers are also named explicitly (OpenAI: OAI-SearchBot must be
  // allowed for pages to appear in ChatGPT search; ChatGPT-User fetches pages a
  // user asks about). A named group replaces the * group for that bot, so it
  // repeats the same private paths.
  const priv = 'Disallow: /apply/\nDisallow: /apply-rep/\nDisallow: /admin/\nDisallow: /team/\nDisallow: /checklist/report/\nDisallow: /api/checklist/\n';
  const ai = ['OAI-SearchBot', 'ChatGPT-User', 'Claude-SearchBot', 'Claude-User', 'PerplexityBot', 'Perplexity-User'];
  const txt = `User-agent: *\nAllow: /\n${priv}\n` +
    ai.map((b) => `User-agent: ${b}\n`).join('') + `Allow: /\n${priv}\n` +
    `User-agent: Bytespider\nDisallow: /\n\nSitemap: ${SITE_URL}/sitemap.xml\nSitemap: ${SITE_URL}/feed.xml\n`;
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

// Critical CSS (Silvia, 19 Nov 2026: Screpy flagged every page for a low text
// to HTML ratio because each page carried all 90 KB of our CSS inline). Only
// the rules a page actually uses are inlined; the full stylesheet loads
// without blocking the first paint. Falls back to inlining everything.
let beasties = null;
try {
  const Beasties = require('beasties');
  beasties = new (Beasties.default || Beasties)({
    path: path.join(__dirname, '..', 'public'),
    publicPath: '/',
    preload: 'media',
    pruneSource: false,
    reduceInlineStyles: false,
    inlineFonts: false,
    preloadFonts: false,
    compress: true,
    keyframes: 'critical',
    logLevel: 'silent',
  });
} catch (e) { beasties = null; }

// Booking form links (app.sncleaningservices.co.uk) are plain links, not nofollow (Ahrefs audit, 24 Nov 2026):
// nofollow on our own links only wastes link value. Keep booking pages out of Google with noindex on the booking app.


// Small area maps draw the whole London and Essex outline but only show a
// small window of it (viewBox). Paths fully outside that window are invisible,
// so drop them: same picture, much less HTML (Screpy content ratio, 19 Nov 2026).
function pathBox(d){
  const re=/([MmLlHhVvZz])([^MmLlHhVvZz]*)/g; let m,x=0,y=0,sx=0,sy=0,minX=1e9,minY=1e9,maxX=-1e9,maxY=-1e9;
  while((m=re.exec(d))){const c=m[1];const n=(m[2].match(/-?\d*\.?\d+(?:e-?\d+)?/gi)||[]).map(Number);
    const pts=[];
    if(c==='M'||c==='L'){for(let i=0;i+1<n.length;i+=2){x=n[i];y=n[i+1];pts.push([x,y]);} if(c==='M'){sx=x;sy=y;}}
    else if(c==='m'||c==='l'){for(let i=0;i+1<n.length;i+=2){x+=n[i];y+=n[i+1];pts.push([x,y]);} if(c==='m'){sx=x;sy=y;}}
    else if(c==='H'){for(const v of n){x=v;pts.push([x,y]);}} else if(c==='h'){for(const v of n){x+=v;pts.push([x,y]);}}
    else if(c==='V'){for(const v of n){y=v;pts.push([x,y]);}} else if(c==='v'){for(const v of n){y+=v;pts.push([x,y]);}}
    else if(c==='Z'||c==='z'){x=sx;y=sy;}
    for(const [a,b] of pts){if(a<minX)minX=a;if(a>maxX)maxX=a;if(b<minY)minY=b;if(b>maxY)maxY=b;}
  }
  if(/[^MmLlHhVvZz\d\s,.\-e]/i.test(d)) return null;
  return [minX,minY,maxX,maxY];
}
function cullSvgMaps(html){
  return html.replace(/<svg viewBox="([-\d.]+) ([-\d.]+) ([-\d.]+) ([-\d.]+)"([^>]*)>([\s\S]*?)<\/svg>/g,(all,vx,vy,vw,vh,attrs,inner)=>{
    if(inner.length<3000) return all;
    const X0=+vx,Y0=+vy,X1=X0+ +vw,Y1=Y0+ +vh, pad=Math.max(+vw,+vh)*0.25;
    const out=inner.replace(/<path([^>]*?) d="([^"]*)"\s*\/>/g,(p,a,d)=>{const b=pathBox(d); if(!b) return p;
      return (b[2]<X0-pad||b[0]>X1+pad||b[3]<Y0-pad||b[1]>Y1+pad)?'':p;});
    return `<svg viewBox="${vx} ${vy} ${vw} ${vh}"${attrs}>${out}</svg>`;
  });
}


async function optimiseCss(html) {
  if (!beasties) return inlineCss(html);
  try {
    const versions = {};
    let doc = html.replace(/<link rel="stylesheet" href="\/css\/([a-z0-9-]+\.css)\?v=([^"]*)"\s*\/?>/g, (tag, file, v) => {
      versions[file] = v;
      return `<link rel="stylesheet" href="/css/${file}">`;
    });
    if (!Object.keys(versions).length) return html;
    // style.css + home.css as ONE file, so the late full stylesheet keeps the
    // same cascade order as the inlined critical rules.
    if (versions['style.css'] && versions['home.css']) {
      const cssDir = path.join(__dirname, '..', 'public', 'css');
      const combined = path.join(cssDir, 'site-home.css');
      if (!fs.existsSync(combined) || !optimiseCss.combinedDone) {
        fs.writeFileSync(combined, fs.readFileSync(path.join(cssDir, 'style.css'), 'utf8') + '\n' + fs.readFileSync(path.join(cssDir, 'home.css'), 'utf8'));
        optimiseCss.combinedDone = true;
      }
      doc = doc.replace('<link rel="stylesheet" href="/css/style.css">', '<link rel="stylesheet" href="/css/site-home.css">')
               .replace('<link rel="stylesheet" href="/css/home.css">', '');
      versions['site-home.css'] = versions['home.css'];
      delete versions['style.css']; delete versions['home.css'];
    }
    // Match rules that depend on the js class set before first paint.
    doc = doc.replace(/<html lang="en-GB">/, '<html lang="en-GB" class="js" data-crit-js>');
    let out = await beasties.process(doc);
    out = out.replace(/<html lang="en-GB" class="js" data-crit-js[^>]*>/, '<html lang="en-GB">');
    // Beasties adds a noscript copy of each stylesheet. Browsers still fetch it,
    // so the homepage downloaded site-home.css and the font CSS twice.
    out = out.replace(/<noscript>\s*<link rel="stylesheet" href="([^"]+)"\s*\/?>\s*<\/noscript>/g, (full, href) => {
      return out.replace(full, '').includes(`href="${href}"`) ? '' : full;
    });
    for (const [file, v] of Object.entries(versions)) {
      out = out.split(`href="/css/${file}"`).join(`href="/css/${file}?v=${v}"`);
    }
    if (!/<style>/.test(out)) return inlineCss(html);
    return out;
  } catch (e) {
    console.warn('Critical CSS failed, inlining full CSS:', e.message);
    return inlineCss(html);
  }
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
      .replace(absRe, (m, s, p) => (isPage(p) ? `${s}${p}/` : m))
      .replaceAll('Southend-on-Sea', 'Southend on Sea')
      .replaceAll('Leigh-on-Sea', 'Leigh on Sea');
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
        writeFile(route.out, cullSvgMaps(await optimiseCss(require('./pictures').wrapPictures(body))));
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
      const seoCode = require('./check-seo').check(DIST);
      if (seoCode) process.exitCode = seoCode;

      console.log('\nStatic build complete: dist/');
    } catch (err) {
      console.error('Prerender failed:', err);
      process.exitCode = 1;
    } finally {
      console.log(`Content cache: ${content.contentCacheFetchCount()} unique Supabase list fetches`);
      server.close();
    }
  });
}

main();
