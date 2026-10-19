/**
 * Password-protected leads dashboard at /dashboard (same password as /applicants; /leads redirects here).
 * Password: the DASHBOARD_PASSWORD environment variable in Netlify (a redeploy picks up a new one).
 *
 *   /dashboard                 all leads, search by name / email / phone, filter by status
 *   /dashboard?id=L...         one lead: answers, where they came from, journey, Meta log,
 *                          change status, add booking value (sends Purchase to Meta once)
 *   /dashboard?view=report     leads, bookings and revenue per campaign
 *   /dashboard?view=settings   Meta pixels + tokens, and which pixel each landing page uses
 */

const F = require("./funnel");
const esc = F.esc;
const UI = require("./admin-ui");

const STATUSES = ["New", "Contacted", "Quote Sent", "Booked", "Completed", "Lost"];
const BOOKED = ["Booked", "Completed"];
const BOOKED_VIA = {
  phone: { label: "Phone", source: "phone_call", oai: "phone_call", send: true },
  whatsapp: { label: "WhatsApp", source: "chat", oai: "other", send: true },
  manual: { label: "Other / in person", source: "other", oai: "other", send: true },
  dilvon: { label: "Online booking form (Dilvon tells Meta itself)", source: "", oai: "web", send: false }
};

const html = (body, extra) => Object.assign({
  statusCode: 200, headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" }, body
}, extra || {});
const redirect = (to, cookie) => ({
  statusCode: 302, headers: Object.assign({ location: to }, cookie ? { "set-cookie": cookie } : {}), body: ""
});

function shell(title, inner) {
  const m = inner.match(/^<!--NAV:(\w+)-->/);
  const body = m ? UI.layout(m[1] === "list" ? "leads" : m[1], inner.slice(m[0].length)) : `<div class="wrap">${inner}</div>`;
  return `<!doctype html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex">
<title>${esc(title)}</title><style>
:root{--g:#1f6b66;--ink:#1d2926;--mut:#5b6b67;--line:#e2e8e6;--bg:#f6f8f7}
*{box-sizing:border-box}body{margin:0;font:15px/1.5 Inter,system-ui,-apple-system,Segoe UI,sans-serif;color:var(--ink);background:var(--bg)}
.wrap{max-width:1180px;margin:0 auto;padding:20px 16px 60px}
h1{font-size:26px;margin:0 0 4px;letter-spacing:-.01em}.lede{color:var(--mut);margin:0 0 20px}h2{font-size:17px;margin:22px 0 10px}
.card{background:#fff;border:1px solid var(--line);border-radius:12px;padding:16px;margin-bottom:14px}
table{width:100%;border-collapse:collapse;background:#fff;border:1px solid var(--line);border-radius:12px;overflow:hidden}
th,td{text-align:left;padding:10px 12px;border-bottom:1px solid var(--line);vertical-align:top;font-size:14px}th{background:#f0f4f3;font-size:12px;text-transform:uppercase;letter-spacing:.03em;color:var(--mut)}
tr:last-child td{border-bottom:0}td a{color:var(--g);font-weight:600}
.scroll{overflow-x:auto}.mut{color:var(--mut);font-size:13px}
.pill{display:inline-block;padding:2px 9px;border-radius:999px;font-size:12px;font-weight:600;background:#eef2f1}
.s-New{background:#e8f0fe;color:#1a56c4}.s-Contacted{background:#fff4e0;color:#8a5a00}.s-Quote{background:#f1e8fd;color:#6a2fb8}.s-Booked,.s-Completed{background:#e3f5ea;color:#17703c}.s-Lost{background:#fdeaea;color:#a62626}
.ok{color:#17703c;font-weight:600}.bad{color:#a62626;font-weight:600}
form.inline{display:flex;gap:8px;flex-wrap:wrap;align-items:end}
input,select,textarea{font:inherit;padding:9px 11px;border:1px solid #cfd8d5;border-radius:8px;background:#fff;min-width:0}
textarea{width:100%;min-height:70px}label{display:block;font-size:13px;font-weight:600;margin-bottom:4px}
button,.btn{font:600 14px Inter,system-ui,sans-serif;padding:10px 16px;border:0;border-radius:8px;background:var(--g);color:#fff;cursor:pointer;text-decoration:none;display:inline-block}
button.grey{background:#e9eeec;color:var(--ink)}button.red{background:#fdeaea;color:#a62626}
.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:14px}
dl{margin:0;display:grid;grid-template-columns:max-content 1fr;gap:4px 14px}dt{color:var(--mut);font-size:13px}dd{margin:0;word-break:break-word}
.journey{font-weight:600}.msg{padding:10px 14px;border-radius:8px;background:#e3f5ea;color:#17703c;margin-bottom:14px}.msg.err{background:#fdeaea;color:#a62626}
details.ans{margin-top:6px}details.ans summary{cursor:pointer;color:var(--g);font-weight:600;font-size:13px;list-style:none;display:inline-flex;gap:4px;align-items:center;padding:3px 8px;border:1px solid var(--line);border-radius:999px;background:#f0f4f3}details.ans summary::-webkit-details-marker{display:none}details.ans dl{margin-top:8px;padding:10px;background:#f6f8f7;border-radius:8px;min-width:240px}
.kpis{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:12px;margin-bottom:18px}.kpi{background:#fff;border:1px solid var(--line);border-radius:14px;padding:14px 16px}.kpi b{display:block;font-size:26px;letter-spacing:-.02em;line-height:1.2}.kpi span{color:var(--mut);font-size:13px}.kpi.warn{border-color:#f0c9c9;background:#fff7f7}.kpi.warn b{color:#a62626}
.goals{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:12px}.goal .gtop{display:flex;justify-content:space-between;align-items:start;gap:8px}.goal .gnum{margin:6px 0}.goal .gnum b{font-size:24px}.bar{height:10px;background:#e9eeec;border-radius:999px;overflow:hidden;margin:6px 0}.bar span{display:block;height:100%;background:var(--g)}.goal.done .bar span{background:#17703c}.linkbtn{background:none;color:var(--mut);padding:0 4px;font-size:14px}
.cols{display:grid;grid-template-columns:2fr 1fr;gap:14px}@media(max-width:1000px){.cols{grid-template-columns:1fr}}
.card h2{margin-top:0}.chead{display:flex;justify-content:space-between;align-items:baseline;gap:10px;margin-bottom:10px}.chead h2{margin:0}.chead a{color:var(--g);font-weight:600;font-size:13px;text-decoration:none}
.chart{display:flex;align-items:flex-end;gap:6px;height:150px;padding-top:8px}.chart .c{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:flex-end;height:100%;gap:4px;min-width:0}.chart .c i{display:block;width:100%;max-width:28px;background:var(--g);border-radius:5px 5px 2px 2px;min-height:2px}.chart .c em{font-style:normal;font-size:11px;color:var(--mut)}.chart .c small{font-size:11px;font-weight:700;color:var(--ink);min-height:14px}
.srcrow{display:grid;grid-template-columns:1fr auto;gap:2px 10px;margin-bottom:10px;font-size:14px}.srcrow .bar{grid-column:1/-1;height:7px;margin:0}
.mini td,.mini th{padding:8px 10px}.mini{border:0}.mini tr td{border-bottom:1px solid var(--line)}
.phead{display:flex;justify-content:space-between;align-items:flex-start;gap:12px;flex-wrap:wrap}.phead .lede{margin-bottom:16px}
.pname{display:flex;align-items:center;gap:8px;flex-wrap:wrap}.pname a{color:var(--ink)}a.num{display:inline-block;min-width:34px;padding:3px 10px;border-radius:8px;background:#eef4f3;color:var(--g);font-weight:700;text-decoration:none;text-align:center}a.num:hover{background:var(--g);color:#fff}
.copybtn{font:600 12px Inter,system-ui,sans-serif;padding:4px 9px;border-radius:999px;background:#eef4f3;color:var(--g);border:1px solid #d5e4e1}.copybtn.big{font-size:14px;padding:9px 14px;border-radius:8px}
dialog.dlg{border:0;border-radius:14px;padding:22px;width:min(420px,92vw);box-shadow:0 20px 60px rgba(0,0,0,.25)}dialog.dlg::backdrop{background:rgba(18,59,57,.35)}dialog.dlg h2{margin:0 0 14px}dialog.dlg input{width:100%;margin-bottom:12px}dialog.dlg .btns{display:flex;gap:8px;margin-top:6px}
.subtabs{display:flex;gap:6px;margin:0 0 18px;flex-wrap:wrap}.subtabs a{padding:7px 14px;border-radius:8px;color:var(--mut);text-decoration:none;font-weight:600;font-size:14px;border:1px solid transparent}.subtabs a.on{background:#fff;border-color:var(--line);color:var(--ink)}
code{font-size:12px;background:#f0f4f3;padding:1px 5px;border-radius:4px;word-break:break-all}
</style></head><body>${body}</body></html>`;
}

const COPY_ICON = `<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="vertical-align:-2px"><rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h10"/></svg>`;
const COPY_JS = `<script>document.addEventListener("click",function(e){var b=e.target.closest("[data-copy]");if(!b)return;navigator.clipboard.writeText(b.getAttribute("data-copy")).then(function(){var t=b.innerHTML;b.textContent="Copied";setTimeout(function(){b.innerHTML=t},1500)});});</script>`;
const navBar = (on) => `<!--NAV:${on}-->`;

function loginPage(msg) {
  return shell("Admin login – SN Cleaning", `<div class="card" style="max-width:380px;margin:70px auto;padding:28px">
<div style="display:flex;align-items:center;gap:10px;margin-bottom:18px"><b style="display:grid;place-items:center;width:38px;height:38px;border-radius:10px;background:#123b39;color:#fff">SN</b><div><strong>SN Cleaning</strong><div class="mut">Admin dashboard</div></div></div>
${msg ? `<p class="bad">${esc(msg)}</p>` : ""}
<form method="post"><label for="pw">Password</label>
<input id="pw" type="password" name="password" autocomplete="current-password" style="width:100%;margin-bottom:14px" autofocus>
<button type="submit" style="width:100%">Log in</button></form></div>`);
}

/* ---------- attribution helpers ---------- */

