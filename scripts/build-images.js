/**
 * Makes smaller WebP copies of the site photos so phones don't download
 * desktop-sized JPGs. Output goes to public/images/_r/ (not committed; built
 * fresh on every deploy by `npm run build`).
 *
 *   public/images/services/domestic.jpg -> public/images/_r/services/domestic-480.webp, -800, -1200
 */
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const ROOT = path.join(__dirname, '..', 'public', 'images');
const OUT = path.join(ROOT, '_r');
const WIDTHS = [480, 800, 1200];
const SOURCES = ['hero-living-room.jpg', 'silvia.webp', 'about-cleaner.jpg', 'services', 'rooms'];

function listFiles() {
  const files = [];
  for (const s of SOURCES) {
    const p = path.join(ROOT, s);
    if (!fs.existsSync(p)) continue;
    if (fs.statSync(p).isDirectory()) {
      for (const f of fs.readdirSync(p)) if (/\.(jpe?g|png|webp)$/i.test(f)) files.push(path.join(s, f));
    } else files.push(s);
  }
  return files;
}

async function main() {
  const files = listFiles();
  let made = 0;
  for (const rel of files) {
    const src = path.join(ROOT, rel);
    const meta = await sharp(src).metadata();
    const base = rel.replace(/\.(jpe?g|png|webp)$/i, '');
    for (const w of WIDTHS) {
      const out = path.join(OUT, `${base}-${w}.webp`);
      if (fs.existsSync(out) && fs.statSync(out).mtimeMs >= fs.statSync(src).mtimeMs) continue;
      fs.mkdirSync(path.dirname(out), { recursive: true });
      await sharp(src).resize({ width: Math.min(w, meta.width), withoutEnlargement: true }).webp({ quality: 68, effort: 5 }).toFile(out);
      made++;
    }
  }
  console.log(`Responsive images: ${files.length} sources, ${made} new files in public/images/_r/`);
}

main().catch((e) => { console.error(e); process.exit(1); });
