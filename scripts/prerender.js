/**
 * Pre-renders every route of the Express/EJS app to static HTML files in /dist,
 * and copies /public assets alongside them. This lets the site deploy to Netlify
 * (or any static host) with zero server required — the contact form is handled
 * by Netlify Forms instead (see views/contact.ejs).
 *
 * Run with: npm run build
 */
const http = require('http');
const fs = require('fs');
const path = require('path');

const app = require('../server');
const content = require('../data/content');
const DIST = path.join(__dirname, '..', 'dist');
const PORT = 4521;

// Fixed routes, plus one route per published service page and blog post
// (pulled live from Supabase at build time — this is what makes "add a row,
// get a page" work: every build re-reads the tables and generates a page for
// whatever is published right now).
async function buildRoutes() {
  const fixed = [
    { url: '/', out: 'index.html' },
    { url: '/services', out: 'services/index.html' },
    { url: '/about', out: 'about/index.html' },
    { url: '/gallery', out: 'gallery/index.html' },
    { url: '/blog', out: 'blog/index.html' },
    { url: '/contact', out: 'contact/index.html' },
    { url: '/contact/success', out: 'contact/success/index.html' },
    { url: '/this-page-does-not-exist', out: '404.html' } // captures our custom 404 view
  ];

  const [servicePages, blogPosts] = await Promise.all([content.getServicePages(), content.getBlogPosts()]);

  const serviceRoutes = servicePages.map((p) => ({
    url: `/services/${p.slug}`,
    out: `services/${p.slug}/index.html`
  }));

  const blogRoutes = blogPosts.map((p) => ({
    url: `/blog/${p.slug}`,
    out: `blog/${p.slug}/index.html`
  }));

  return [...fixed, ...serviceRoutes, ...blogRoutes];
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
        writeFile(route.out, body);
        console.log(`Rendered ${route.url} -> dist/${route.out} (${status})`);
      }

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