function sourceOf(t) {
  t = t || {};
  const src = (t.utm_source || "").toLowerCase();
  if (/^instant_form/.test(t.utm_medium || "")) return "Meta (Facebook form)";
  if (t.fbclid || /facebook|^fb$|instagram|^ig$|meta/.test(src)) return "Meta";
  if (src === "partner") return "Partner";
  if (src) return "Other (" + t.utm_source + ")";
  const ref = (t.referrer || "").toLowerCase();
  if (/google\.|bing\.|duckduckgo|yahoo\./.test(ref)) return "Organic";
  if (ref && ref.indexOf("sncleaningservices.co.uk") === -1) return "Other (" + ref.replace(/^https?:\/\//, "").split("/")[0] + ")";
  return "Direct";
}

function journeyLine(l) {
  const parts = [sourceOf(l.first)];
  if (l.source === "facebook_form") parts.push("Facebook form");
  else parts.push((l.page || "") + " landing page", l.partial ? "Typed details, didn't press Next" : "Lead");
  const seen = new Set();
  (l.journey || []).forEach((j) => {
    if (j.type === "lead" || j.type === "status" || j.type === "started") return;
    const label = j.detail.split(":")[0];
    if (!seen.has(label)) { seen.add(label); parts.push(label); }
  });
  if (BOOKED.includes(l.status)) parts.push(l.status);
  else if (l.status === "Lost") parts.push("Lost");
  return parts.join(" → ");
}

const fmtDate = (iso) => {
  if (!iso) return "";
  return new Date(iso).toLocaleString("en-GB", { timeZone: "Europe/London", day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
};
const money = (n) => "£" + (Number(n) || 0).toLocaleString("en-GB", { minimumFractionDigits: 0, maximumFractionDigits: 2 });
const statusPill = (s) => `<span class="pill s-${esc(String(s).split(" ")[0])}">${esc(s)}</span>`;
const PARTIAL_PILL = `<span class="pill s-Lost" title="They typed their details but left before pressing Next">Didn't finish</span>`;
const tidy = (v) => { const t = String(v == null ? "" : v).replace(/_/g, " ").replace(/\s+/g, " ").trim(); return t.charAt(0).toUpperCase() + t.slice(1); };
const answersList = (l) => Object.entries(l.answers || {}).map(([k, v]) => `<dt>${esc(tidy(k))}</dt><dd>${esc(tidy(v))}</dd>`).join("");
const ANS_ICON = `<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="vertical-align:-2px"><rect x="8" y="2" width="8" height="4" rx="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><path d="M8 11h8M8 15h6"/></svg>`;
const answersPop = (l) => !Object.keys(l.answers || {}).length ? "" :
  `<details class="ans"><summary title="See all their answers">${ANS_ICON} Answers</summary><dl>${answersList(l)}</dl></details>`;
const nameOf = (l) => [l.firstName, l.lastName].filter(Boolean).join(" ") || (l.source === "facebook_form" ? "(Facebook form, not read yet)" : "(no name)");

async function allLeads(st) {
  const { blobs } = await st.leads.list();
  const rows = await Promise.all(blobs.map((b) => st.leads.get(b.key, { type: "json" })));
  return rows.filter(Boolean).sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""));
}

function metaSummary(l) {
  const lead = (l.meta || []).find((m) => m.event === "Lead");
  const purchase = (l.meta || []).find((m) => m.event === "Purchase");
  const bit = (m, name) => !m ? "" : (m.ok ? `<span class="ok">${name} sent</span>` : `<span class="bad" title="${esc(m.response)}">${name} not sent</span>`);
  const last = (ev) => (l.meta || []).filter((m) => m.event === ev).pop();
  return [bit(lead, "Lead"), bit(purchase, "Purchase"), bit(last("lead_created"), "ChatGPT lead"), bit(last("appointment_scheduled"), "ChatGPT booking")].filter(Boolean).join("<br>") || `<span class="mut">–</span>`;
}

/* ---------- views ---------- */

function listView(leads, q, status, msg) {
  const needle = (q || "").trim().toLowerCase();
  const digits = needle.replace(/\D/g, "");
  let rows = leads;
  if (needle) {
    rows = rows.filter((l) => (l.firstName || "").toLowerCase().includes(needle) ||
      (l.email || "").toLowerCase().includes(needle) ||
      (digits.length >= 4 && (l.phone || "").replace(/\D/g, "").includes(digits.replace(/^44/, "").replace(/^0/, ""))));
  }
  if (status === "partial") rows = rows.filter((l) => l.partial);
  else if (status) rows = rows.filter((l) => l.status === status);

  const body = rows.map((l) => `<tr>
<td><a href="/dashboard?id=${esc(l.id)}">${esc(nameOf(l))}</a>${l.partial ? " " + PARTIAL_PILL : ""}<div class="mut">${esc(l.email)}<br>${esc(l.phone)}${l.postcode ? " · " + esc(l.postcode) : ""}</div>${answersPop(l)}</td>
<td>${esc(fmtDate(l.createdAt))}</td>
<td>${statusPill(l.status)}${l.value ? `<div class="mut">${money(l.value)}</div>` : ""}</td>
<td>${esc(sourceOf(l.first))}<div class="mut">${esc((l.first || {}).utm_campaign || "")}</div></td>
<td class="journey">${esc(journeyLine(l))}</td>
<td>${metaSummary(l)}</td>
<td>${l.dilvon && l.dilvon.ok ? '<span class="ok">✓ Sent</span>' : (l.dilvon ? `<span class="bad" title="${esc(l.dilvon.response)}">✗ Not sent</span><div class="mut">${esc(String(l.dilvon.response).slice(0, 60))}</div>` : '<span class="mut">–</span>')}${l.dilvon ? `<div class="mut">${esc(fmtDate(l.dilvon.at))}</div>` : ""}</td></tr>`).join("");

  return shell("Leads", `${navBar("list")}<h1>Leads <span class="mut">(${rows.length})</span></h1>
${msg ? `<div class="msg">${esc(msg)}</div>` : ""}
<form class="inline card" method="get" action="/dashboard"><input type="hidden" name="view" value="leads">
<div style="flex:1;min-width:220px"><label for="q">Search name, email or phone</label><input id="q" name="q" value="${esc(q)}" style="width:100%"></div>
<div><label for="st">Status</label><select id="st" name="status"><option value="">All</option><option value="partial"${status === "partial" ? " selected" : ""}>Didn't finish</option>${STATUSES.map((s) => `<option${s === status ? " selected" : ""}>${s}</option>`).join("")}</select></div>
<button type="submit">Search</button></form>
${leads.some((l) => !(l.dilvon && l.dilvon.ok) && (l.email || l.phone)) ? `<form method="post" style="margin:0 0 12px" onsubmit="return confirm('Send every lead that is not in Dilvon yet?')"><input type="hidden" name="do" value="dilvonall"><button type="submit" class="grey">Send all leads not yet in Dilvon</button></form>` : ""}
<div class="scroll"><table><thead><tr><th>Lead</th><th>Date</th><th>Status</th><th>Source / campaign</th><th>Journey</th><th>Meta</th><th>Dilvon</th></tr></thead>
<tbody>${body || `<tr><td colspan="7" class="mut">No leads yet.</td></tr>`}</tbody></table></div>`);
}

function detailView(l, msg, err) {
  const touch = (t) => {
    t = t || {};
    const keys = [["Source", sourceOf(t)], ["utm_source", t.utm_source], ["utm_medium", t.utm_medium], ["utm_campaign", t.utm_campaign],
      ["utm_content", t.utm_content], ["utm_term", t.utm_term], ["fbclid", t.fbclid], ["gclid", t.gclid], ["Campaign", t.campaign_name], ["Campaign ID", t.campaign_id], ["Ad set", t.adset_name], ["Ad set ID", t.adset_id], ["Ad", t.ad_name], ["Ad ID", t.ad_id], ["Form ID", t.form_id], ["Platform", t.platform], ["Landing page", t.landing], ["Referrer", t.referrer], ["When", fmtDate(t.at)]];
    return `<dl>${keys.filter((k) => k[1]).map((k) => `<dt>${k[0]}</dt><dd>${esc(k[1])}</dd>`).join("")}</dl>`;
  };
  const answers = answersList(l);
  const journey = (l.journey || []).map((j) => `<tr><td>${esc(fmtDate(j.at))}</td><td>${esc(j.detail)}</td></tr>`).join("");
  const meta = (l.meta || []).map((m) => `<tr><td>${esc(fmtDate(m.at))}</td><td>${esc(m.event)}</td>
<td>${m.ok ? '<span class="ok">Sent</span>' : '<span class="bad">Not sent</span>'}${m.pixelBrowser ? '<div class="mut">Browser pixel also fired</div>' : ""}</td>
<td><code>${esc(m.eventId)}</code></td><td class="mut">${esc(m.response)}</td></tr>`).join("");
  const consentNote = l.source === "facebook_form" ? "Filled in on Facebook, so no cookies are involved" : l.consent === "accepted" ? "Accepted cookies" :
    (l.consent === "rejected" ? "Declined cookies, so nothing about this lead is sent to Meta" : "Did not answer the cookie banner, so nothing is sent to Meta");

  return shell(nameOf(l) + " – Lead", `${navBar("list")}
<p><a href="/dashboard?view=leads">← All leads</a></p>
<h1>${esc(nameOf(l))} ${statusPill(l.status)}${l.partial ? " " + PARTIAL_PILL : ""}</h1>
${l.partial ? `<p class="mut">They typed these details but left before pressing Next, so Meta has not been told about them.</p>` : ""}
${msg ? `<div class="msg">${esc(msg)}</div>` : ""}${err ? `<div class="msg err">${esc(err)}</div>` : ""}
<p class="journey">${esc(journeyLine(l))}</p>
<div class="grid">
<div class="card"><h2 style="margin-top:0">Contact</h2><dl>
<dt>Name</dt><dd>${esc(l.firstName)}</dd><dt>Email</dt><dd><a href="mailto:${esc(l.email)}">${esc(l.email)}</a></dd>
<dt>Phone</dt><dd><a href="tel:${esc(l.phone)}">${esc(l.phone)}</a></dd>${l.postcode ? `<dt>Postcode</dt><dd>${esc(l.postcode)}</dd>` : ""}${l.source === "facebook_form" ? `<dt>Came from</dt><dd>Facebook form</dd><dt>Meta Lead ID</dt><dd><code>${esc(l.metaLeadId)}</code></dd>${l.fetchError ? `<dt>Problem</dt><dd class="bad">${esc(l.fetchError)}</dd>` : ""}` : `<dt>Landing page</dt><dd>/go/${esc(l.page)}/</dd>`}
<dt>Date</dt><dd>${esc(fmtDate(l.createdAt))}</dd><dt>Dilvon</dt><dd>${l.dilvon && l.dilvon.ok ? '<span class="ok">Sent</span>' : (l.dilvon ? '<span class="bad" title="' + esc(l.dilvon.response) + '">Not sent</span> ' : '<span class="mut">Not sent yet</span> ')}${l.dilvon && l.dilvon.ok ? "" : `<form method="post" style="display:inline"><input type="hidden" name="id" value="${esc(l.id)}"><input type="hidden" name="do" value="dilvon"><button type="submit" class="grey" style="padding:4px 10px;font-size:13px">Send to Dilvon</button></form>`}</dd><dt>Cookies</dt><dd>${esc(consentNote)}</dd><dt>Lead ID</dt><dd><code>${esc(l.id)}</code></dd></dl></div>
<div class="card"><h2 style="margin-top:0">Their answers</h2><dl>${answers || "<dd class='mut'>None</dd>"}</dl></div>
<div class="card"><h2 style="margin-top:0">Update</h2>
<form method="post"><input type="hidden" name="id" value="${esc(l.id)}"><input type="hidden" name="do" value="update">
<label for="status">Status</label><select id="status" name="status" style="width:100%;margin-bottom:10px">${STATUSES.map((s) => `<option${s === l.status ? " selected" : ""}>${s}</option>`).join("")}</select>
<label for="value">Booking value (£)</label><input id="value" name="value" inputmode="decimal" value="${esc(l.value)}" style="width:100%;margin-bottom:10px">
<label for="via">How did they book?</label><select id="via" name="via" style="width:100%;margin-bottom:10px">${Object.entries(BOOKED_VIA).map(([k, v]) => `<option value="${k}"${l.bookedVia === k ? " selected" : ""}>${esc(v.label)}</option>`).join("")}</select>
<label for="notes">Notes</label><textarea id="notes" name="notes">${esc(l.notes)}</textarea>
<p class="mut">Setting Booked or Completed with a value sends one Purchase event to Meta, once only. Not for online bookings, because the Dilvon form already tells Meta. It also tells ChatGPT ads the booking and its value, once only, for every booking type.</p>
<button type="submit">Save</button></form></div>
</div>
<div class="grid">
<div class="card"><h2 style="margin-top:0">First visit</h2>${touch(l.first)}</div>
<div class="card"><h2 style="margin-top:0">Latest visit</h2>${touch(l.last)}</div>
</div>
<h2>Journey</h2><div class="scroll"><table><thead><tr><th>When</th><th>What</th></tr></thead><tbody>${journey}</tbody></table></div>
<h2>Meta</h2><div class="scroll"><table><thead><tr><th>When</th><th>Event</th><th>Server (CAPI)</th><th>Event ID</th><th>Meta's reply</th></tr></thead>
<tbody>${meta || `<tr><td colspan="5" class="mut">Nothing sent yet.</td></tr>`}</tbody></table></div>
<form method="post" style="margin-top:24px" onsubmit="return confirm('Delete this lead for good?')"><input type="hidden" name="id" value="${esc(l.id)}"><input type="hidden" name="do" value="delete"><button class="red" type="submit">Delete lead</button></form>`);
}

async function allVisits(st) {
  const out = [];
  let cursor;
  do {
    const page = await st.visits.list(cursor ? { cursor } : {});
    out.push(...page.blobs.map((b) => b.key));
    cursor = page.cursor;
  } while (cursor);
  return (await Promise.all(out.map((k) => st.visits.get(k, { type: "json" })))).filter(Boolean);
}

function reportView(leads, visits) {
  const groups = {};
  const grp = (src, camp) => groups[src + "||" + camp] || (groups[src + "||" + camp] = { src, camp, visits: 0, leads: 0, partial: 0, contacted: 0, booked: 0, revenue: 0 });
  (visits || []).forEach((v) => { grp(sourceOf(v), v.utm_campaign || "(no campaign)").visits++; });
  leads.forEach((l) => {
    const src = sourceOf(l.first);
    const camp = (l.first || {}).utm_campaign || "(no campaign)";
    const k = src + "||" + camp;
    const g = groups[k] || grp(src, camp);
    if (l.partial) { g.partial++; return; }
    g.leads++;
    if (l.status !== "New") g.contacted++;
    if (BOOKED.includes(l.status)) { g.booked++; g.revenue += Number(l.value) || 0; }
  });
  const rows = Object.values(groups).sort((a, b) => b.revenue - a.revenue || b.leads - a.leads || b.visits - a.visits);
  const tot = rows.reduce((t, g) => ({ visits: t.visits + g.visits, leads: t.leads + g.leads, booked: t.booked + g.booked, revenue: t.revenue + g.revenue }), { visits: 0, leads: 0, booked: 0, revenue: 0 });
  const body = rows.map((g) => `<tr><td>${esc(g.src)}</td><td>${esc(g.camp)}</td><td>${g.visits}</td><td>${g.visits ? Math.round(g.leads / g.visits * 100) + "%" : "–"}</td><td>${g.leads}</td><td>${g.partial}</td><td>${g.contacted}</td><td>${g.booked}</td>
<td>${g.leads ? Math.round(g.booked / g.leads * 100) : 0}%</td><td>${money(g.revenue)}</td><td class="mut">Not connected</td></tr>`).join("");
  return shell("Report – Leads", `${navBar("report")}<h1>Campaign report</h1>
<p class="mut">Visits = people who opened a landing page (counted once per visit, from 14 Oct 2026). Grouped by where each lead first came from. Ad spend shows once Meta's ads data is connected; until then it is left blank, not guessed.</p>
<div class="scroll"><table><thead><tr><th>Source</th><th>Campaign</th><th>Visits</th><th>Visit → lead</th><th>Leads</th><th>Didn't finish</th><th>Contacted</th><th>Booked</th><th>Booked %</th><th>Revenue</th><th>Ad spend</th></tr></thead>
<tbody>${body || `<tr><td colspan="11" class="mut">No leads yet.</td></tr>`}
${rows.length ? `<tr><td colspan="2"><strong>Total</strong></td><td><strong>${tot.visits}</strong></td><td></td><td><strong>${tot.leads}</strong></td><td></td><td></td><td><strong>${tot.booked}</strong></td><td></td><td><strong>${money(tot.revenue)}</strong></td><td></td></tr>` : ""}
</tbody></table></div>`);
}

function partnersView(s, leads, visits, msg, err, tab) {
  s = Object.assign({}, s, { partners: s.partners.filter((x) => x.role !== "rep") });
  const P = require("./partners");
  const today = new Date().toISOString().slice(0, 10);
  const fmtD = (d) => d ? new Date(d + "T12:00:00Z").toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "";

  // Goals at the top: how far we are from each one
  const goals = s.goals.map((g) => {
    const pr = P.goalProgress(g, s.partners, leads, visits);
    const left = pr.daysLeft == null ? "" : (pr.daysLeft >= 0 ? pr.daysLeft + " days left" : "Deadline passed");
    return `<div class="card goal${pr.done ? " done" : ""}"><div class="gtop"><strong>${esc(g.label || P.GOAL_TYPES[g.type])}</strong>
<form method="post" onsubmit="return confirm('Remove this goal?')"><input type="hidden" name="do" value="delgoal"><input type="hidden" name="key" value="${esc(g.key)}"><button class="linkbtn" type="submit" title="Remove goal">✕</button></form></div>
<div class="gnum"><b>${pr.current}</b> / ${pr.target}${pr.done ? ' <span class="ok">✓ reached</span>' : ` <span class="mut">(${Math.max(0, pr.target - pr.current)} to go)</span>`}</div>
<div class="bar"><span style="width:${pr.pct}%"></span></div>
<div class="mut">${esc(P.GOAL_TYPES[g.type])} · ${esc(fmtD(g.start))} → ${esc(fmtD(g.deadline))}${left ? " · " + esc(left) : ""}</div></div>`;
  }).join("");

  // Partner performance
  const stats = s.partners.map((p) => ({ p, st: P.statsFor(p, leads, visits) }))
    .sort((a, b) => b.st.booked - a.st.booked || b.st.leads - a.st.leads || b.st.clicks - a.st.clicks);
  const tot = stats.reduce((t, x) => ({ clicks: t.clicks + x.st.clicks, leads: t.leads + x.st.leads, booked: t.booked + x.st.booked, value: t.value + x.st.value, com: t.com + x.st.commission }), { clicks: 0, leads: 0, booked: 0, value: 0, com: 0 });
  const plink = (p, hash, n) => `<a href="/dashboard?view=partner&key=${esc(p.key)}${hash}" class="num">${n}</a>`;
  const rows = stats.map(({ p, st }) => `<tr><td><div class="pname"><a href="/dashboard?view=partner&key=${esc(p.key)}"><strong>${esc(p.name)}</strong></a>
<button type="button" class="copybtn" data-copy="${esc(P.inviteText(p))}" title="Copy their login details and link to send them">${COPY_ICON} Copy login</button></div>
<div class="mut">${esc(p.email || p.code)}${!p.hash ? ' · <span class="pill s-Contacted">No password yet</span>' : ""}</div></td>
<td>${plink(p, "#clicks", st.clicks)}</td><td>${plink(p, "#leads", st.leads)}</td><td>${plink(p, "#booked", st.booked)}</td><td>${money(st.value)}</td><td>${st.rate ? money(st.commission) + `<div class="mut">${st.rate}%</div>` : "–"}</td>
<td class="mut">${st.last ? esc(fmtDate(st.last)) : "–"}</td>
<td><form method="post" class="inline"><input type="hidden" name="do" value="partnerpw"><input type="hidden" name="key" value="${esc(p.key)}"><input name="password" type="text" autocomplete="off" placeholder="New password" style="width:120px"><button class="grey" type="submit">Set</button></form>
<form method="post" style="margin-top:6px" onsubmit="return confirm('Remove this partner? Their leads stay.')"><input type="hidden" name="do" value="delpartner"><input type="hidden" name="key" value="${esc(p.key)}"><button class="red" type="submit">Remove</button></form></td></tr>`).join("");

  // Resources
  const res = P.allResources(s).map((r) => `<tr><td><strong>${esc(r.title)}</strong>${r.description ? `<div class="mut">${esc(r.description)}</div>` : ""}</td><td>${esc(P.RESOURCE_TYPES[r.type] || r.type)}</td>
<td><a href="${esc(r.url)}" target="_blank" rel="noopener">Open</a></td>
<td>${r.auto ? '<span class="mut">Added automatically</span>' : `<form method="post" onsubmit="return confirm('Remove this resource?')"><input type="hidden" name="do" value="delresource"><input type="hidden" name="key" value="${esc(r.key)}"><button class="red" type="submit">Remove</button></form>`}</td></tr>`).join("");
  const typeOpts = (o) => Object.entries(o).map(([k, v]) => `<option value="${k}">${esc(v)}</option>`).join("");

  const flash = `${msg ? `<div class="msg">${esc(msg)}</div>` : ""}${err ? `<div class="msg err">${esc(err)}</div>` : ""}`;
  const kpis = `<div class="kpis"><div class="kpi"><b>${s.partners.length}</b><span>Partners</span></div><div class="kpi"><b>${tot.clicks}</b><span>Clicks on their links</span></div><div class="kpi"><b>${tot.leads}</b><span>Leads</span></div><div class="kpi"><b>${tot.booked}</b><span>Bookings</span></div><div class="kpi"><b>${money(tot.value)}</b><span>Booking value</span></div><div class="kpi"><b>${money(tot.com)}</b><span>Commission owed</span></div></div>`;

  if (tab === "goals") return shell("Goals – Partners", `${navBar("goals")}<h1>Goals</h1><p class="lede">Targets for your partner team, with deadlines. Progress updates by itself.</p>${flash}
${goals ? `<div class="goals">${goals}</div>` : `<div class="card mut">No goals yet. Add your first one below, e.g. "20 partners by 31 December".</div>`}
<div class="card" style="margin-top:16px"><h2>Add a goal</h2>
<form method="post"><input type="hidden" name="do" value="addgoal"><div class="grid">
<div><label for="gty">What to count</label><select id="gty" name="type" style="width:100%">${typeOpts(P.GOAL_TYPES)}</select></div>
<div><label for="gta">Target</label><input id="gta" name="target" inputmode="numeric" required style="width:100%" placeholder="e.g. 20"></div>
<div><label for="gst">Start date</label><input id="gst" name="start" type="date" value="${today}" required style="width:100%"></div>
<div><label for="gdl">Deadline</label><input id="gdl" name="deadline" type="date" required style="width:100%"></div>
<div><label for="glb">Name (optional)</label><input id="glb" name="label" style="width:100%" placeholder="e.g. 20 salespeople by Christmas"></div>
</div><p class="mut">Clicks, leads and bookings are counted between the start date and the deadline. "Partners bringing clicks/leads" counts partners with at least one in that period.</p><button type="submit">Add goal</button></form></div>`);

  if (tab === "resources") return shell("Resources – Partners", `${navBar("resources")}<h1>Resources</h1><p class="lede">What partners see on their Resources page. Landing pages are added automatically. Landing page and booking form links include each partner's username.</p>${flash}
<div class="scroll"><table><thead><tr><th>Resource</th><th>Type</th><th>Link</th><th></th></tr></thead>
<tbody>${res || `<tr><td colspan="4" class="mut">No resources yet. Add one below.</td></tr>`}</tbody></table></div>
<div class="card" style="margin-top:16px"><h2>Add a resource</h2><form method="post"><input type="hidden" name="do" value="addresource"><div class="grid">
<div><label for="rti">Title</label><input id="rti" name="title" required style="width:100%"></div>
<div><label for="rty">Type</label><select id="rty" name="type" style="width:100%">${typeOpts(P.RESOURCE_TYPES)}</select></div>
<div><label for="rur">Link (Google Drive, YouTube, Canva, booking form…)</label><input id="rur" name="url" type="url" required style="width:100%"></div>
<div><label for="rde">Short description (optional)</label><input id="rde" name="description" style="width:100%"></div>
</div><p class="mut">Images show as a picture when the link ends in .jpg, .png or .webp. YouTube links play inside the page.</p><button type="submit">Add resource</button></form></div>
<div class="card"><h2>Dilvon booking sync</h2><p class="mut" style="margin-top:0">Dilvon uses this to tell the website when a partner's lead books, so bookings and commission update automatically.</p>
<dl><dt>Address</dt><dd><code>POST https://sncleaningservices.co.uk/api/funnel</code></dd>
<dt>Key</dt><dd>${s.partnerSync.key ? `<code>${esc(s.partnerSync.key)}</code>` : '<span class="mut">Not created yet</span>'}</dd></dl>
<form method="post" style="margin-top:10px"><input type="hidden" name="do" value="synckey"><button class="grey" type="submit">${s.partnerSync.key ? "Create a new key" : "Create key"}</button></form></div>`);

  return shell("Partners – Leads", `${navBar("partners")}<div class="phead"><div><h1>Partners</h1><p class="lede">Commission-only partners</p></div><button type="button" onclick="document.getElementById('addp').showModal()">+ Add partner</button></div>${flash}
${kpis}
<div class="scroll"><table><thead><tr><th>Partner</th><th>Clicks</th><th>Leads</th><th>Booked</th><th>Value</th><th>Commission</th><th>Last activity</th><th>Password</th></tr></thead>
<tbody>${rows || `<tr><td colspan="8" class="mut">No partners yet.</td></tr>`}</tbody></table></div>
<dialog id="addp" class="dlg"><form method="post"><input type="hidden" name="do" value="addpartner"><h2>Add partner</h2>
<label for="pna">Name</label><input id="pna" name="name" required>
<label for="pem">Email (they log in with this)</label><input id="pem" name="email" type="email" required autocomplete="off">
<label for="pcm">Commission % (optional)</label><input id="pcm" name="commission" inputmode="decimal">
<label for="ppw">Password (at least 6 characters)</label><input id="ppw" name="password" type="text" autocomplete="off" minlength="6" required>
<div class="btns"><button type="submit">Add partner</button><button type="button" class="grey" onclick="this.closest('dialog').close()">Cancel</button></div></form></dialog>${COPY_JS}`);
}

function partnerDetailView(s, pr, leads, visits, msg, err) {
  const P = require("./partners");
  const st = P.statsFor(pr, leads, visits);
  const clicks = visits.filter((v) => F.isPartnerTouch(v, pr.code)).sort((a, b) => (b.at || "").localeCompare(a.at || ""));
  const ls = st.leadList.sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""));
  const booked = ls.filter((l) => BOOKED.includes(l.status));
  const leadRow = (l) => `<tr><td><a href="/dashboard?id=${esc(l.id)}">${esc(nameOf(l))}</a>${l.partial ? " " + PARTIAL_PILL : ""}${answersPop(l)}</td><td>${l.phone ? `<a href="tel:${esc(l.phone)}">${esc(l.phone)}</a>` : "–"}<div class="mut">${esc(l.email || "")}</div></td><td>${esc(l.postcode || "–")}</td><td>${esc(fmtDate(l.createdAt))}</td><td>${statusPill(l.status)}</td><td>${l.value ? money(l.value) : "–"}</td><td>${BOOKED.includes(l.status) && st.rate ? money((Number(l.value) || 0) * st.rate / 100) : "–"}</td></tr>`;
  const kpi = (hash, n, label) => `<a class="kpi" href="${hash}" style="text-decoration:none;color:inherit"><b>${n}</b><span>${label}</span></a>`;
  return shell(pr.name + " – Partner", `${navBar("partners")}<p><a href="/dashboard?view=partners">← All partners</a></p>
<div class="phead"><div><h1>${esc(pr.name)}</h1><p class="lede">${esc(pr.email || "No email yet – add one below")}${!pr.hash ? " · no password yet" : ""}${pr.createdAt ? " · added " + esc(fmtDate(pr.createdAt)) : ""}</p></div>
<button type="button" class="copybtn big" data-copy="${esc(P.inviteText(pr))}">${COPY_ICON} Copy login</button></div>
${msg ? `<div class="msg">${esc(msg)}</div>` : ""}${err ? `<div class="msg err">${esc(err)}</div>` : ""}
<div class="kpis">${kpi("#clicks", st.clicks, "Clicks")}${kpi("#leads", st.leads, "Leads")}${kpi("#booked", st.booked, "Booked")}<div class="kpi"><b>${money(st.value)}</b><span>Booking value</span></div><div class="kpi"><b>${st.rate ? money(st.commission) : "–"}</b><span>Commission${st.rate ? " (" + esc(String(st.rate)) + "%)" : ""}</span></div></div>
<h2 id="clicks">Clicks <span class="mut">(${clicks.length})</span></h2>
<div class="scroll"><table><thead><tr><th>Date</th><th>Page</th><th>Came from</th></tr></thead><tbody>
${clicks.map((v) => `<tr><td>${esc(fmtDate(v.at))}</td><td>${esc(v.page || "–")}</td><td class="mut">${esc(v.referrer || "Direct / app")}</td></tr>`).join("") || `<tr><td colspan="3" class="mut">No clicks yet.</td></tr>`}</tbody></table></div>
<h2 id="leads">Leads <span class="mut">(${ls.length})</span></h2>
<div class="scroll"><table><thead><tr><th>Name</th><th>Phone / email</th><th>Postcode</th><th>Date</th><th>Status</th><th>Value</th><th>Commission</th></tr></thead><tbody>${ls.map(leadRow).join("") || `<tr><td colspan="7" class="mut">No leads yet.</td></tr>`}</tbody></table></div>
<h2 id="booked">Booked <span class="mut">(${booked.length})</span></h2>
<div class="scroll"><table><thead><tr><th>Name</th><th>Phone / email</th><th>Postcode</th><th>Date</th><th>Status</th><th>Value</th><th>Commission</th></tr></thead><tbody>${booked.map(leadRow).join("") || `<tr><td colspan="7" class="mut">No bookings yet.</td></tr>`}</tbody></table></div>
<div class="card" style="margin-top:18px"><h2>Email login</h2><form method="post" class="inline"><input type="hidden" name="do" value="setemail"><input type="hidden" name="key" value="${esc(pr.key)}"><input name="email" type="email" value="${esc(pr.email || "")}" placeholder="name@example.com" required><button class="grey" type="submit">Save email</button></form></div>
<div class="card" style="margin-top:18px"><h2>Password</h2><form method="post" class="inline"><input type="hidden" name="do" value="partnerpw"><input type="hidden" name="key" value="${esc(pr.key)}"><input type="hidden" name="back" value="detail"><input name="password" type="text" autocomplete="off" placeholder="New password (6+ characters)"><button class="grey" type="submit">Set password</button></form></div>${COPY_JS}`);
}

