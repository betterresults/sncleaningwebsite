/**
 * Admin > Website > Indexing (/dashboard?view=indexing).
 * Areas where Google has indexed at least one page, with every service in that area:
 * indexed, not indexed yet, or planned (with the date the daily run builds it).
 * Data: Supabase function seo_dashboard (key in env SEO_DASHBOARD_KEY), read live on each visit.
 */
// Plain fetch to the Supabase REST endpoint: the leads function bundle does not ship @supabase/supabase-js.
const SB_URL = process.env.SUPABASE_URL || "https://dkomihipebixlegygnoy.supabase.co";
const SB_ANON = process.env.SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRrb21paGlwZWJpeGxlZ3lnbm95Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzA1MDEwNTMsImV4cCI6MjA0NjA3NzA1M30.z4hlXMnyyleo4sWyPnFuKFC5-tkQw4lVcDiF8TRWla4";

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
// Silvia's main areas first inside each borough, in this order; every other area follows by number of indexed pages.
const FIRST = ["brentwood", "shenfield", "billericay", "ingatestone", "basildon", "chelmsford", "essex", "havering", "romford", "harold-wood",
  "harold-hill", "gidea-park", "hornchurch", "upminster", "emerson-park", "elm-park"];
const HUBS = { essex: "Essex", havering: "Havering", london: "London", redbridge: "Redbridge", newham: "Newham", "barking-and-dagenham": "Barking and Dagenham" };

// Page grouping: two parts (Essex, London), then by borough. Hub pages (essex, havering, ...) sit first in their own group.
const T = (names, borough) => Object.fromEntries(names.map((n) => [n, borough]));
const BOROUGH = {
  ...T(["brentwood", "shenfield", "ingatestone", "hutton", "warley", "pilgrims-hatch", "doddinghurst", "kelvedon-hatch", "mountnessing", "herongate", "west-horndon"], "Brentwood"),
  ...T(["basildon", "billericay", "wickford", "laindon", "pitsea", "langdon-hills"], "Basildon"),
  ...T(["chelmsford", "great-baddow", "writtle", "springfield", "broomfield"], "Chelmsford"),
  ...T(["southend-on-sea", "leigh-on-sea"], "Southend-on-Sea"),
  ...T(["rayleigh", "benfleet", "canvey-island"], "Castle Point and Rochford"),
  essex: "Essex",
  ...T(["havering", "romford", "harold-wood", "harold-hill", "gidea-park", "hornchurch", "upminster", "upminster-bridge", "emerson-park", "elm-park", "cranham", "rainham",
    "collier-row", "chase-cross", "ardleigh-green", "havering-atte-bower"], "Havering"),
  ...T(["barking-and-dagenham", "barking", "dagenham", "becontree", "barking-riverside", "creekmouth", "marks-gate", "thames-view"], "Barking and Dagenham"),
  ...T(["redbridge", "ilford", "gants-hill", "goodmayes", "hainault", "newbury-park", "seven-kings", "wanstead", "woodford", "woodford-bridge", "woodford-green", "woodford-wells"], "Redbridge"),
  ...T(["newham", "beckton", "custom-house", "east-ham", "little-ilford", "manor-park", "north-woolwich", "upton-park", "west-ham", "stratford", "canning-town", "forest-gate", "plaistow"], "Newham"),
  ...T(["waltham-forest", "walthamstow", "leyton", "leytonstone", "chingford"], "Waltham Forest")
};
// Regions shown on the page. Essex is one region; London is split into bigger areas, each showing every borough and area in it.
const REGION_OF = {
  ...T(["Essex", "Brentwood", "Basildon", "Chelmsford", "Southend-on-Sea", "Castle Point and Rochford"], "Essex"),
  ...T(["Havering", "Barking and Dagenham", "Redbridge", "Newham", "Waltham Forest", "Tower Hamlets", "Hackney"], "East London"),
  ...T(["Barnet", "Enfield", "Haringey", "Islington", "Camden"], "North London"),
  ...T(["Bexley", "Bromley", "Greenwich", "Lewisham", "Southwark", "Lambeth", "Croydon", "Sutton", "Merton", "Wandsworth", "Kingston"], "South London"),
  ...T(["Ealing", "Hillingdon", "Hounslow", "Harrow", "Brent", "Hammersmith and Fulham", "Richmond"], "West London"),
  ...T(["London", "Westminster", "Kensington and Chelsea"], "Central London")
};
const REGIONS = ["Essex", "East London", "North London", "South London", "West London", "Central London"];
const BOROUGH_ORDER = ["Essex", "Brentwood", "Basildon", "Chelmsford", "Southend-on-Sea", "Castle Point and Rochford", "Havering", "Barking and Dagenham", "Redbridge", "Newham", "Waltham Forest"];
const HUB_KEYS = new Set(["essex", "havering", "london", "redbridge", "newham", "barking-and-dagenham", "waltham-forest"]);
const groupOf = (key, slug) => {
  if (BOROUGH[key]) return BOROUGH[key];
  const top = (slug || "").split("/")[0];
  if (BOROUGH[top]) return BOROUGH[top];
  return nice(top || key);
};
const partOf = (g) => REGION_OF[g] || "Central London";

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
  const r = await fetch(SB_URL + "/rest/v1/rpc/seo_dashboard", {
    method: "POST",
    headers: { apikey: SB_ANON, Authorization: "Bearer " + SB_ANON, "Content-Type": "application/json" },
    body: JSON.stringify({ p_key: process.env.SEO_DASHBOARD_KEY || "" })
  });
  const data = await r.json().catch(() => null);
  if (!r.ok) throw new Error((data && data.message) || "HTTP " + r.status);
  return data;
}

