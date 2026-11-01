// Shapes for the small "nearby areas" map on area pages, and the grouped
// directory of every other area. Both are worked out from data, so a new
// area page in Supabase shows up in the right place with nothing to wire up.
//
// The shapes are read once from views/partials/coverage-map.ejs (built by
// scripts/build-coverage-map.py), so the small map and the big map always
// use the same boundaries.
const fs = require('fs');
const path = require('path');

const SRC = fs.readFileSync(path.join(__dirname, '..', 'views', 'partials', 'coverage-map.ejs'), 'utf8');

// "M127 2l3 6l5 1z M..." -> absolute points, one array per ring.
function rings(d) {
  const out = [];
  let cur = null, x = 0, y = 0;
  const re = /([MlLz])\s*(-?\d+(?:\.\d+)?)?\s*(-?\d+(?:\.\d+)?)?/g;
  let m;
  while ((m = re.exec(d))) {
    const [, cmd, a, b] = m;
    if (cmd === 'M') { x = +a; y = +b; cur = [[x, y]]; out.push(cur); }
    else if (cmd === 'l' && cur) { x += +a; y += +b; cur.push([x, y]); }
    else if (cmd === 'L' && cur) { x = +a; y = +b; cur.push([x, y]); }
  }
  return out;
}
const ringsToD = (rs) => rs.map((r) => 'M' + r.map((p) => p.join(' ')).join('L') + 'z').join('');

const contextPaths = [];
const ctx = SRC.match(/<g class="cov-context"[^>]*>([\s\S]*?)<\/g>/);
if (ctx) for (const m of ctx[1].matchAll(/<path d="([^"]+)"/g)) contextPaths.push(m[1]);

