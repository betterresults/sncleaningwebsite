// Fails when a built page breaks the single page checks. Run after `npm run build`
// (it reads dist/). The Netlify build command is unchanged: this script warns
// when you run it, and the prerender step records its exit code.
const fs = require('fs');
const path = require('path');
const { SITE_URL } = require('../lib/site-config');
const { dehyphenText } = require('../lib/site-helpers');

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

function walk(dir, out) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (entry.name.endsWith('.html')) out.push(full);
  }
  return out;
}

function ownUrl(file) {
  let rel = path.relative(DIST, file).split(path.sep).join('/');
  if (rel === '404.html') return null;
  if (rel === 'index.html') return SITE_URL + '/';
  rel = rel.replace(/index\.html$/, '');
  return SITE_URL + '/' + rel;
}

function mainHtml(html) {
  const open = html.search(/<main[\s>]/i);
  if (open < 0) return '';
  const start = html.indexOf('>', open) + 1;
  const end = html.lastIndexOf('</main>');
  if (end < start) return '';
  return html.slice(start, end);
}

function visibleMain(html, url) {
  let main = mainHtml(html)
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ');
  if (url && url.indexOf('/clean-home-report/') !== -1) {
    main = main
      .replace(/<p class="chr-source"[\s\S]*?<\/p>/gi, ' ')
      .replace(/<ol class="chr-sources"[\s\S]*?<\/ol>/gi, ' ')
      .replace(/“[^”]*”/g, ' ')
      .replace(/"[^"]*"/g, ' ');
  }
  return main.split(/<[^>]+>/).map((part) => decode(part)).filter(Boolean).join('\n');
}

const MONTHS = { january: 1, february: 2, march: 3, april: 4, may: 5, june: 6, july: 7, august: 8, september: 9, october: 10, november: 11, december: 12 };

function visibleUpdatedDay(main) {
  const attr = main.match(/Last updated:?[\s\S]{0,180}?datetime="(\d{4}-\d{2}-\d{2})/i);
  if (attr) return attr[1];
  const words = main.match(/Last updated:?\s*(\d{1,2}) ([A-Za-z]+) (\d{4})/i);
  if (!words) return '';
  const month = MONTHS[words[2].toLowerCase()];
  if (!month) return '';
  return words[3] + '-' + String(month).padStart(2, '0') + '-' + String(words[1]).padStart(2, '0');
}

function dayOf(value) {
  const text = decode(value);
  const iso = text.match(/\d{4}-\d{2}-\d{2}/);
  return iso ? iso[0] : '';
}

function check(dist) {
  const sitemapPath = path.join(dist, 'sitemap.xml');
  const sitemap = fs.readFileSync(sitemapPath, 'utf8');
  const locs = new Set([...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]));
  const lastmod = new Map();
  for (const block of sitemap.matchAll(/<url>([\s\S]*?)<\/url>/g)) {
    const loc = (block[1].match(/<loc>([^<]+)<\/loc>/) || [])[1];
    const mod = (block[1].match(/<lastmod>([^<]+)<\/lastmod>/) || [])[1];
    if (loc && mod) lastmod.set(loc, mod.slice(0, 10));
  }
  const problems = [];
  const metas = new Map();
  const files = walk(dist, []);
  for (const file of files) {
    const html = fs.readFileSync(file, 'utf8');
    // Standalone files (the Google check file, the editor, application forms
    // and ad pages) are not built from the site layout. The gate covers every
    // page that layout produces.
    if (!/<main\s+id="content"/i.test(html)) continue;
    const url = ownUrl(file);
    const label = url || path.relative(dist, file);
    const noindex = /<meta\s+name="robots"\s+content="[^"]*noindex/i.test(html);
    const title = decode((html.match(/<title>([^<]*)<\/title>/i) || [])[1]);
    const meta = decode((html.match(/<meta\s+name="description"\s+content="([^"]*)"/i) || [])[1]);
    const h1s = [...html.matchAll(/<h1\b[^>]*>([\s\S]*?)<\/h1>/gi)].map((m) => decode(m[1].replace(/<[^>]+>/g, '')));
    if (title.length < 38 || title.length > 60) problems.push(`title ${title.length} ${label} ${title}`);
    if (meta.length > 155) problems.push(`meta ${meta.length} ${label} ${meta}`);
    if (/£/.test(title) || /£/.test(meta)) problems.push(`price symbol ${label}`);
    if (h1s.length !== 1) problems.push(`h1 count ${h1s.length} ${label}`);
    if (h1s.some((h1) => /£/.test(h1))) problems.push(`price symbol in h1 ${label}`);
    const canonical = decode((html.match(/<link\s+rel="canonical"\s+href="([^"]+)"/i) || [])[1]);
    if (url && !noindex) {
      if (canonical !== url) problems.push(`canonical ${canonical || 'missing'} ${label}`);
      if (!locs.has(url)) problems.push(`not in sitemap ${label}`);
    }
    if (!/property="og:locale"\s+content="en_GB"/.test(html)) problems.push(`og:locale ${label}`);
    for (const block of html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/gi)) {
      try { JSON.parse(block[1]); } catch (e) { problems.push(`json-ld ${label}`); break; }
    }
    for (const img of html.matchAll(/<img\b[^>]*>/gi)) {
      const tag = img[0];
      if (!/\balt=/.test(tag) || !/\bwidth=/.test(tag) || !/\bheight=/.test(tag)) {
        const src = (tag.match(/\bsrc="([^"]*)"/) || [])[1] || 'image';
        problems.push(`image ${src} ${label}`);
        break;
      }
    }
    const prose = visibleMain(html, url);
    if (!noindex && !/last updated/i.test(prose)) problems.push(`last updated ${label}`);
    if (!noindex && url && lastmod.has(url)) {
      const shown = visibleUpdatedDay(mainHtml(html));
      const schemaDays = [...html.matchAll(/"dateModified"\s*:\s*"([^"]+)"/g)].map((m) => dayOf(m[1])).filter(Boolean);
      const days = new Set([shown, lastmod.get(url), ...schemaDays].filter(Boolean));
      if (!shown || days.size !== 1) problems.push(`date mismatch ${[...days].join(' ')} ${label}`);
    }
    const rewritten = dehyphenText(prose);
    if (rewritten !== prose) problems.push(`compound hyphen ${label}`);
    if (/clean(s)? the oven as part of/i.test(prose) || /oven inside and out as part of/i.test(prose)) problems.push(`oven wording ${label}`);
    if (!/tel:02038355033/.test(html)) problems.push(`phone link ${label}`);
    if (meta && !noindex) {
      if (!metas.has(meta)) metas.set(meta, label);
      else problems.push(`duplicate meta ${label} and ${metas.get(meta)}`);
    }
  }
  if (problems.length) {
    console.error(`SEO check failed (${problems.length}):`);
    problems.slice(0, 40).forEach((line) => console.error('  ' + line));
    if (problems.length > 40) console.error(`  ... ${problems.length - 40} more`);
    return 1;
  }
  console.log(`SEO check passed (${locs.size} sitemap URLs, ${files.length} pages)`);
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