function homeView(s, leads, visits) {
  s = Object.assign({}, s, { partners: s.partners.filter((x) => x.role !== "rep") });
  const P = require("./partners");
  const day = (iso) => new Date(iso).toLocaleDateString("en-CA", { timeZone: "Europe/London" });
  const since = new Date(Date.now() - 30 * 86400000).toISOString();
  const full = leads.filter((l) => !l.partial);
  const l30 = full.filter((l) => (l.createdAt || "") >= since);
  const v30 = (visits || []).filter((v) => (v.at || "") >= since);
  const b30 = l30.filter((l) => BOOKED.includes(l.status));
  const rev30 = b30.reduce((t, l) => t + (Number(l.value) || 0), 0);
  const notSent = full.filter((l) => !(l.dilvon && l.dilvon.ok) && (l.email || l.phone)).length;
  const newCount = full.filter((l) => l.status === "New").length;

  // Leads per day, last 14 days
  const days = [];
  for (let i = 13; i >= 0; i--) days.push(day(new Date(Date.now() - i * 86400000).toISOString()));
  const perDay = Object.fromEntries(days.map((d) => [d, 0]));
  full.forEach((l) => { const d = l.createdAt && day(l.createdAt); if (d in perDay) perDay[d]++; });
  const max = Math.max(1, ...Object.values(perDay));
  const chart = days.map((d) => { const n = perDay[d]; const dt = new Date(d + "T12:00:00Z");
    return `<div class="c" title="${n} lead${n === 1 ? "" : "s"} on ${esc(dt.toLocaleDateString("en-GB", { day: "numeric", month: "short" }))}"><small>${n || ""}</small><i style="height:${Math.round(n / max * 100)}%"></i><em>${dt.getUTCDate()}</em></div>`; }).join("");

  // Where leads came from, last 30 days
  const src = {};
  l30.forEach((l) => { const k = sourceOf(l.first); src[k] = (src[k] || 0) + 1; });
  const srcRows = Object.entries(src).sort((a, b) => b[1] - a[1]).map(([k, n]) =>
    `<div class="srcrow"><span>${esc(k)}</span><strong>${n}</strong><div class="bar"><span style="width:${Math.round(n / l30.length * 100)}%"></span></div></div>`).join("");

  const recent = [...leads].sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || "")).slice(0, 8).map((l) =>
    `<tr><td><a href="/dashboard?id=${esc(l.id)}">${esc(nameOf(l))}</a>${l.partial ? " " + PARTIAL_PILL : ""}<div class="mut">${esc(sourceOf(l.first))}</div></td><td>${statusPill(l.status)}</td><td class="mut">${esc(fmtDate(l.createdAt))}</td></tr>`).join("");

  const goals = s.goals.slice(0, 3).map((g) => { const pr = P.goalProgress(g, s.partners, leads, visits);
    return `<div style="margin-bottom:12px"><div class="srcrow" style="margin:0"><span>${esc(g.label || P.GOAL_TYPES[g.type])}</span><strong>${pr.current} / ${pr.target}</strong></div><div class="bar"><span style="width:${pr.pct}%"></span></div><div class="mut">${pr.daysLeft == null ? "" : (pr.daysLeft >= 0 ? pr.daysLeft + " days left" : "Deadline passed")}</div></div>`; }).join("");
  const pTot = s.partners.reduce((t, p) => { const x = P.statsFor(p, leads, visits); return { clicks: t.clicks + x.clicks, leads: t.leads + x.leads }; }, { clicks: 0, leads: 0 });

  return shell("Dashboard – SN Cleaning", `${navBar("home")}<h1>Dashboard</h1><p class="lede">The last 30 days at a glance.</p>
<div class="kpis">
<div class="kpi"><b>${v30.length}</b><span>Landing page visits</span></div>
<div class="kpi"><b>${l30.length}</b><span>Leads</span></div>
<div class="kpi"><b>${v30.length ? Math.round(l30.filter((l) => l.source !== "facebook_form").length / v30.length * 100) + "%" : "–"}</b><span>Visit → lead (landing pages)</span></div>
<div class="kpi"><b>${b30.length}</b><span>Booked</span></div>
<div class="kpi"><b>${money(rev30)}</b><span>Booking value</span></div>
${notSent ? `<a class="kpi warn" href="/dashboard?view=leads" style="text-decoration:none;color:inherit"><b>${notSent}</b><span>Not in Dilvon yet</span></a>` : `<div class="kpi"><b>${newCount}</b><span>Waiting for first contact</span></div>`}
</div>
<div class="cols">
<div class="card"><div class="chead"><h2>Leads per day</h2><span class="mut">Last 14 days</span></div><div class="chart">${chart}</div></div>
<div class="card"><div class="chead"><h2>Where leads came from</h2><a href="/dashboard?view=report">Report →</a></div>${srcRows || `<p class="mut">No leads in the last 30 days.</p>`}</div>
</div>
<div class="cols">
<div class="card"><div class="chead"><h2>Latest leads</h2><a href="/dashboard?view=leads">All leads →</a></div>
<div class="scroll"><table class="mini"><tbody>${recent || `<tr><td class="mut">No leads yet.</td></tr>`}</tbody></table></div></div>
<div class="card"><div class="chead"><h2>Partners</h2><a href="/dashboard?view=partners">Open →</a></div>
<div class="srcrow"><span>Partners</span><strong>${s.partners.length}</strong></div><div class="srcrow"><span>Clicks on their links</span><strong>${pTot.clicks}</strong></div><div class="srcrow"><span>Leads from partners</span><strong>${pTot.leads}</strong></div>
<div class="chead" style="margin-top:16px"><h2 style="font-size:15px">Goals</h2><a href="/dashboard?view=goals">Goals →</a></div>${goals || `<p class="mut">No goals set yet.</p>`}</div>
</div>`);
}