function build(d) {
  const status = new Map((d.pages || []).map(([p, s]) => [p, s]));
  const info = new Map((d.pages || []).map(([p, , req, first, created, score]) => [p, { req, first, created, score }]));
  const areas = new Map();
  const area = (key) => {
    if (!areas.has(key)) areas.set(key, { key, name: nice(key), cells: {}, slug: "" });
    return areas.get(key);
  };
  for (const p of d.live || []) {
    const { svc, key, slug } = split(p);
    if (!slug || !SERVICES.some((s) => s[0] === svc)) continue;
    if (!area(key).slug) area(key).slug = slug;
    const inf = info.get(p) || {};
    const idx = isIndexed(status.get(p));
    const self = idx && !!inf.first && (!inf.req || inf.req > inf.first); // Google indexed it before we asked
    area(key).cells[svc] = { state: idx ? "I" : "W", url: p, self, first: inf.first, created: inf.created, score: inf.score };
  }
  for (const [url, svc, name, st, date] of d.plan || []) {
    if (!url || st !== "pending") continue;
    const { key, slug } = split(url);
    const a = area(key);
    if (!a.slug) a.slug = slug;
    if (name && !HUBS[key]) a.name = name;
    if (!a.cells[svc]) a.cells[svc] = { state: "P", date };
  }
  const list = [...areas.values()].map((a) => {
    const c = Object.values(a.cells);
    a.indexed = c.filter((x) => x.state === "I").length;
    a.waiting = c.filter((x) => x.state === "W").length;
    a.planned = c.filter((x) => x.state === "P");
    a.group = groupOf(a.key, a.slug);
    a.part = partOf(a.group);
    a.hub = HUB_KEYS.has(a.key);
    return a;
  }).filter((a) => a.indexed > 0 || a.part === "Essex"); // Essex: also new areas that only have planned pages
  list.unrequested = (d.pages || []).filter(([, st, req, first]) => isIndexed(st) && first && (!req || req > first)).length;
  list.before = (d.pages || []).filter(([, st, , first, created]) => isIndexed(st) && !first && created && created <= "2026-11-01").length;
  list.hasInfo = (d.pages || []).some((x) => x.length > 2);
  list.sort((a, b) => {
    if (a.hub !== b.hub) return a.hub ? -1 : 1;
    const ia = FIRST.indexOf(a.key), ib = FIRST.indexOf(b.key);
    if (ia !== -1 || ib !== -1) return (ia === -1 ? 999 : ia) - (ib === -1 ? 999 : ib);
    const first = (x) => x.planned.map((c) => c.date).filter(Boolean).sort()[0] || "9999";
    return b.indexed - a.indexed || first(a).localeCompare(first(b)) || a.name.localeCompare(b.name);
  });
  return list;
}