const shapes = [];
for (const m of SRC.matchAll(/mapLink\(("[^"]*")\) %>" class="cov-area cov-([a-z]+)[\s\S]*?data-name="([^"]*)" data-cx="(\d+)" data-cy="(\d+)"[^>]*><path d="([^"]+)"/g)) {
  const pts = rings(m[6]).flat();
  const xs = pts.map((p) => p[0]), ys = pts.map((p) => p[1]);
  shapes.push({
    region: JSON.parse(m[1]), group: m[2], label: m[3], cx: +m[4], cy: +m[5], d: m[6], pts,
    box: [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)]
  });
}

// Two areas are neighbours when their outlines come within a few map units.
const NEAR = 2;
function touching(a, b) {
  if (a.box[0] > b.box[2] + NEAR || b.box[0] > a.box[2] + NEAR || a.box[1] > b.box[3] + NEAR || b.box[1] > a.box[3] + NEAR) return false;
  const pb = b.pts.filter((p) => p[0] >= a.box[0] - NEAR && p[0] <= a.box[2] + NEAR && p[1] >= a.box[1] - NEAR && p[1] <= a.box[3] + NEAR);
  for (const p of a.pts) for (const q of pb) if (Math.abs(p[0] - q[0]) <= NEAR && Math.abs(p[1] - q[1]) <= NEAR) return true;
  return false;
}
const neighbours = new Map(shapes.map((s) => [s.region, []]));
for (let i = 0; i < shapes.length; i++) {
  for (let j = i + 1; j < shapes.length; j++) {
    if (touching(shapes[i], shapes[j])) {
      neighbours.get(shapes[i].region).push(shapes[j].region);
      neighbours.get(shapes[j].region).push(shapes[i].region);
    }
  }
}
const byRegion = new Map(shapes.map((s) => [s.region, s]));

// The map shape for an area: itself, else the nearest area above it that is
// drawn (a town shows as its borough). "Romford / Thurrock Edge" is drawn as
// Thurrock, so towns under it are not matched to it.
function shapeFor(regionChainNames) {
  for (const n of regionChainNames) if (byRegion.has(n) && !/Thurrock/.test(n)) return byRegion.get(n);
  return null;
}

// Small map: this area in gold, its neighbours labelled, zoomed to fit them.
function miniMap(regionChainNames, hasPage) {
  const here = shapeFor(regionChainNames);
  if (!here) return null;
  const near = neighbours.get(here.region).map((r) => byRegion.get(r));
  const show = [here, ...near];
  let [x0, y0, x1, y1] = [Infinity, Infinity, -Infinity, -Infinity];
  for (const s of show) { x0 = Math.min(x0, s.box[0]); y0 = Math.min(y0, s.box[1]); x1 = Math.max(x1, s.box[2]); y1 = Math.max(y1, s.box[3]); }
  // Pad, and keep a 4:3 frame so every page's map is the same shape.
  let w = x1 - x0, h = y1 - y0;
  const pad = Math.max(w, h) * 0.08;
  x0 -= pad; y0 -= pad; w += pad * 2; h += pad * 2;
  if (w / h > 4 / 3) { const nh = w * 3 / 4; y0 -= (nh - h) / 2; h = nh; } else { const nw = h * 4 / 3; x0 -= (nw - w) / 2; w = nw; }
  const scale = w / 1000; // label size follows the zoom
  const fontSize = Math.max(10, Math.round(34 * scale * 10) / 10);
  // Drop a neighbour's label if it would overlap this area's label or one
  // already placed (text width estimated from its length).
  const boxOf = (s) => { const hw = s.label.length * fontSize * 0.29, hh = fontSize * 0.65; return [s.cx - hw, s.cy - hh, s.cx + hw, s.cy + hh]; };
  const hit = (a, b) => !(a[2] < b[0] || b[2] < a[0] || a[3] < b[1] || b[3] < a[1]);
  const placed = [boxOf(here)];
  const labelled = new Set();
  for (const s of near) { const b = boxOf(s); if (!placed.some((p) => hit(p, b))) { placed.push(b); labelled.add(s); } }
  return {
    viewBox: [x0, y0, w, h].map((v) => Math.round(v * 10) / 10).join(' '),
    context: contextPaths,
    others: shapes.filter((s) => !show.includes(s)).map((s) => ({ d: s.d, group: s.group })),
    near: near.map((s) => ({ d: s.d, group: s.group, label: labelled.has(s) ? s.label : '', cx: s.cx, cy: s.cy, hasPage: hasPage(s.region) })),
    here: { d: here.d, label: here.label, cx: here.cx, cy: here.cy },
    fontSize,
    neighbourRegions: near.map((s) => s.region)
  };
}

// Which part of London a borough is in, for the grouped directory.
const PART = {
  Central: ['Camden', 'Islington', 'Kensington and Chelsea', 'Westminster', 'City of London'],
  East: ['Barking and Dagenham', 'Hackney', 'Havering', 'Newham', 'Redbridge', 'Tower Hamlets', 'Waltham Forest'],
  North: ['Barnet', 'Enfield', 'Haringey'],
  South: ['Bexley', 'Bromley', 'Croydon', 'Greenwich', 'Kingston upon Thames', 'Lambeth', 'Lewisham', 'Merton', 'Richmond upon Thames', 'Southwark', 'Sutton', 'Wandsworth'],
  West: ['Brent', 'Ealing', 'Hammersmith and Fulham', 'Harrow', 'Hillingdon', 'Hounslow']
};
const GROUP_ORDER = ['East London', 'North London', 'Central London', 'South London', 'West London', 'Essex', 'Other areas'];
function groupFor(regionChainNames) {
  // London first: Romford sits under both Havering and an "Essex - Romford" region.
  for (const n of regionChainNames) for (const [part, list] of Object.entries(PART)) if (list.includes(n)) return `${part} London`;
  if (regionChainNames.some((n) => /^essex\b/i.test(n))) return 'Essex';
  return 'Other areas';
}

module.exports = { miniMap, neighbours, shapeFor, groupFor, GROUP_ORDER };