/* ---------- door-to-door reps ---------- */

const mapLink = (l, label) => l && l.lat != null ? `<a href="https://www.google.com/maps?q=${l.lat},${l.lng}" target="_blank" rel="noopener">${label || "Map"}</a>` : "";
const repTm = (iso) => iso ? new Date(iso).toLocaleTimeString("en-GB", { timeZone: "Europe/London", hour: "2-digit", minute: "2-digit" }) : "";
const repDay = (day) => new Date(day + "T12:00:00Z").toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" });

async function repsView(s, st, msg, err) {
  const R = require("./reps");
  const P = require("./partners");
  const reps = s.partners.filter((x) => x.role === "rep");
  const wk = R.weekStart(R.today());
  const rows = await Promise.all(reps.map(async (r) => {
    const [sh, vs] = await Promise.all([R.shiftsFor(st.reps, r.key), R.visitsFor(st.reps, r.key)]);
    const open = R.openShift(sh);
    const tSh = sh.filter((x) => R.londonDay(x.in) === R.today()), tVs = vs.filter((v) => R.londonDay(v.at) === R.today());
    const wMs = sh.filter((x) => R.londonDay(x.in) >= wk).reduce((t, x) => t + R.workedMs(x), 0);
    const rate = Number(r.rate) || 0;
    const state = open ? (R.onBreak(open) ? `<span class="pill s-Contacted">On break</span>` : `<span class="pill s-Booked">On shift since ${esc(repTm(open.in))}</span>`) : `<span class="pill">Off</span>`;
    return `<tr><td><div class="pname"><a href="/dashboard?view=rep&key=${esc(r.key)}"><strong>${esc(r.name)}</strong></a>
<button type="button" class="copybtn" data-copy="${esc(P.inviteText(r))}">${COPY_ICON} Copy login</button></div><div class="mut">${esc(r.email || r.code)}${!r.hash ? ' · <span class="pill s-Contacted">No password yet</span>' : ""}</div></td>
<td>${state}</td><td>${esc(R.hrs(tSh.reduce((t, x) => t + R.workedMs(x), 0)))}</td><td>${tVs.length}</td><td>${tVs.filter((v) => v.leaflet).length}</td><td>${tVs.filter(R.isLead).length}</td>
<td>${esc(R.hrs(wMs))}</td><td>${rate ? money(wMs / 3600000 * rate) : "–"}</td></tr>`;
  }));
  return shell("Reps – SN Cleaning", `${navBar("reps")}<div class="phead"><div><h1>Reps</h1><p class="lede">Door-to-door representatives</p></div><button type="button" onclick="document.getElementById('addr').showModal()">+ Add rep</button></div>
${msg ? `<div class="msg">${esc(msg)}</div>` : ""}${err ? `<div class="msg err">${esc(err)}</div>` : ""}
<div class="scroll"><table><thead><tr><th>Rep</th><th>Now</th><th>Today</th><th>Visits</th><th>Leaflets</th><th>Leads</th><th>This week</th><th>Pay this week</th></tr></thead>
<tbody>${rows.join("") || `<tr><td colspan="8" class="mut">No reps yet.</td></tr>`}</tbody></table></div>
<dialog id="addr" class="dlg"><form method="post"><input type="hidden" name="do" value="addpartner"><input type="hidden" name="role" value="rep"><h2>Add rep</h2>
<label for="rna">Name</label><input id="rna" name="name" required>
<label for="rem">Email (they log in with this)</label><input id="rem" name="email" type="email" required autocomplete="off">
<label for="rrt">Hourly rate £ (optional, for pay totals)</label><input id="rrt" name="rate" inputmode="decimal">
<label for="rpw">Password (at least 6 characters)</label><input id="rpw" name="password" type="text" autocomplete="off" minlength="6" required>
<div class="btns"><button type="submit">Add rep</button><button type="button" class="grey" onclick="this.closest('dialog').close()">Cancel</button></div></form></dialog>${COPY_JS}`);
}