const CSS = `
.ixv{--ok:#2f8a4e;--wait:#c9821a;--plan:#3c6fb4;--plan-soft:#e8eef8;--later:#8a8f8c;--dsp:"Fraunces",Georgia,serif;font-family:"Instrument Sans",Inter,system-ui,sans-serif;display:flex;flex-direction:column;gap:22px}
.ixv h1,.ixv h2,.ixv h3{font-family:var(--dsp);font-weight:600;margin:0;letter-spacing:0}
.ixv h1{font-size:clamp(26px,4vw,34px)}.ixv h2{font-size:22px}
.ixv .sub{color:var(--mut);margin:4px 0 0;font-size:14px}
.ixv .box{background:#fff;border:1px solid var(--line);border-radius:12px;padding:18px}
.ixv .nums{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:12px}
.ixv .num{background:#fff;border:1px solid var(--line);border-radius:12px;padding:14px 16px;font-size:13px;color:var(--mut)}
.ixv .num b{display:block;font-family:var(--dsp);font-size:28px;color:var(--ink);font-variant-numeric:tabular-nums;line-height:1.2}
.ixv .legend{display:flex;flex-wrap:wrap;gap:16px;font-size:13px;color:var(--mut);align-items:center}
.ixv .sw{display:inline-block;width:18px;height:14px;border-radius:4px;vertical-align:-2px;margin-right:6px}
.ixv .c-I{background:var(--ok)}.ixv .c-W{background:var(--wait)}.ixv .c-P{background:var(--plan-soft);border:1.5px solid var(--plan)}.ixv .c-M{border:1.5px dashed var(--later)}
.ixv .part{display:flex;flex-direction:column;gap:10px}
.ixv details.bor{background:#fff;border:1px solid var(--line);border-radius:12px}
.ixv details.bor>summary{list-style:none;cursor:pointer;display:flex;align-items:center;gap:12px;flex-wrap:wrap;padding:14px 18px;border-radius:12px}
.ixv details.bor>summary::-webkit-details-marker{display:none}
.ixv details.bor>summary:hover{background:#f6f8f7}
.ixv details.bor>summary:focus-visible{outline:2px solid var(--g);outline-offset:2px}
.ixv .bname{font-family:var(--dsp);font-size:20px;font-weight:600;min-width:200px;display:flex;align-items:center;gap:10px}
.ixv .bname i{font-style:normal;font-family:Inter,system-ui,sans-serif;color:var(--mut);transition:transform .15s;display:inline-block}
.ixv details[open] .bname i{transform:rotate(90deg)}
.ixv .bname small{font-family:"Instrument Sans",system-ui,sans-serif;font-size:13px;font-weight:500;color:var(--mut)}
.ixv .pills{display:flex;gap:6px;flex-wrap:wrap}
.ixv .p{font-size:12px;font-weight:600;padding:4px 10px;border-radius:6px;white-space:nowrap}
.ixv .p.I{background:var(--ok);color:#fff}.ixv .p.W{background:var(--wait);color:#fff}.ixv .p.P{background:var(--plan-soft);color:var(--plan);box-shadow:inset 0 0 0 1.5px var(--plan)}.ixv .p.M{color:var(--later);box-shadow:inset 0 0 0 1.5px var(--later)}
.ixv .scroll{overflow-x:auto;padding:0 12px 14px}
.ixv table{border-collapse:separate;border-spacing:4px;width:100%;min-width:820px;table-layout:fixed;font-size:13px;background:none;border:0;border-radius:0}
.ixv th,.ixv td{border-bottom:0;padding:4px;vertical-align:middle}
.ixv th{background:none;font-weight:600;color:var(--mut);text-align:center;font-size:12px;text-transform:none;letter-spacing:0;vertical-align:bottom}
.ixv th.area,.ixv td.area{text-align:left;white-space:nowrap;padding-right:10px;overflow:hidden;text-overflow:ellipsis}.ixv th.area{width:190px}
.ixv td.area{font-weight:500;color:var(--ink);font-size:14px}.ixv td.area small{color:var(--mut);font-weight:400}
.ixv td.cell{height:32px;border-radius:6px;text-align:center;font-size:12px;font-weight:600;font-variant-numeric:tabular-nums;padding:0}
.ixv td.cell a{color:inherit;text-decoration:none;display:block;line-height:32px;font-weight:600}
.ixv td.I{background:var(--ok);color:#fff}.ixv td.W{background:var(--wait);color:#fff}
.ixv td.P{background:var(--plan-soft);box-shadow:inset 0 0 0 1.5px var(--plan);color:var(--plan)}
.ixv td.M{box-shadow:inset 0 0 0 1.5px var(--later);color:var(--later);font-weight:500;background:repeating-linear-gradient(135deg,transparent 0 6px,#f3f4f3 6px 8px)}
.ixv td.cell a:focus-visible{outline:2px solid var(--g);outline-offset:2px}
.ixv .days{display:grid;grid-template-columns:repeat(auto-fit,minmax(250px,1fr));gap:12px}
.ixv .day h3{font-size:17px;margin:0 0 4px}
.ixv .day .meta{font-size:12px;color:var(--mut);margin:0 0 6px}
.ixv .day ul{margin:0;padding-left:18px;font-size:14px}
.ixv .note{font-size:13px;color:var(--mut);margin:0}
.ixv tr.grp td{padding:14px 4px 2px;font-size:11px;letter-spacing:.06em;text-transform:uppercase;color:var(--mut);font-weight:600}
.ixv td.S,.ixv .c-S{position:relative}
.ixv td.S::after,.ixv .c-S::after{content:"";position:absolute;top:4px;right:4px;width:7px;height:7px;border-radius:50%;background:#fff}
.ixv .c-S::after{top:3px;right:3px;width:5px;height:5px}
.ixv .pat{display:flex;flex-direction:column;gap:8px;background:#fff;border:1px solid var(--line);border-radius:12px;padding:14px 18px}
.ixv .pat div{display:flex;flex-wrap:wrap;gap:6px;align-items:center}.ixv .pat b{font-size:13px;min-width:90px}
.ixv table.list{min-width:600px;border-collapse:collapse;table-layout:auto}
.ixv table.list th{text-align:left;font-size:12px;padding:6px 8px;border-bottom:1px solid var(--line)}
.ixv table.list td{padding:7px 8px;border-bottom:1px solid var(--line);font-size:14px}
.ixv table.list td a{color:var(--g)}
@media (max-width:600px){.ixv .bname{min-width:0;width:100%}.ixv .box{padding:14px}}`;

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const longDate = (d) => { const x = new Date(d + "T12:00:00Z"); return DAYS[x.getUTCDay()] + " " + x.getUTCDate() + " " + MONTHS[x.getUTCMonth()]; };
const range = (dates) => {
  const s = dates.filter(Boolean).sort();
  if (!s.length) return "";
  return s[0] === s[s.length - 1] ? fmt(s[0]) : fmt(s[0]) + " to " + fmt(s[s.length - 1]);
};
const pills = (rows) => {
  const cells = rows.flatMap((a) => SERVICES.map(([svc]) => a.cells[svc]));
  const n = (st) => cells.filter((c) => (st === "M" ? !c : c && c.state === st)).length;
  const planned = cells.filter((c) => c && c.state === "P");
  return (n("I") ? `<span class="p I">${n("I")} indexed</span>` : "") +
    (n("W") ? `<span class="p W">${n("W")} not indexed yet</span>` : "") +
    (planned.length ? `<span class="p P">${planned.length} planned · ${range(planned.map((c) => c.date))}</span>` : "") +
    (n("M") ? `<span class="p M">${n("M")} not planned</span>` : "");
};

