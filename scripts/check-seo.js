// Fails when a sitemap page title is outside 38 to 60 characters or a meta
// description is over 155. Run after `npm run build` (it reads dist/).
const fs = require('fs');
const path = require('path');

const DIST = path.join(__dirname, '..', 'dist');

function decode(value) {
  return String(value || '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

function pageFile(loc) {
  const url = new URL(loc);
  let pathname = decodeURIComponent(url.pathname);
  if (pathname === '/') return path.join(DIST, 'index.html');
  pathname = pathname.replace(/\/$/, '');
  return path.join(DIST, pathname, 'index.html');
}

function check(dist) {
  const sitemap = fs.readFileSync(path.join(dist, 'sitemap.xml'), 'utf8');
  const locs = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
  const problems = [];
  for (const loc of locs) {
    const file = pageFile(loc);
    if (!fs.existsSync(file)) {
      problems.push(`${loc} missing ${path.relative(dist, file)}`);
      continue;
    }
    const html = fs.readFileSync(file, 'utf8');
    const title = decode((html.match(/<title>([^<]*)<\/title>/i) || [])[1]);
    const meta = decode((html.match(/<meta\s+name="description"\s+content="([^"]*)"/i) || [])[1]);
    if (title.length < 38 || title.length > 60) problems.push(`title ${title.length} ${loc} ${title}`);
    if (meta.length > 155) problems.push(`meta ${meta.length} ${loc} ${meta}`);
    if (/£/.test(title) || /£/.test(meta)) problems.push(`price symbol ${loc}`);
    const h1s = [...html.matchAll(/<h1\b[^>]*>([\s\S]*?)<\/h1>/gi)].map((m) => decode(m[1].replace(/<[^>]+>/g, '')));
    if (/\/(areas|reviews)\/$/.test(new URL(loc).pathname) && h1s.length !== 1) problems.push(`h1 count ${h1s.length} ${loc}`);
    if (h1s.some((h1) => /£/.test(h1))) problems.push(`price symbol in h1 ${loc}`);
  }
  if (problems.length) {
    console.error(`SEO check failed (${problems.length}):`);
    problems.slice(0, 40).forEach((line) => console.error('  ' + line));
    if (problems.length > 40) console.error(`  ... ${problems.length - 40} more`);
    return 1;
  }
  console.log(`SEO check passed (${locs.length} sitemap URLs, titles 38 to 60, metas up to 155)`);
  return 0;
}

if (require.main === module) {
  if (!fs.existsSync(path.join(DIST, 'sitemap.xml'))) {
    console.error('dist/sitemap.xml is missing. Run npm run build first.');
    process.exit(1);
  }
  process.exit(check(DIST));
}

module.exports = { check };