async function repView(s, st, r, q, msg, err) {
  const R = require("./reps");
  const P = require("./partners");
  const [shifts, visits] = await Promise.all([R.shiftsFor(st.reps, r.key), R.visitsFor(st.reps, r.key)]);
  const rate = Number(r.rate) || 0;
  const wk = R.weekStart(R.today());
  const wSh = shifts.filter((x) => R.londonDay(x.in) >= wk), wVs = visits.filter((v) => R.londonDay(v.at) >= wk);
  const wMs = wSh.reduce((t, x) => t + R.workedMs(x), 0);
  const perHour = wMs >= 1800000 ? (wVs.length / (wMs / 3600000)).toFixed(1) : "–";

  // Timesheet: last 5 weeks, grouped by week
  const since = R.weekStart(R.londonDay(new Date(Date.now() - 28 * 86400000).toISOString()));
  const weeks = {};
  shifts.filter((x) => R.londonDay(x.in) >= since).forEach((x) => { const w = R.weekStart(R.londonDay(x.in)); (weeks[w] = weeks[w] || []).push(x); });
  const ts = Object.keys(weeks).sort().reverse().map((w) => {
    const list = weeks[w].sort((a, b) => a.in.localeCompare(b.in));
    const ms = list.reduce((t, x) => t + R.workedMs(x), 0);
    const rowsW = list.map((x) => {
      const brk = (x.breaks || []).reduce((t, b) => t + ((b.end ? Date.parse(b.end) : Date.now()) - Date.parse(b.start)), 0);
      return `<tr><td>${esc(repDay(R.londonDay(x.in)))}</td><td>${esc(repTm(x.in))} <span class="mut">${mapLink(x.inLoc)}</span></td>
<td>${x.out ? esc(repTm(x.out)) + ` <span class="mut">${mapLink(x.outLoc)}</span>` : '<span class="pill s-Booked">On shift</span>'}</td><td>${brk ? esc(R.hrs(brk)) : "–"}</td><td><strong>${esc(R.hrs(R.workedMs(x)))}</strong></td>
<td>${x.auto ? '<span class="pill s-Lost" title="She did not clock out; closed at midnight">Forgot to clock out</span>' : ""}${x.edited ? '<span class="pill">Edited</span>' : ""}</td>
<td><form method="post" class="inline"><input type="hidden" name="do" value="editshift"><input type="hidden" name="key" value="${esc(r.key)}"><input type="hidden" name="shift" value="${esc(x.id)}">
<input type="time" name="in" value="${esc(repTm(x.in))}" required aria-label="Clock in time"><input type="time" name="out" value="${esc(repTm(x.out))}" aria-label="Clock out time"><button class="grey" type="submit">Save</button></form></td></tr>`;
    }).join("");
    return `<tr><td colspan="7" style="background:#f6f8f7"><strong>Week of ${esc(repDay(w))}</strong> · ${esc(R.hrs(ms))}${rate ? " · " + money(ms / 3600000 * rate) : ""}</td></tr>${rowsW}`;
  }).join("");

  // Visits, filter by day
  const day = /^\d{4}-\d{2}-\d{2}$/.test(q.day || "") ? q.day : "";
  const vs = (day ? visits.filter((v) => R.londonDay(v.at) === day) : visits.filter((v) => R.londonDay(v.at) >= R.londonDay(new Date(Date.now() - 13 * 86400000).toISOString())));
  const vrows = vs.map((v) => `<tr><td>${esc(repDay(R.londonDay(v.at)))}<div class="mut">${esc(repTm(v.at))}</div></td>
<td><strong>${esc(v.company)}</strong><div class="mut">${esc([v.address, v.postcode].filter(Boolean).join(", "))}</div>${v.spokeTo ? `<div class="mut">Spoke to ${esc(v.spokeTo)}</div>` : ""}</td>
<td>${R.isLead(v) ? `<span class="pill s-Booked">${esc(v.outcome)}</span>` : v.outcome === "Not interested" ? `<span class="pill s-Lost">${esc(v.outcome)}</span>` : `<span class="pill">${esc(v.outcome)}</span>`}${v.leaflet ? '<div class="mut">Leaflet given</div>' : ""}</td>
<td>${v.lead ? esc(v.lead.name || "") + (v.lead.phone ? `<div><a href="tel:${esc(v.lead.phone)}">${esc(v.lead.phone)}</a></div>` : "") + `<div class="mut">${esc(v.lead.email || "")}</div>` + (v.lead.needs ? `<div class="mut">${esc(v.lead.needs)}</div>` : "") : "–"}</td>
<td class="mut">${esc(v.notes || "")}</td><td>${v.hasPhoto ? `<a href="/dashboard?photo=${esc(v.id)}" target="_blank" rel="noopener">Photo</a><br>` : ""}${mapLink(v.loc)}</td>
<td><form method="post" onsubmit="return confirm('Delete this visit?')"><input type="hidden" name="do" value="delvisit"><input type="hidden" name="key" value="${esc(r.key)}"><input type="hidden" name="visit" value="${esc(v.id)}"><button class="linkbtn" type="submit" title="Delete visit">✕</button></form></td></tr>`).join("");
  const pins = vs.filter((v) => v.loc).slice(0, 40);
  const routeUrl = pins.length >= 2 ? "https://www.google.com/maps/dir/" + pins.slice().reverse().map((v) => v.loc.lat + "," + v.loc.lng).join("/") : "";

  return shell(r.name + " – Rep", `${navBar("reps")}<p><a href="/dashboard?view=reps">← All reps</a></p>
<div class="phead"><div><h1>${esc(r.name)}</h1><p class="lede">${esc(r.email || "No email yet – add one below")}${rate ? " · £" + esc(String(rate)) + "/hour" : ""}${!r.hash ? " · no password yet" : ""}</p></div>
<button type="button" class="copybtn big" data-copy="${esc(P.inviteText(r))}">${COPY_ICON} Copy login</button></div>
${msg ? `<div class="msg">${esc(msg)}</div>` : ""}${err ? `<div class="msg err">${esc(err)}</div>` : ""}
<div class="kpis"><div class="kpi"><b>${esc(R.hrs(wMs))}</b><span>Hours this week</span></div><div class="kpi"><b>${rate ? money(wMs / 3600000 * rate) : "–"}</b><span>Pay this week</span></div>
<div class="kpi"><b>${wVs.length}</b><span>Visits this week</span></div><div class="kpi"><b>${wVs.filter((v) => v.leaflet).length}</b><span>Leaflets</span></div><div class="kpi"><b>${wVs.filter(R.isLead).length}</b><span>Leads</span></div><div class="kpi"><b>${perHour}</b><span>Visits per hour</span></div></div>
<h2>Timesheet</h2><p class="mut">Breaks are taken off the hours. Change a time and press Save to correct it (it will show as Edited).</p>
<div class="scroll"><table><thead><tr><th>Day</th><th>Clock in</th><th>Clock out</th><th>Breaks</th><th>Hours</th><th></th><th>Correct times</th></tr></thead><tbody>${ts || `<tr><td colspan="7" class="mut">No shifts yet.</td></tr>`}</tbody></table></div>
<div class="chead" style="margin-top:22px"><h2 style="margin:0">Visits <span class="mut">(${vs.length})</span></h2>
<form method="get" class="inline"><input type="hidden" name="view" value="rep"><input type="hidden" name="key" value="${esc(r.key)}"><input type="date" name="day" value="${esc(day)}" aria-label="Day"><button class="grey" type="submit">Show day</button>${day ? ` <a href="/dashboard?view=rep&key=${esc(r.key)}">Last 14 days</a>` : ""}</form></div>
${routeUrl ? `<p><a href="${esc(routeUrl)}" target="_blank" rel="noopener">See these visits on Google Maps →</a></p>` : ""}
<div class="scroll"><table><thead><tr><th>When</th><th>Company</th><th>Outcome</th><th>Lead</th><th>Notes</th><th></th><th></th></tr></thead><tbody>${vrows || `<tr><td colspan="7" class="mut">No visits ${day ? "that day" : "in the last 14 days"}.</td></tr>`}</tbody></table></div>
<div class="grid" style="margin-top:18px"><div class="card"><h2>Hourly rate</h2><form method="post" class="inline"><input type="hidden" name="do" value="reprate"><input type="hidden" name="key" value="${esc(r.key)}"><input name="rate" inputmode="decimal" value="${esc(r.rate || "")}" placeholder="e.g. 12.21"><button class="grey" type="submit">Save</button></form></div>
<div class="card"><h2>Email login</h2><form method="post" class="inline"><input type="hidden" name="do" value="setemail"><input type="hidden" name="key" value="${esc(r.key)}"><input name="email" type="email" value="${esc(r.email || "")}" placeholder="name@example.com" required><button class="grey" type="submit">Save email</button></form>
<h2 style="margin-top:16px">Password</h2><form method="post" class="inline"><input type="hidden" name="do" value="partnerpw"><input type="hidden" name="key" value="${esc(r.key)}"><input type="hidden" name="back" value="detail"><input name="password" type="text" autocomplete="off" placeholder="New password (6+ characters)"><button class="grey" type="submit">Set password</button></form>
<form method="post" style="margin-top:10px" onsubmit="return confirm('Remove this rep? Their shifts and visits are kept.')"><input type="hidden" name="do" value="delpartner"><input type="hidden" name="key" value="${esc(r.key)}"><button class="red" type="submit">Remove rep</button></form></div></div>${COPY_JS}`);
}