function table(rows) {
  const head = `<thead><tr><th class="area" scope="col">Area</th>${SERVICES.map(([, l]) => `<th scope="col">${l}</th>`).join("")}</tr></thead>`;
  // Borough headers inside the region. Boroughs with only their own page are listed together at the end.
  const by = new Map();
  for (const a of rows) { if (!by.has(a.group)) by.set(a.group, []); by.get(a.group).push(a); }
  const order = (g) => { const i = BOROUGH_ORDER.indexOf(g); return i === -1 ? 999 : i; };
  const multi = [...by.entries()].filter(([, r]) => r.length > 1).sort((x, y) => order(x[0]) - order(y[0]) || x[0].localeCompare(y[0]));
  const single = [...by.entries()].filter(([, r]) => r.length === 1).sort((x, y) => order(x[0]) - order(y[0]) || y[1][0].indexed - x[1][0].indexed || x[0].localeCompare(y[0])).flatMap(([, r]) => r);
  const top = single.filter((a) => a.key === "essex" || a.key === "london"); // county and London main pages, first and without a header
  const rest = single.filter((a) => !top.includes(a));
  const sections = [["", top], ...multi.map(([g, r]) => [g, r])];
  if (rest.length) sections.push([multi.length ? "Other boroughs" : "", rest]);
  const span = SERVICES.length + 1;
  const row = (a) => {
    const label = esc(a.name) + (a.hub ? " <small>(main page)</small>" : "");
    return `<tr><td class="area">${label}</td>` + SERVICES.map(([svc, l]) => {
      const c = a.cells[svc];
      const what = esc(l + " in " + a.name);
      if (!c) return `<td class="cell M" title="${what}: not planned yet">not planned</td>`;
      if (c.state === "P") return `<td class="cell P" title="${what}: built on ${esc(longDate(c.date))}">${esc(fmt(c.date))}</td>`;
      const st = c.state === "I" ? (c.self ? "indexed without a request" : "indexed") : "not indexed yet";
      return `<td class="cell ${c.state}${c.self ? " S" : ""}"><a href="https://sncleaningservices.co.uk${esc(c.url)}" target="_blank" rel="noopener" title="${what}: ${st}" aria-label="${what}: ${st}">${c.state === "I" ? "✓" : "·"}</a></td>`;
    }).join("") + "</tr>";
  };
  const body = sections.map(([g, r]) => (g ? `<tr class="grp"><td colspan="${span}">${esc(g)}</td></tr>` : "") + r.map(row).join("")).join("");
  return `<table>${head}<tbody>${body}</tbody></table>`;
}

