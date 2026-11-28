/**
 * Compresses JPGs over 200 KB, then writes WebP and AVIF copies (full size and
 * 480 / 800 / 1200) into public/images/_r/. That folder is not committed; the
 * Netlify build creates it. Pages serve the copies with <picture>.
 */
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const ROOT = path.join(__dirname, '..', 'public', 'images');
const OUT = path.join(ROOT, '_r');
const WIDTHS = [480, 800, 1200];

function walk(dir, out = []) {
  for (const name of fs.readdirSync(dir)) {
    if (name === '_r') continue;
    const file = path.join(dir, name);
    if (fs.statSync(file).isDirectory()) walk(file, out);
    else if (/\.(jpe?g|png|webp)$/i.test(name)) out.push(file);
  }
  return out;
}

function newer(dest, src) {
  return fs.existsSync(dest) && fs.statSync(dest).mtimeMs >= fs.statSync(src).mtimeMs;
}

async function compressLargeJpegs(files) {
  const done = [];
  for (const file of files) {
    if (!/\.jpe?g$/i.test(file) || fs.statSync(file).size <= 200 * 1024) continue;
    const input = fs.readFileSync(file);
    const before = input.length;
    let quality = 78;
    let buf = input;
    while (quality >= 48) {
      buf = await sharp(input).rotate().jpeg({ quality, mozjpeg: true }).toBuffer();
      if (buf.length <= 200 * 1024) break;
      quality -= 6;
    }
    if (buf.length < before) {
      fs.writeFileSync(file, buf);
      done.push({ file, kb: Math.round(buf.length / 1024), quality });
    }
  }
  return done;
}

async function derivatives(files) {
  const manifest = {};
  let made = 0;
  for (const file of files) {
    const rel = path.relative(ROOT, file).split(path.sep).join('/');
    const base = rel.replace(/\.(jpe?g|png|webp)$/i, '');
    const meta = await sharp(file).metadata();
    manifest['/images/' + rel] = { width: meta.width || 0, height: meta.height || 0 };
    const jobs = [
      { dest: path.join(OUT, base + '.webp'), run: () => sharp(file).rotate().resize({ width: Math.min(1600, meta.width || 1600), withoutEnlargement: true }).webp({ quality: 68, effort: 4 }).toFile(path.join(OUT, base + '.webp')) },
      { dest: path.join(OUT, base + '.avif'), run: () => sharp(file).rotate().resize({ width: Math.min(1600, meta.width || 1600), withoutEnlargement: true }).avif({ quality: 45, effort: 2 }).toFile(path.join(OUT, base + '.avif')) }
    ];
    for (const width of WIDTHS) {
      const sized = Math.min(width, meta.width || width);
      jobs.push({
        dest: path.join(OUT, `${base}-${width}.webp`),
        run: () => sharp(file).rotate().resize({ width: sized, withoutEnlargement: true }).webp({ quality: 68, effort: 4 }).toFile(path.join(OUT, `${base}-${width}.webp`))
      });
      jobs.push({
        dest: path.join(OUT, `${base}-${width}.avif`),
        run: () => sharp(file).rotate().resize({ width: sized, withoutEnlargement: true }).avif({ quality: 45, effort: 2 }).toFile(path.join(OUT, `${base}-${width}.avif`))
      });
    }
    for (const job of jobs) {
      if (newer(job.dest, file)) continue;
      fs.mkdirSync(path.dirname(job.dest), { recursive: true });
      await job.run();
      made++;
    }
  }
  fs.mkdirSync(OUT, { recursive: true });
  fs.writeFileSync(path.join(OUT, 'manifest.json'), JSON.stringify(manifest));
  return made;
}

async function main() {
  const files = walk(ROOT);
  const compressed = await compressLargeJpegs(files);
  const made = await derivatives(files);
  console.log(`Images: ${files.length} sources, ${compressed.length} JPGs compressed under 200 KB, ${made} new WebP/AVIF files`);
  compressed.forEach((row) => console.log(`  ${row.kb} KB q${row.quality} ${path.relative(ROOT, row.file)}`));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