/* ---------- partner programme applications ---------- */
const APP_STATUSES = ["New", "Contacted", "Visit booked", "Call booked", "Approved", "Declined"];

async function applicationsView(st, q, msg, err) {
  const { blobs } = await st.apps.list();
  const apps = (await Promise.all(blobs.map((b) => st.apps.get(b.key, { type: "json" })))).filter(Boolean)
    .sort((a, b) => (b.at || "").localeCompare(a.at || ""));
  const show = q.status === "all" ? apps : q.status ? apps.filter((a) => a.status === q.status) : apps.filter((a) => a.status !== "Approved" && a.status !== "Declined");
  const tab = (key, label, n) => `<a href="/dashboard?view=applications${key ? "&status=" + encodeURIComponent(key) : ""}" class="${(q.status || "") === key ? "on" : ""}">${esc(label)} <span class="mut">(${n})</span></a>`;
  const open = apps.filter((a) => a.status !== "Approved" && a.status !== "Declined").length;
  const rows = show.map((a) => `<tr><td>${esc(fmtDate(a.at))}</td>
<td><strong>${esc(a.name)}</strong><div>${esc(a.business)}</div><div class="mut">${esc(a.type)}</div></td>
<td>${a.phone ? `<a href="tel:${esc(a.phone)}">${esc(a.phone)}</a>` : ""}<div><a href="mailto:${esc(a.email)}">${esc(a.email)}</a></div></td>
<td><strong>${esc(a.contactBy)}</strong>${a.address ? `<div class="mut">${esc(a.address)}</div>` : ""}<div class="mut">${esc([a.days, a.time].filter(Boolean).join(" · "))}</div></td>
<td class="mut" style="max-width:260px">${esc(a.estimate || "")}${a.message ? `<div style="color:var(--ink);margin-top:4px">“${esc(a.message)}”</div>` : ""}</td>
<td><form method="post"><input type="hidden" name="do" value="appstatus"><input type="hidden" name="id" value="${esc(a.id)}"><select name="status" onchange="this.form.submit()" aria-label="Status">${APP_STATUSES.map((x) => `<option${x === a.status ? " selected" : ""}>${esc(x)}</option>`).join("")}</select></form>
${a.partnerKey ? `<div style="margin-top:6px"><a href="/dashboard?view=partner&key=${esc(a.partnerKey)}">Open partner →</a></div>` : `<button type="button" class="grey" style="margin-top:6px" data-approve='${esc(JSON.stringify({ id: a.id, name: a.name, email: a.email }))}'>Approve</button>`}</td></tr>`).join("");
  return shell("Applications – Partners", `${navBar("applications")}<div class="phead"><div><h1>Applications</h1><p class="lede">People who applied on the partner page. <a href="https://sncleaningservices.co.uk/partnership-commisions/" target="_blank" rel="noopener">Open the page</a></p></div></div>
${msg ? `<div class="msg">${esc(msg)}</div>` : ""}${err ? `<div class="msg err">${esc(err)}</div>` : ""}
<nav class="subtabs">${tab("", "Open", open)}${APP_STATUSES.map((x) => tab(x, x, apps.filter((a) => a.status === x).length)).join("")}${tab("all", "All", apps.length)}</nav>
<div class="scroll"><table><thead><tr><th>Date</th><th>Who</th><th>Contact</th><th>Wants</th><th>Calculator / message</th><th>Status</th></tr></thead>
<tbody>${rows || `<tr><td colspan="6" class="mut">No applications here yet.</td></tr>`}</tbody></table></div>
<dialog id="appdlg" class="dlg"><form method="post"><input type="hidden" name="do" value="approveapp"><input type="hidden" name="id" id="ap-id"><h2>Approve as partner</h2>
<label for="ap-name">Name</label><input id="ap-name" name="name" required>
<label for="ap-email">Email (they log in with this)</label><input id="ap-email" name="email" type="email" required>
<label for="ap-com">Commission % (optional)</label><input id="ap-com" name="commission" inputmode="decimal" value="10">
<label for="ap-pw">Password for them (at least 6 characters)</label><input id="ap-pw" name="password" type="text" autocomplete="off" minlength="6" required>
<div class="btns"><button type="submit">Create partner</button><button type="button" class="grey" onclick="this.closest('dialog').close()">Cancel</button></div></form></dialog>
<script>document.addEventListener("click",function(e){var b=e.target.closest("[data-approve]");if(!b)return;var d=JSON.parse(b.getAttribute("data-approve"));document.getElementById("ap-id").value=d.id;document.getElementById("ap-name").value=d.name;document.getElementById("ap-email").value=d.email;document.getElementById("appdlg").showModal();});</script>`);
}

function settingsView(s, msg, err) {
  const pixRows = s.pixels.map((p) => `<tr><td>${esc(p.name)}</td><td><code>${esc(p.pixelId)}</code></td>
<td>${p.token ? "••••" + esc(p.token.slice(-4)) : '<span class="bad">No token</span>'}</td><td>${esc(p.testCode || "")}</td>
<td><form method="post" onsubmit="return confirm('Remove this pixel?')"><input type="hidden" name="do" value="delpixel"><input type="hidden" name="key" value="${esc(p.key)}"><button class="red" type="submit">Remove</button></form></td></tr>`).join("");
  const opts = (sel) => `<option value="">No pixel (nothing sent)</option>` + s.pixels.map((p) => `<option value="${esc(p.key)}"${p.key === sel ? " selected" : ""}>${esc(p.name)} (${esc(p.pixelId)})</option>`).join("");
  const pageRows = Object.entries(s.pages).map(([slug, pg]) => `<tr>
<td><a href="/go/${esc(slug)}/" target="_blank">/go/${esc(slug)}/</a><input type="hidden" name="slug" value="${esc(slug)}"></td>
<td><select name="pixel">${opts(pg.pixel)}</select></td>
<td><input name="bookingBase" value="${esc(pg.bookingBase || "")}" style="width:100%;min-width:260px"></td></tr>`).join("");

  return shell("Meta settings – Leads", `${navBar("settings")}<h1>Meta settings</h1>
${msg ? `<div class="msg">${esc(msg)}</div>` : ""}${err ? `<div class="msg err">${esc(err)}</div>` : ""}
<h2>Pixels</h2>
<div class="scroll"><table><thead><tr><th>Name</th><th>Pixel ID</th><th>Access token</th><th>Test code</th><th></th></tr></thead>
<tbody>${pixRows || `<tr><td colspan="5" class="mut">No pixels yet. Add one below.</td></tr>`}</tbody></table></div>
<form method="post" class="card" style="margin-top:14px"><input type="hidden" name="do" value="addpixel">
<div class="grid">
<div><label for="pn">Name (anything, e.g. SN Cleaning main)</label><input id="pn" name="name" required style="width:100%"></div>
<div><label for="pi">Pixel ID</label><input id="pi" name="pixelId" required inputmode="numeric" style="width:100%"></div>
<div><label for="pt">Conversions API access token</label><input id="pt" name="token" required type="password" autocomplete="off" style="width:100%"></div>
<div><label for="tc">Test event code (optional)</label><input id="tc" name="testCode" style="width:100%"></div>
</div>
<p class="mut">The token is from Events Manager → your pixel → Settings → Conversions API → Generate access token. It is kept on the server and never shown again in full. Use a test code only while testing, then remove and re-add the pixel without it.</p>
<button type="submit">Add pixel</button></form>

<h2>Landing pages</h2>
<form method="post"><input type="hidden" name="do" value="pages">
<div class="scroll"><table><thead><tr><th>Page</th><th>Pixel</th><th>Booking form link starts with</th></tr></thead><tbody>${pageRows}</tbody></table></div>
<p class="mut">The booking link is followed by the service, e.g. <code>/domestic-cleaning</code>. Their name, email, phone and postcode are added to the link so the form is filled in.</p>
<button type="submit">Save pages</button></form>

<form method="post" class="card inline" style="margin-top:14px"><input type="hidden" name="do" value="addpage">
<div><label for="ns">Add a landing page address</label><input id="ns" name="slug" placeholder="deep-cleaning" pattern="[a-z0-9-]+" required></div>
<button type="submit" class="grey">Add page</button>
<p class="mut" style="flex-basis:100%;margin:0">This only adds the settings row. The page itself still has to be built at /go/that-name/.</p></form>

<h2>Facebook form leads (instant forms)</h2>
<form method="post" class="card"><input type="hidden" name="do" value="leadads">
<dl style="margin-bottom:14px"><dt>Callback URL</dt><dd><code>https://sncleaningservices.co.uk/api/meta-leads</code></dd>
<dt>Verify token</dt><dd><code>${esc(s.leadAds.verifyToken)}</code></dd>
<dt>Connected Pages</dt><dd>${Object.entries(s.leadAds.pages || {}).map(([id, pg]) => `${esc(pg.name)} <span class="mut">(${esc(id)})</span> ${pg.subscribed ? '<span class="ok">receiving leads</span>' : `<span class="bad" title="${esc(pg.error || "")}">not subscribed</span>`}`).join("<br>") || '<span class="bad">None yet</span>'}</dd>
${s.leadAds.lastConnect ? `<dt>Last connect</dt><dd class="mut">${esc(s.leadAds.lastConnect)}</dd>` : ""}</dl>
<div class="grid">
<div><label for="las">App secret ${s.leadAds.appSecret ? `<span class="ok">(saved ••••${esc(s.leadAds.appSecret.slice(-4))})</span>` : '<span class="bad">(not added)</span>'}</label><input id="las" name="appSecret" type="text" autocomplete="off" spellcheck="false" data-lpignore="true" data-1p-ignore placeholder="Leave empty to keep" style="width:100%;-webkit-text-security:disc"></div>
<div><label for="lpt">Access token from Graph API Explorer</label><input id="lpt" name="pageToken" type="text" autocomplete="off" spellcheck="false" data-lpignore="true" data-1p-ignore placeholder="Paste to connect your Page" style="width:100%;-webkit-text-security:disc"></div>
<div><label for="lpx">Pixel for Purchase (when you mark one Booked)</label><select id="lpx" name="pixel" style="width:100%">${opts(s.leadAds.pixel)}</select></div>
</div>
<p class="mut">To connect your Page: Graph API Explorer → choose the SN Cleaning Leads app → permissions leads_retrieval, pages_show_list, pages_read_engagement, pages_manage_metadata, pages_manage_ads, ads_management → Generate Access Token → paste it above with the App secret and save. Paste the Callback URL and Verify token into your Meta app (Webhooks → Page → leadgen). Each new form lead then appears here as "Meta (Facebook form)" with its Meta Lead ID and campaign, and is sent to Dilvon with that Lead ID. Tokens stay on the server.</p>
<button type="submit">Save Facebook form settings</button></form>`);
}

/* Turn the short-lived token from Graph API Explorer into Page tokens that don't
   expire, save them, and subscribe each Page to leadgen so form leads arrive. */