async function indexingView() {
  let list;
  let d;
  try {
    d = await load();
    list = build(d);
  } catch (e) {
    return `<!--NAV:indexing--><h1>Indexing</h1><div class="msg err">Could not load the indexing data: ${esc(e.message)}</div>`;
  }
  const cells = list.flatMap((a) => SERVICES.map(([svc]) => a.cells[svc]));
  const count = (st) => cells.filter((c) => c && c.state === st).length;
  const num = (n, label) => `<div class="num"><b>${n}</b>${label}</div>`;

  const regions = REGIONS.map((r, i) => {
    const rows = list.filter((a) => a.part === r);
    if (!rows.length) return "";
    const boroughs = new Set(rows.map((a) => a.group)).size;
    const sub = rows.length + (rows.length === 1 ? " area" : " areas") + (boroughs > 1 ? " · " + boroughs + " boroughs" : "");
    return `<details class="bor"${i === 0 ? " open" : ""}><summary><span class="bname"><i aria-hidden="true">›</i>${esc(r)} <small>${sub}</small></span><span class="pills">${pills(rows)}</span></summary><div class="scroll">${table(rows)}</div></details>`;
  }).join("");

  // Pages Google indexed without us asking: the pattern to learn from.
  const selfRows = list.flatMap((a) => SERVICES.filter(([svc]) => a.cells[svc] && a.cells[svc].self).map(([svc, l]) => ({ a, l, c: a.cells[svc] })))
    .sort((x, y) => (y.c.first || "").localeCompare(x.c.first || "") || x.a.name.localeCompare(y.a.name));
  const days = (c) => (c.first && c.created ? Math.max(0, Math.round((new Date(c.first) - new Date(c.created)) / 864e5)) : null);
  const tally = (f) => { const m = {}; for (const r of selfRows) { const k = f(r); m[k] = (m[k] || 0) + 1; } return Object.entries(m).sort((x, y) => y[1] - x[1]); };
  const dl = selfRows.map((r) => days(r.c)).filter((x) => x != null).sort((x, y) => x - y);
  const scored = selfRows.filter((r) => r.c.score);
  const pat = selfRows.length ? `<div class="pat">
<div><b>By region</b>${tally((r) => r.a.part).map(([k, n]) => `<span class="p I">${esc(k)} ${n}</span>`).join("")}</div>
<div><b>By service</b>${tally((r) => r.l).map(([k, n]) => `<span class="p I">${esc(k)} ${n}</span>`).join("")}</div>
<div><b>Speed</b><span class="p P">${dl.length ? "typically " + dl[Math.floor(dl.length / 2)] + " days after the page went live" : "not enough data"}</span>${scored.length ? `<span class="p P">${scored.length} of ${selfRows.length} had a NeuronWriter score (average ${Math.round(scored.reduce((n, r) => n + r.c.score, 0) / scored.length)})</span>` : ""}</div>
</div>` : "";
  const selfTable = selfRows.length ? `<div class="box scroll"><table class="list"><thead><tr><th>Page</th><th>Region</th><th>Found indexed</th><th>Days after going live</th><th>Score</th></tr></thead><tbody>${selfRows.map((r) => `<tr><td><a href="https://sncleaningservices.co.uk${esc(r.c.url)}" target="_blank" rel="noopener">${esc(r.l)} in ${esc(r.a.name)}</a></td><td>${esc(r.a.part)}</td><td>${esc(fmt(r.c.first))}</td><td>${days(r.c) == null ? "" : days(r.c)}</td><td>${r.c.score || ""}</td></tr>`).join("")}</tbody></table></div>` : "";
  const selfSection = `<section class="part"><h2>Indexed without a request</h2><p class="sub">Pages Google indexed on its own, before we asked for indexing. Marked with a white dot in the tables above. Tracked from 1 Nov; ${list.before} pages were already indexed before tracking began and are not counted.</p>${list.hasInfo ? pat + selfTable : `<p class="note">Tracking starts with the next data update.</p>`}</section>`;

  const plan = list.flatMap((a) => SERVICES.filter(([svc]) => a.cells[svc] && a.cells[svc].state === "P").map(([svc, l]) => ({ date: a.cells[svc].date, label: l, area: a.name })));
  const byDate = {};
  for (const p of plan) if (p.date) (byDate[p.date] = byDate[p.date] || []).push(p);
  const dates = Object.keys(byDate).sort();
  const next = dates.slice(0, 10);
  const later = dates.slice(10).reduce((n, k) => n + byDate[k].length, 0);
  const dayCards = next.map((k) => {
    const arr = byDate[k];
    const areas = [...new Set(arr.map((p) => p.area))];
    return `<div class="box day"><h3>${esc(longDate(k))}</h3><p class="meta">${arr.length} pages · ${esc(areas.join(", "))}</p><ul>${arr.map((p) => `<li>${esc(p.label)} in ${esc(p.area)}</li>`).join("")}</ul></div>`;
  }).join("");

  return `<!--NAV:indexing--><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,600&family=Instrument+Sans:wght@400;500;600&display=swap"><style>${CSS}</style>
<div class="ixv">
<header><h1>Indexing</h1><p class="sub">Areas where Google has indexed at least one page, plus the new Essex areas in the plan. Checked ${esc(fmt(d.checked))}.</p></header>
<div class="nums">${num(list.filter((a) => a.indexed > 0).length, "areas with an indexed page")}${num(count("I"), "pages indexed")}${num(list.hasInfo ? list.unrequested : "–", "indexed without a request")}${num(count("W"), "pages not indexed yet")}${num(count("P"), "new pages planned")}</div>
<div class="box legend"><span><span class="sw c-I"></span>Indexed</span><span><span class="sw c-I c-S"></span>Indexed without a request</span><span><span class="sw c-W"></span>Live, not indexed yet</span><span><span class="sw c-P"></span>Planned, built on that date</span><span><span class="sw c-M"></span>Not planned yet</span></div>
<section class="part">${regions}</section>
${selfSection}
<section class="part"><h2>Plan by date</h2><div class="days">${dayCards}</div>${later ? `<p class="note">After ${esc(fmt(next[next.length - 1]))}, ${later} more pages up to ${esc(fmt(dates[dates.length - 1]))}, in the same order.</p>` : ""}</section>
</div>`;
}

module.exports = { indexingView, build };
