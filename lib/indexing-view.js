/**
 * Admin > Website > Indexing (/dashboard?view=indexing).
 * Areas where Google has indexed at least one page, with every service in that area:
 * indexed, not indexed yet, or planned (with the date the daily run builds it).
 * Data: Supabase function seo_dashboard (key in env SEO_DASHBOARD_KEY), read live on each visit.
 */
const supabase = require("./supabase");

const SERVICES = [
  ["end-of-tenancy-cleaning", "End of tenancy"],
  ["domestic-cleaning", "Domestic"],
  ["deep-house-cleaning", "Deep"],
  ["airbnb-cleaning", "Airbnb"],
  ["carpet-cleaning-services", "Carpet"],
  ["after-builders-cleaning", "After builders"],
  ["upholstery-cleaning", "Upholstery"],
  ["mattress-cleaning", "Mattress"]
];
// Silvia's main areas first, in this order; every other area follows by number of indexed pages.
const FIRST = ["brentwood", "shenfield", "billericay", "ingatestone", "basildon", "chelmsford", "essex", "havering", "romford", "harold-wood",
  "harold-hill", "gidea-park", "hornchurch", "upminster", "emerson-park", "elm-park"];
const HUBS = { essex: "Essex", havering: "Havering", london: "London", redbridge: "Redbridge", newham: "Newham", "barking-and-dagenham": "Barking and Dagenham" };