async function connectPages(la, shortToken) {
  const G = "https://graph.facebook.com/" + F.GRAPH_VERSION;
  const get = async (url, opts) => { const r = await fetch(url, opts); const j = await r.json().catch(() => ({})); if (j.error) throw new Error(j.error.message); return j; };
  const when = new Date().toLocaleString("en-GB", { timeZone: "Europe/London" });
  try {
    if (!la.appSecret) return when + ": add the App secret first";
    const ex = await get(G + "/oauth/access_token?grant_type=fb_exchange_token&client_id=" + encodeURIComponent(la.appId) +
      "&client_secret=" + encodeURIComponent(la.appSecret) + "&fb_exchange_token=" + encodeURIComponent(shortToken));
    const userTok = ex.access_token;
    const acc = await get(G + "/me/accounts?fields=id,name,access_token&limit=100&access_token=" + encodeURIComponent(userTok));
    let list = acc.data || [];
    if (!list.length) {
      // Pages owned through a Business portfolio are often missing from /me/accounts.
      // Ask which Pages were ticked in the pop-up, then fetch each Page's token directly.
      const dbg = await get(G + "/debug_token?input_token=" + encodeURIComponent(userTok) +
        "&access_token=" + encodeURIComponent(la.appId + "|" + la.appSecret));
      const ids = new Set();
      ((dbg.data || {}).granular_scopes || []).forEach((g) => (g.target_ids || []).forEach((id) => ids.add(String(id))));
      for (const id of ids) {
        try {
          const pg = await get(G + "/" + id + "?fields=id,name,access_token&access_token=" + encodeURIComponent(userTok));
          if (pg.access_token) list.push(pg);
        } catch (e) { /* not a Page, e.g. an ad account */ }
      }
    }
    if (!list.length) return when + ": no Pages found. Tick your Page and the permissions when generating the token.";
    la.pages = la.pages || {};
    for (const pg of list) {
      const rec = { name: pg.name, token: pg.access_token, subscribed: false, error: "" };
      try {
        const sub = await get(G + "/" + pg.id + "/subscribed_apps?subscribed_fields=leadgen&access_token=" + encodeURIComponent(pg.access_token), { method: "POST" });
        rec.subscribed = !!sub.success;
      } catch (e) { rec.error = String(e.message).slice(0, 200); }
      la.pages[pg.id] = rec;
    }
    la.pageToken = list[0].access_token;
    return when + ": connected " + list.map((x) => x.name).join(", ");
  } catch (e) {
    return when + ": " + String(e.message || e).slice(0, 250);
  }
}

/* ---------- handler ---------- */

