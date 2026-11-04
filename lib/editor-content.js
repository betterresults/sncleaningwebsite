// Content saved by the website editor (/admin). Lives in content/editor/ and is
// committed to GitHub when the editor publishes. Read once per process: the site
// is rebuilt on every publish.
const fs = require('fs');
const path = require('path');
const overlay = require('../public/admin/overlay');
const { SITE_URL } = require('./site-config');

const DIR = path.join(__dirname, '..', 'content', 'editor');
const readJson = (f, d) => { try { return JSON.parse(fs.readFileSync(path.join(DIR, f), 'utf8')); } catch (e) { return d; } };
const readText = (f) => { try { return fs.readFileSync(path.join(DIR, f), 'utf8'); } catch (e) { return null; } };

let cache = null;
function load() {
  if (cache && process.env.NODE_ENV === 'production') return cache;
  const site = readJson('site.json', { theme: {} });
  const pages = readJson('pages.json', {});
  const posts = readJson('posts.json', []);
  cache = { site, pages, posts };
  return cache;
}

function pageHtml(key) { return readText(`pages/${key}.html`); }
function postBody(slug) { return readText(`posts/${slug}.html`) || ''; }

const toPost = (p) => ({
  slug: p.slug,
  title: p.title,
  excerpt: p.excerpt || '',
  meta_title: p.metaTitle || '',
  meta_description: p.metaDesc || p.excerpt || '',
  cover_image: p.cover ? (p.cover.charAt(0) === '/' ? p.cover : `/images/uploads/${p.cover}`) : '',
  published: true,
  published_at: p.date ? `${p.date}T09:00:00.000Z` : null,
  updated_at: p.updated || p.date || null,
  content: postBody(p.slug),
  service: p.service || '',
  area: p.area || '',
  noindex: !!p.noindex,
  editor: true,
  kind: p.kind || 'post'
});

function editorPosts(kind) {
  return load().posts.filter((p) => (p.kind || 'post') === kind && p.slug && p.title).map(toPost)
    .sort((a, b) => new Date(b.published_at || 0) - new Date(a.published_at || 0));
}

// Applies saved page edits, SEO and website colours to every HTML page.
function middleware(req, res, next) {
  const send = res.send.bind(res);
  res.send = function (body) {
    if (typeof body === 'string' && body.indexOf('</html>') > -1) {
      try {
        const ed = load();
        const key = overlay.pageKey(req.path);
        const meta = ed.pages[key];
        const page = {};
        if (meta) {
          const html = pageHtml(key);
          if (html != null) page.html = html;
          page.seo = meta.seo;
        }
        body = overlay.apply(body, { page, site: ed.site, siteUrl: SITE_URL });
        // styles for editor sections, case studies and the author box, only on pages that use them
        if (/class="(ps-sec|author-box|cs-|qa-)/.test(body)) body = body.replace('</head>', `<link rel="stylesheet" href="/css/extras.css?v=${req.app.locals.assetVersion}" />\n</head>`);
      } catch (e) {
        console.error('Editor overlay failed for', req.path, e.message);
      }
    }
    return send(body);
  };
  next();
}

// For the sitemap: pages hidden from Google, and when a page was last edited.
function pageMeta(urlPath) {
  return load().pages[overlay.pageKey(urlPath)] || null;
}

module.exports = { load, middleware, editorPosts, pageMeta };