const esc = (s) => String(s == null ? "" : s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const nice = (k) => HUBS[k] || k.split("-").map((w) => (["and", "atte"].includes(w) ? w : w[0].toUpperCase() + w.slice(1))).join(" ");
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const fmt = (d) => { if (!d) return ""; const x = new Date(d + "T12:00:00Z"); return x.getUTCDate() + " " + MONTHS[x.getUTCMonth()]; };
const isIndexed = (s) => /^submitted and indexed|^indexed/i.test(s || "");

function split(path) {
  const parts = path.replace(/^\/|\/$/g, "").split("/");
  const svc = parts[0];
  const key = parts[parts.length - 1];
  return { svc, key, slug: parts.slice(1).join("/") };
}

async function load() {
  const { data, error } = await supabase.rpc("seo_dashboard", { p_key: process.env.SEO_DASHBOARD_KEY || "" });
  if (error) throw new Error(error.message);
  return data;
}

function build(d) {
  const status = new Map((d.pages || []).map(([p, s]) => [p, s]));
  const areas = new Map();
  const area = (key) => {
    if (!areas.has(key)) areas.set(key, { key, name: nice(key), cells: {} });
    return areas.get(key);
  };
  for (const p of d.live || []) {
    const { svc, key, slug } = split(p);
    if (!slug || !SERVICES.some((s) => s[0] === svc)) continue;
    area(key).cells[svc] = { state: isIndexed(status.get(p)) ? "I" : "W", url: p };
  }
  for (const [url, svc, name, st, date] of d.plan || []) {
    if (!url || st !== "pending") continue;
    const { key } = split(url);
    const a = area(key);
    if (name && !HUBS[key]) a.name = name;
    if (!a.cells[svc]) a.cells[svc] = { state: "P", date };
  }
  const list = [...areas.values()].map((a) => {
    const c = Object.values(a.cells);
    a.indexed = c.filter((x) => x.state === "I").length;
    a.waiting = c.filter((x) => x.state === "W").length;
    a.planned = c.filter((x) => x.state === "P");
    return a;
  }).filter((a) => a.indexed > 0);
  list.sort((a, b) => {
    const ia = FIRST.indexOf(a.key), ib = FIRST.indexOf(b.key);
    if (ia !== -1 || ib !== -1) return (ia === -1 ? 999 : ia) - (ib === -1 ? 999 : ib);
    return b.indexed - a.indexed || a.name.localeCompare(b.name);
  });
  return list;
}

const CSS = `
.ix-areas{display:flex;flex-direction:column;gap:8px}
.ix-area{background:#fff;border:1px solid var(--line);border-radius:12px}
.ix-area>summary{list-style:none;cursor:pointer;display:flex;align-items:center;gap:12px;flex-wrap:wrap;padding:12px 16px;border-radius:12px}
.ix-area>summary::-webkit-details-marker{display:none}
.ix-area>summary:hover{background:#f3f7f6}
.ix-area>summary:focus-visible{outline:2px solid var(--g);outline-offset:2px}
.ix-name{font-weight:700;min-width:150px;display:flex;align-items:center;gap:8px}
.ix-name i{font-style:normal;color:var(--mut);transition:transform .15s;display:inline-block}
.ix-area[open] .ix-name i{transform:rotate(90deg)}
.ix-counts{display:flex;gap:6px;flex-wrap:wrap}
.ix-c{font-size:12px;font-weight:600;padding:3px 9px;border-radius:999px;white-space:nowrap}
.ix-c.I{background:#e3f5ea;color:#17703c}.ix-c.W{background:#fff4e0;color:#8a5a00}.ix-c.P{background:#e8f0fe;color:#1a56c4}
.ix-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(108px,1fr));gap:8px;padding:0 16px 16px}
.ix-cell{border-radius:10px;padding:10px 12px;font-size:13px;border:1px solid var(--line);text-decoration:none;color:var(--ink);display:block}
.ix-cell b{display:block;font-size:13px;margin-bottom:2px}
.ix-cell.I{background:#e3f5ea;border-color:#bfe3cc}.ix-cell.W{background:#fff4e0;border-color:#f1d9a8}
.ix-cell.P{background:#e8f0fe;border-color:#c6d7f7}.ix-cell.M{border-style:dashed;color:var(--mut)}
a.ix-cell:hover{border-color:var(--g)}
.ix-legend{display:flex;gap:8px;flex-wrap:wrap;margin:0 0 12px}
@media (max-width:600px){.ix-name{min-width:0;width:100%}}`;

async function indexingView() {
  let list;
  let d;
  try {
    d = await load();
    list = build(d);
  } catch (e) {
    return `<!--NAV:indexing--><h1>Indexing</h1><div class="msg err">Could not load the indexing data: ${esc(e.message)}</div>`;
  }
  const pagesIndexed = list.reduce((n, a) => n + a.indexed, 0);
  const pagesWaiting = list.reduce((n, a) => n + a.waiting, 0);
  const planned = list.reduce((n, a) => n + a.planned.length, 0);
  const kpi = (n, label) => `<div class="kpi"><b>${n}</b><span>${label}</span></div>`;
  const rows = list.map((a, i) => {
    const dates = a.planned.map((p) => p.date).filter(Boolean).sort();
    const range = dates.length ? (dates[0] === dates[dates.length - 1] ? fmt(dates[0]) : fmt(dates[0]) + " to " + fmt(dates[dates.length - 1])) : "";
    const counts = `<span class="ix-c I">${a.indexed} indexed</span>` +
      (a.waiting ? `<span class="ix-c W">${a.waiting} not indexed</span>` : "") +
      (a.planned.length ? `<span class="ix-c P">${a.planned.length} planned · ${range}</span>` : "");
    const cells = SERVICES.map(([svc, label]) => {
      const c = a.cells[svc];
      if (!c) return `<div class="ix-cell M"><b>${label}</b>Not planned</div>`;
      if (c.state === "P") return `<div class="ix-cell P"><b>${label}</b>Planned ${esc(fmt(c.date))}</div>`;
      return `<a class="ix-cell ${c.state}" href="https://sncleaningservices.co.uk${esc(c.url)}" target="_blank" rel="noopener"><b>${label}</b>${c.state === "I" ? "Indexed" : "Not indexed"}</a>`;
    }).join("");
    return `<details class="ix-area"${i === 0 ? " open" : ""}><summary><span class="ix-name"><i aria-hidden="true">›</i>${esc(a.name)}</span><span class="ix-counts">${counts}</span></summary><div class="ix-grid">${cells}</div></details>`;
  }).join("");
  return `<!--NAV:indexing--><style>${CSS}</style><h1>Indexing</h1><p class="lede">Checked ${esc(fmt(d.checked))}</p>
<div class="kpis">${kpi(list.length, "Areas indexed")}${kpi(pagesIndexed, "Pages indexed")}${kpi(pagesWaiting, "Pages not indexed")}${kpi(planned, "New pages planned")}</div>
<div class="ix-legend"><span class="ix-c I">Indexed</span><span class="ix-c W">Not indexed</span><span class="ix-c P">Planned</span></div>
<div class="ix-areas">${rows}</div>`;
}

module.exports = { indexingView, build };