exports.handler = async (event) => {
  if (!process.env.DASHBOARD_PASSWORD) {
    return html(shell("Leads", `<p class="bad">DASHBOARD_PASSWORD is not set in Netlify.</p>`));
  }
  const q = event.queryStringParameters || {};
  const authed = F.isAuthed(event);

  if (event.httpMethod === "POST") {
    const p = new URLSearchParams(event.body || "");
    if (!authed) {
      if (p.get("password") === process.env.DASHBOARD_PASSWORD) return redirect("/dashboard", F.loginCookie());
      return html(loginPage("That password is not right."), { statusCode: 401 });
    }
    const st = F.stores(event);
    const act = p.get("do");

    if (act === "dilvon" || act === "dilvonall") {
      const ids = act === "dilvon" ? [p.get("id") || ""] : (await st.leads.list()).blobs.map((x) => x.key);
      let sent = 0, failed = 0;
      for (const id of ids) {
        if (!/^L[a-z0-9]+$/.test(id)) continue;
        const lead = await st.leads.get(id, { type: "json" });
        if (!lead || (lead.dilvon && lead.dilvon.ok) || !(lead.email || lead.phone)) continue;
        lead.dilvon = await F.sendToDilvon(lead);
        lead.dilvon.ok ? sent++ : failed++;
        await st.leads.setJSON(id, lead);
      }
      const back = act === "dilvon" ? "/dashboard?id=" + encodeURIComponent(ids[0]) + "&" : "/dashboard?view=leads&";
      return redirect(back + "msg=dilvon&sent=" + sent + "&failed=" + failed);
    }

    if (act === "update" || act === "delete") {
      const id = p.get("id") || "";
      const lead = /^L[a-z0-9]+$/.test(id) ? await st.leads.get(id, { type: "json" }) : null;
      if (!lead) return redirect("/dashboard");
      if (act === "delete") { await st.leads.delete(id); return redirect("/dashboard?view=leads&msg=deleted"); }

      const status = STATUSES.includes(p.get("status")) ? p.get("status") : lead.status;
      const valueRaw = (p.get("value") || "").replace(/[£,\s]/g, "");
      const via = BOOKED_VIA[p.get("via")] ? p.get("via") : "phone";
      if (valueRaw && !/^\d+(\.\d{1,2})?$/.test(valueRaw)) return redirect("/dashboard?id=" + id + "&err=value");
      if (BOOKED.includes(status) && !lead.purchaseSent && BOOKED_VIA[via].send && !valueRaw) {
        return redirect("/dashboard?id=" + id + "&err=needvalue");
      }
      const now = new Date().toISOString();
      if (status !== lead.status) {
        lead.journey = lead.journey || [];
        lead.journey.push({ at: now, type: "status", detail: "Status: " + lead.status + " → " + status });
      }
      lead.status = status;
      lead.value = valueRaw;
      lead.bookedVia = via;
      lead.notes = (p.get("notes") || "").slice(0, 2000);
      lead.updatedAt = now;

      let note = "saved";
      if (BOOKED.includes(status) && !lead.purchaseSent) {
        if (!BOOKED_VIA[via].send) {
          note = "saved-dilvon";
        } else if (lead.consent !== "accepted" && lead.source !== "facebook_form") {
          note = "saved-noconsent";
        } else {
          const settings = await F.getSettings(st);
          const eventId = "purchase-" + lead.id; // fixed per lead: Meta drops any repeat
          const log = await F.sendToMeta(F.pixelForLead(settings, lead), lead, {
            name: "Purchase", id: eventId, actionSource: BOOKED_VIA[via].source,
            custom: { currency: "GBP", value: Number(valueRaw), content_name: lead.page }
          });
          lead.meta = lead.meta || [];
          lead.meta.push(log);
          if (log.ok) { lead.purchaseSent = true; note = "saved-sent"; } else { note = "saved-failed"; }
        }
      }
      // ChatGPT ads: one appointment_scheduled per lead, with the booking value. Dilvon does not tell
      // OpenAI, so this goes for online bookings too. Only for visitors who accepted cookies.
      if (BOOKED.includes(status) && !lead.openaiBookedSent && lead.consent === "accepted") {
        const data = { type: "customer_action" };
        if (valueRaw) { data.amount = Math.round(Number(valueRaw) * 100); data.currency = "GBP"; }
        const log = await F.sendToOpenAI(lead, { type: "appointment_scheduled", id: "booked_" + lead.id, data, actionSource: BOOKED_VIA[via].oai });
        lead.meta = lead.meta || [];
        lead.meta.push(log);
        if (log.ok) lead.openaiBookedSent = true;
      }
      await st.leads.setJSON(id, lead);
      return redirect("/dashboard?id=" + id + "&msg=" + note);
    }

    const s = await F.getSettings(st);
    if (act === "addpixel") {
      const pixelId = (p.get("pixelId") || "").replace(/\D/g, "");
      const tokenVal = (p.get("token") || "").trim();
      if (!pixelId || !tokenVal) return redirect("/dashboard?view=settings&err=pixel");
      s.pixels.push({ key: F.newId("P"), name: (p.get("name") || "Pixel").slice(0, 60), pixelId,
        token: tokenVal, testCode: (p.get("testCode") || "").trim().slice(0, 40) });
      await F.saveSettings(st, s);
      return redirect("/dashboard?view=settings&msg=pixel");
    }
    if (act === "delpixel") {
      const key = p.get("key");
      s.pixels = s.pixels.filter((x) => x.key !== key);
      Object.values(s.pages).forEach((pg) => { if (pg.pixel === key) pg.pixel = ""; });
      await F.saveSettings(st, s);
      return redirect("/dashboard?view=settings&msg=removed");
    }
    if (act === "pages") {
      const slugs = p.getAll("slug"), pix = p.getAll("pixel"), bases = p.getAll("bookingBase");
      slugs.forEach((slug, i) => {
        if (!s.pages[slug]) return;
        s.pages[slug].pixel = s.pixels.some((x) => x.key === pix[i]) ? pix[i] : "";
        const base = (bases[i] || "").trim().replace(/\/+$/, "");
        if (/^https:\/\/[^\s]+$/.test(base)) s.pages[slug].bookingBase = base;
      });
      await F.saveSettings(st, s);
      return redirect("/dashboard?view=settings&msg=pages");
    }
    if (act === "addpartner") {
      const email = (p.get("email") || "").trim().toLowerCase();
      const pw = p.get("password") || "";
      const isRep = p.get("role") === "rep";
      const back = isRep ? "/dashboard?view=reps&" : "/dashboard?view=partners&";
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email) || pw.length < 6 || s.partners.some((x) => (x.email || "").toLowerCase() === email)) return redirect(back + "err=partner");
      // short code for their tracking link, made from the email
      let base = (p.get("code") || email.split("@")[0]).toLowerCase().replace(/[^a-z0-9-]/g, "").slice(0, 20) || "partner", code = base, n = 2;
      while (s.partners.some((x) => x.code === code)) code = base + n++;
      const crypto = require("crypto");
      const com = (p.get("commission") || "").replace(/[^0-9.]/g, "");
      const pr = { key: F.newId("P"), name: (p.get("name") || code).slice(0, 80), code, email, salt: "", hash: "", commission: com, createdAt: new Date().toISOString() };
      if (isRep) { pr.role = "rep"; pr.rate = (p.get("rate") || "").replace(/[^0-9.]/g, ""); }
      if (pw) { pr.salt = crypto.randomBytes(16).toString("hex"); pr.hash = F.hashPw(pw, pr.salt); }
      else pr.invite = crypto.randomBytes(18).toString("hex"); // they set their own password once with this link
      s.partners.push(pr);
      await F.saveSettings(st, s);
      return redirect(back + "msg=" + (isRep ? "rep" : "partner"));
    }
    if (act === "partnerpw") {
      const pr = s.partners.find((x) => x.key === p.get("key"));
      const pw = p.get("password") || "";
      const back = p.get("back") === "detail" && pr ? "/dashboard?view=" + (pr.role === "rep" ? "rep" : "partner") + "&key=" + encodeURIComponent(pr.key) + "&" : "/dashboard?view=partners&";
      if (!pr || pw.length < 6) return redirect(back + "err=partnerpw");
      pr.salt = require("crypto").randomBytes(16).toString("hex"); pr.hash = F.hashPw(pw, pr.salt); delete pr.invite;
      await F.saveSettings(st, s);
      return redirect(back + "msg=partnerpw");
    }
    if (act === "reprate" || act === "editshift" || act === "delvisit") {
      const R = require("./reps");
      const pr = s.partners.find((x) => x.key === p.get("key") && x.role === "rep");
      if (!pr) return redirect("/dashboard?view=reps");
      const back = "/dashboard?view=rep&key=" + encodeURIComponent(pr.key) + "&";
      if (act === "reprate") { pr.rate = (p.get("rate") || "").replace(/[^0-9.]/g, ""); await F.saveSettings(st, s); return redirect(back + "msg=reprate"); }
      const store = F.stores(event).reps;
      if (act === "delvisit") { const id = p.get("visit") || ""; if (/^V[a-z0-9]+$/.test(id)) { await store.delete("visit/" + pr.key + "/" + id); await store.delete("photo/" + id); } return redirect(back + "msg=visitdel"); }
      const sh = await store.get("shift/" + pr.key + "/" + (p.get("shift") || "").replace(/[^A-Za-z0-9]/g, ""), { type: "json" });
      if (!sh) return redirect(back);
      const day = R.londonDay(sh.in);
      const inIso = R.londonIso(day, p.get("in") || ""), outIso = p.get("out") ? R.londonIso(day, p.get("out")) : "";
      if (!inIso || (p.get("out") && !outIso) || (outIso && outIso <= inIso)) return redirect(back + "err=shift");
      sh.in = inIso; sh.out = outIso; sh.edited = new Date().toISOString(); delete sh.auto;
      (sh.breaks || []).forEach((b) => { if (outIso && (!b.end || b.end > outIso)) b.end = outIso; if (b.start < inIso) b.start = inIso; });
      sh.breaks = (sh.breaks || []).filter((b) => !b.end || b.end > b.start);
      await store.setJSON("shift/" + pr.key + "/" + sh.id, sh);
      return redirect(back + "msg=shift");
    }
    if (act === "appstatus" || act === "approveapp") {
      const store = F.stores(event).apps;
      const id = (p.get("id") || "").replace(/[^A-Za-z0-9]/g, "");
      const app = id && await store.get(id, { type: "json" });
      if (!app) return redirect("/dashboard?view=applications");
      if (act === "appstatus") {
        if (APP_STATUSES.includes(p.get("status"))) { app.status = p.get("status"); await store.setJSON(id, app); }
        return redirect("/dashboard?view=applications&msg=appstatus");
      }
      const email = (p.get("email") || "").trim().toLowerCase(), pw = p.get("password") || "";
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email) || pw.length < 6 || s.partners.some((x) => (x.email || "").toLowerCase() === email)) return redirect("/dashboard?view=applications&err=approve");
      let base = email.split("@")[0].toLowerCase().replace(/[^a-z0-9-]/g, "").slice(0, 20) || "partner", code = base, n = 2;
      while (s.partners.some((x) => x.code === code)) code = base + n++;
      const salt = require("crypto").randomBytes(16).toString("hex");
      const pr = { key: F.newId("P"), name: (p.get("name") || app.name || code).slice(0, 80), business: app.business, code, email, salt, hash: F.hashPw(pw, salt),
        commission: (p.get("commission") || "").replace(/[^0-9.]/g, ""), createdAt: new Date().toISOString(), fromApplication: id };
      s.partners.push(pr);
      await F.saveSettings(st, s);
      app.status = "Approved"; app.partnerKey = pr.key; await store.setJSON(id, app);
      return redirect("/dashboard?view=partner&key=" + encodeURIComponent(pr.key) + "&msg=approved");
    }
    if (act === "setemail") {
      const pr = s.partners.find((x) => x.key === p.get("key"));
      const email = (p.get("email") || "").trim().toLowerCase();
      const back = pr ? "/dashboard?view=" + (pr.role === "rep" ? "rep" : "partner") + "&key=" + encodeURIComponent(pr.key) + "&" : "/dashboard?";
      if (!pr || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email) || s.partners.some((x) => x !== pr && (x.email || "").toLowerCase() === email)) return redirect(back + "err=email");
      pr.email = email; await F.saveSettings(st, s);
      return redirect(back + "msg=email");
    }
    if (act === "delpartner") {
      const wasRep = s.partners.some((x) => x.key === p.get("key") && x.role === "rep");
      s.partners = s.partners.filter((x) => x.key !== p.get("key"));
      await F.saveSettings(st, s);
      return redirect(wasRep ? "/dashboard?view=reps&msg=repdel" : "/dashboard?view=partners&msg=partnerdel");
    }
    if (act === "addgoal") {
      const P = require("./partners");
      const type = P.GOAL_TYPES[p.get("type")] ? p.get("type") : "";
      const target = parseInt(p.get("target") || "", 10);
      const start = (p.get("start") || "").slice(0, 10), deadline = (p.get("deadline") || "").slice(0, 10);
      if (!type || !(target > 0) || !/^\d{4}-\d{2}-\d{2}$/.test(start) || !/^\d{4}-\d{2}-\d{2}$/.test(deadline) || deadline < start) return redirect("/dashboard?view=goals&err=goal");
      s.goals.push({ key: F.newId("G"), type, target, start, deadline, label: (p.get("label") || "").slice(0, 100) });
      await F.saveSettings(st, s);
      return redirect("/dashboard?view=goals&msg=goal");
    }
    if (act === "delgoal") {
      s.goals = s.goals.filter((x) => x.key !== p.get("key"));
      await F.saveSettings(st, s);
      return redirect("/dashboard?view=goals&msg=goaldel");
    }
    if (act === "addresource") {
      const P = require("./partners");
      const url = (p.get("url") || "").trim();
      if (!(p.get("title") || "").trim() || !/^https:\/\/\S+$/.test(url)) return redirect("/dashboard?view=resources&err=resource");
      s.resources.push({ key: F.newId("R"), title: p.get("title").trim().slice(0, 120), type: P.RESOURCE_TYPES[p.get("type")] ? p.get("type") : "link",
        url: url.slice(0, 1000), description: (p.get("description") || "").slice(0, 300), createdAt: new Date().toISOString() });
      await F.saveSettings(st, s);
      return redirect("/dashboard?view=resources&msg=resource");
    }
    if (act === "delresource") {
      s.resources = s.resources.filter((x) => x.key !== p.get("key"));
      await F.saveSettings(st, s);
      return redirect("/dashboard?view=resources&msg=resourcedel");
    }
    if (act === "synckey") {
      s.partnerSync.key = "psk_" + require("crypto").randomBytes(20).toString("hex");
      await F.saveSettings(st, s);
      return redirect("/dashboard?view=resources&msg=synckey");
    }
    if (act === "leadads") {
      const tok = (p.get("pageToken") || "").trim(), sec = (p.get("appSecret") || "").trim();
      if (sec) s.leadAds.appSecret = sec;
      if (tok) s.leadAds.lastConnect = await connectPages(s.leadAds, tok);
      s.leadAds.pixel = s.pixels.some((x) => x.key === p.get("pixel")) ? p.get("pixel") : ((s.pixels[0] || {}).key || "");
      await F.saveSettings(st, s);
      if (tok) {
        const ok = / connected /.test(s.leadAds.lastConnect);
        return redirect("/dashboard?view=settings&" + (ok ? "msg" : "err") + "=connect");
      }
      return redirect("/dashboard?view=settings&msg=leadads");
    }
    if (act === "addpage") {
      const slug = (p.get("slug") || "").toLowerCase().replace(/[^a-z0-9-]/g, "");
      if (slug && !s.pages[slug]) {
        s.pages[slug] = { pixel: "", bookingBase: "https://app.sncleaningservices.co.uk/book/sn-cleaning-services" };
        await F.saveSettings(st, s);
      }
      return redirect("/dashboard?view=settings&msg=pages");
    }
    return redirect("/dashboard");
  }

  if (q.logout) return redirect("/dashboard", "sn_applicants=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Lax");
  if (!authed) return html(loginPage(""));
  const st = F.stores(event);

  const MSGS = {
    deleted: "Lead deleted.", saved: "Saved.", "saved-sent": "Saved. Purchase sent to Meta.",
    "saved-failed": "Saved, but Meta did not accept the Purchase. See Meta's reply below. Save again to retry.",
    "saved-noconsent": "Saved. Not sent to Meta because this person did not accept cookies.",
    "saved-dilvon": "Saved. Not sent to Meta, because the Dilvon booking form reports online bookings itself.",
    leadads: "Facebook form settings saved.", partner: "Partner added. Press Copy login and send it to them, then tell them the password.", partnerpw: "Password changed.", partnerdel: "Partner removed.", rep: "Rep added. Press Copy login and send it to them, then tell them the password.", email: "Email saved.", appstatus: "Status saved.", approved: "Partner created. Press Copy login and send it to them, then tell them the password.", repdel: "Rep removed.", reprate: "Hourly rate saved.", shift: "Shift times corrected.", visitdel: "Visit deleted.", goal: "Goal added.", goaldel: "Goal removed.", resource: "Resource added.", resourcedel: "Resource removed.", synckey: "New key created. Give it to Dilvon (the old one stops working).", pixel: "Pixel added. Now choose it for a landing page below.", removed: "Pixel removed.", pages: "Landing pages saved."
  };
  const ERRS = {
    value: "The booking value must be a number, like 120 or 89.50.",
    needvalue: "Add the booking value (£) when marking as Booked, so Meta learns what the customer was worth.",
    pixel: "Pixel ID and access token are both needed.",
    partner: "Fill in a name, an email that isn't already used, and a password of at least 6 characters.",
    partnerpw: "The password must be at least 6 characters.",
    email: "That email doesn't look right, or another account already uses it.",
    approve: "Add a valid email that isn't already used and a password of at least 6 characters.",
    shift: "Those times don't work. Clock out must be after clock in (same day).",
    goal: "Choose what to count, a target above 0, a start date and a deadline after it.",
    resource: "Add a title and a link starting with https://"
  };

  if (q.msg === "dilvon") MSGS.dilvon = "Sent to Dilvon: " + (Number(q.sent) || 0) + (Number(q.failed) ? ". Failed: " + Number(q.failed) + " (hover over 'Not sent' on the lead to see why)." : ".");
  if (q.view === "settings") {
    const s = await F.getSettings(st);
    const lc = s.leadAds.lastConnect.replace(/^[^:]+:\d\d:\d\d: /, "");
    MSGS.connect = "Facebook Page connected: " + lc.replace(/^connected /, "") + ". Form leads will now arrive here.";
    ERRS.connect = "The token was not accepted: " + lc + ". Generate a new token in Graph API Explorer and paste it again (with the App secret saved).";
    if (!s.leadAds.verifyToken) { s.leadAds.verifyToken = "sn-" + require("crypto").randomBytes(12).toString("hex"); await F.saveSettings(st, s); }
    return html(settingsView(s, MSGS[q.msg], ERRS[q.err]));
  }
  const leads = await allLeads(st);
  if (q.view === "report") return html(reportView(leads, await allVisits(st)));
  if (q.photo && /^V[a-z0-9]+$/.test(q.photo)) {
    const d = await st.reps.get("photo/" + q.photo);
    if (!d) return { statusCode: 404, headers: { "content-type": "text/plain" }, body: "No photo" };
    return { statusCode: 200, headers: { "content-type": "text/html; charset=utf-8", "cache-control": "private, no-store" }, body: `<!doctype html><meta name="viewport" content="width=device-width,initial-scale=1"><title>Photo</title><body style="margin:0;background:#111;display:grid;place-items:center;min-height:100vh"><img src="${d}" alt="Visit photo" style="max-width:100%;max-height:100vh">` };
  }
  if (q.view === "applications") return html(await applicationsView(st, q, MSGS[q.msg], ERRS[q.err]));
  if (q.view === "reps") return html(await repsView(await F.getSettings(st), st, MSGS[q.msg], ERRS[q.err]));
  if (q.view === "rep") {
    const s = await F.getSettings(st);
    const r = s.partners.find((x) => x.key === q.key && x.role === "rep");
    if (!r) return redirect("/dashboard?view=reps");
    return html(await repView(s, st, r, q, MSGS[q.msg], ERRS[q.err]));
  }
  if (q.view === "partner") {
    const s = await F.getSettings(st);
    const pr = s.partners.find((x) => x.key === q.key);
    if (!pr) return redirect("/dashboard?view=partners");
    return html(partnerDetailView(s, pr, leads, await allVisits(st), MSGS[q.msg], ERRS[q.err]));
  }
  if (["partners", "goals", "resources"].includes(q.view)) {
    const s = await F.getSettings(st);
    if (require("./partners").ensureDefaults(s)) await F.saveSettings(st, s);
  }
  if (["partners", "goals", "resources"].includes(q.view)) return html(partnersView(await F.getSettings(st), leads, await allVisits(st), MSGS[q.msg], ERRS[q.err], q.view));
  if (q.id) {
    const l = leads.find((x) => x.id === q.id);
    if (!l) return redirect("/dashboard");
    return html(detailView(l, MSGS[q.msg], ERRS[q.err]));
  }
  if (q.view === "leads" || q.q != null || q.status != null) return html(listView(leads, q.q || "", q.status || "", MSGS[q.msg]));
  return html(homeView(await F.getSettings(st), leads, await allVisits(st)));
};
