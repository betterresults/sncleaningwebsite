// Wraps local content images in <picture> with AVIF and WebP, and fills in
// width, height, alt and lazy loading. The LCP image (fetchpriority=high, or
// the hero) stays eager.
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..', 'public', 'images', '_r');
const WIDTHS = [480, 800, 1200];
let manifest = null;

function dims() {
  if (manifest) return manifest;
  const file = path.join(ROOT, 'manifest.json');
  manifest = fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8')) : {};
  return manifest;
}

function srcset(base, ext, version) {
  const v = version ? `?v=${version}` : '';
  const widths = WIDTHS.filter((w) => fs.existsSync(path.join(ROOT, `${base}-${w}.${ext}`)));
  if (widths.length) return widths.map((w) => `/images/_r/${base}-${w}.${ext}${v} ${w}w`).join(', ');
  if (fs.existsSync(path.join(ROOT, `${base}.${ext}`))) return `/images/_r/${base}.${ext}${v}`;
  return '';
}

function humanAlt(base) {
  return base.split('/').pop().replace(/[-_]+/g, ' ').replace(/\s+/g, ' ').trim().replace(/\b\w/g, (c) => c.toUpperCase());
}

function wrapPictures(html) {
  return html.replace(/<img\b([^>]*?)\/?>/gi, (tag) => {
    const srcMatch = tag.match(/\bsrc="([^"]+)"/);
    if (!srcMatch) return tag;
    const clean = srcMatch[1].split('?')[0];
    if (!clean.startsWith('/images/') || clean.includes('/_r/') || !/\.(jpe?g|png|webp)$/i.test(clean)) return tag;
    const base = clean.replace(/^\/images\//, '').replace(/\.(jpe?g|png|webp)$/i, '');
    const version = (srcMatch[1].match(/[?&]v=([^"&]+)/) || [])[1] || '';
    const sizes = (tag.match(/\bsizes="([^"]+)"/) || [])[1] || '';
    const sizeAttr = sizes ? ` sizes="${sizes}"` : '';
    let img = tag;
    const info = dims()[clean];
    if (info && info.width && !/\bwidth=/.test(img)) img = img.replace(/<img\b/i, `<img width="${info.width}" height="${info.height}"`);
    if (!/\balt=/.test(img)) img = img.replace(/<img\b/i, `<img alt="${humanAlt(base)}"`);
    const eager = /fetchpriority="high"/i.test(img) || /\bh-hero-bg\b/.test(img);
    if (eager) img = img.replace(/\sloading="lazy"/i, '');
    else if (!/\bloading=/i.test(img)) img = img.replace(/<img\b/i, '<img loading="lazy"');
    if (!/\bdecoding=/i.test(img)) img = img.replace(/<img\b/i, '<img decoding="async"');
    const avif = srcset(base, 'avif', version);
    const webpOnImg = (img.match(/\bsrcset="([^"]+)"/) || [])[1] || '';
    const webp = /\.webp/i.test(webpOnImg) ? webpOnImg : srcset(base, 'webp', version);
    if (!avif && !webp) return img;
    const sources = [
      avif ? `<source type="image/avif" srcset="${avif}"${sizeAttr}>` : '',
      webp ? `<source type="image/webp" srcset="${webp}"${sizeAttr}>` : ''
    ].join('');
    return `<picture>${sources}${img}</picture>`;
  });
}

module.exports = { wrapPictures };
