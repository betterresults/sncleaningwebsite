/**
 * Password-protected leads dashboard at /leads (same password as /applicants).
 *
 *   /leads                 all leads, search by name / email / phone, filter by status
 *   /leads?id=L...         one lead: answers, where they came from, journey, Meta log,
 *                          change status, add booking value (sends Purchase to Meta once)
 *   /leads?view=report     leads, bookings and revenue per campaign
 *   /leads?view=settings   Meta pixels + tokens, and which pixel each landing page uses
 */

const F = require("../../lib/funnel");
const esc = F.esc;

const STATUSES = ["New", "Contacted", "Quote Sent", "Booked", "Completed", "Lost"];
const BOOKED = ["Booked", "Completed"];
const BOOKED_VIA = {
  phone: { label: "Phone", source: "phone_call", send: true },
  whatsapp: { label: "WhatsApp", source: "chat", send: true },
  manual: { label: "Other / in person", source: "other", send: true },
  dilvon: { label: "Online booking form (Dilvon tells Meta itself)", source: "", send: false }
};

const html = (body, extra) => Object.assign({
  statusCode: 200, headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" }, body
}, extra || {});
const redirect = (to, cookie) => ({
  statusCode: 302, headers: Object.assign({ location: to }, cookie ? { "set-cookie": cookie } : {}), body: ""
});

function shell(title, inner) {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex">
<title>${esc(title)}</title><style>
:root{--g:#1f6b66;--ink:#1d2926;--mut:#5b6b67;--line:#e2e8e6;--bg:#f6f8f7}
*{box-sizing:border-box}body{margin:0;font:15px/1.5 Inter,system-ui,-apple-system,Segoe UI,sans-serif;color:var(--ink);background:var(--bg)}
.wrap{max-width:1180px;margin:0 auto;padding:20px 16px 60px}
nav{display:flex;gap:6px;flex-wrap:wrap;margin-bottom:18px}nav a{padding:8px 14px;border-radius:999px;background:#fff;border:1px solid var(--line);color:var(--ink);text-decoration:none;font-weight:600;font-size:14px}nav a.on{background:var(--g);color:#fff;border-color:var(--g)}
h1{font-size:24px;margin:0 0 14px}h2{font-size:17px;margin:22px 0 10px}
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
code{font-size:12px;background:#f0f4f3;padding:1px 5px;border-radius:4px;word-break:break-all}
</style></head><body><div class="wrap">${inner}</div></body></html>`;
}

function navBar(on) {
  const a = (href, label, key) => `<a href="${href}" class="${on === key ? "on" : ""}">${label}</a>`;
  return `<nav>${a("/leads", "Leads", "list")}${a("/leads?view=report", "Report", "report")}${a("/leads?view=settings", "Meta settings", "settings")}${a("/applicants", "Applicants", "x")}</nav>`;
}

function loginPage(msg) {
  return shell("Leads", `<div class="card" style="max-width:380px;margin:60px auto">
<h1>Leads</h1>${msg ? `<p class="bad">${esc(msg)}</p>` : ""}
<form method="post"><label for="pw">Password</label>
<input id="pw" type="password" name="password" autocomplete="current-password" style="width:100%;margin-bottom:12px" autofocus>
<button type="submit">Open</button></form></div>`);
}

/* ---------- attribution helpers ---------- */

function sourceOf(t) {
  t = t || {};
  const src = (t.utm_source || "").toLowerCase();
  if (t.fbclid || /facebook|^fb$|instagram|^ig$|meta/.test(src)) return "Meta";
  if (src) return "Other (" + t.utm_source + ")";
  const ref = (t.referrer || "").toLowerCase();
  if (/google\.|bing\.|duckduckgo|yahoo\./.test(ref)) return "Organic";
  if (ref && ref.indexOf("sncleaningservices.co.uk") === -1) return "Other (" + ref.replace(/^https?:\/\//, "").split("/")[0] + ")";
  return "Direct";
}

function journeyLine(l) {
  const parts = [sourceOf(l.first)];
  parts.push((l.page || "") + " landing page", "Lead");
  const seen = new Set();
  (l.journey || []).forEach((j) => {
    if (j.type === "lead" || j.type === "status") return;
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

async function allLeads(st) {
  const { blobs } = await st.leads.list();
  const rows = await Promise.all(blobs.map((b) => st.leads.get(b.key, { type: "json" })));
  return rows.filter(Boolean).sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""));
}

function metaSummary(l) {
  const lead = (l.meta || []).find((m) => m.event === "Lead");
  const purchase = (l.meta || []).find((m) => m.event === "Purchase");
  const bit = (m, name) => !m ? "" : (m.ok ? `<span class="ok">${name} sent</span>` : `<span class="bad" title="${esc(m.response)}">${name} not sent</span>`);
  return [bit(lead, "Lead"), bit(purchase, "Purchase")].filter(Boolean).join("<br>") || `<span class="mut">–</span>`;
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
  if (status) rows = rows.filter((l) => l.status === status);

  const body = rows.map((l) => `<tr>
<td><a href="/leads?id=${esc(l.id)}">${esc(l.firstName)}</a><div class="mut">${esc(l.email)}<br>${esc(l.phone)}</div></td>
<td>${esc(fmtDate(l.createdAt))}</td>
<td>${statusPill(l.status)}${l.value ? `<div class="mut">${money(l.value)}</div>` : ""}</td>
<td>${esc(sourceOf(l.first))}<div class="mut">${esc((l.first || {}).utm_campaign || "")}</div></td>
<td class="journey">${esc(journeyLine(l))}</td>
<td>${metaSummary(l)}</td></tr>`).join("");

  return shell("Leads", `${navBar("list")}<h1>Leads <span class="mut">(${rows.length})</span></h1>
${msg ? `<div class="msg">${esc(msg)}</div>` : ""}
<form class="inline card" method="get" action="/leads">
<div style="flex:1;min-width:220px"><label for="q">Search name, email or phone</label><input id="q" name="q" value="${esc(q)}" style="width:100%"></div>
<div><label for="st">Status</label><select id="st" name="status"><option value="">All</option>${STATUSES.map((s) => `<option${s === status ? " selected" : ""}>${s}</option>`).join("")}</select></div>
<button type="submit">Search</button></form>
<div class="scroll"><table><thead><tr><th>Lead</th><th>Date</th><th>Status</th><th>Source / campaign</th><th>Journey</th><th>Meta</th></tr></thead>
<tbody>${body || `<tr><td colspan="6" class="mut">No leads yet.</td></tr>`}</tbody></table></div>`);
}

function detailView(l, msg, err) {
  const touch = (t) => {
    t = t || {};
    const keys = [["Source", sourceOf(t)], ["utm_source", t.utm_source], ["utm_medium", t.utm_medium], ["utm_campaign", t.utm_campaign],
      ["utm_content", t.utm_content], ["utm_term", t.utm_term], ["fbclid", t.fbclid], ["Landing page", t.landing], ["Referrer", t.referrer], ["When", fmtDate(t.at)]];
    return `<dl>${keys.filter((k) => k[1]).map((k) => `<dt>${k[0]}</dt><dd>${esc(k[1])}</dd>`).join("")}</dl>`;
  };
  const answers = Object.entries(l.answers || {}).map(([k, v]) => `<dt>${esc(k)}</dt><dd>${esc(v)}</dd>`).join("");
  const journey = (l.journey || []).map((j) => `<tr><td>${esc(fmtDate(j.at))}</td><td>${esc(j.detail)}</td></tr>`).join("");
  const meta = (l.meta || []).map((m) => `<tr><td>${esc(fmtDate(m.at))}</td><td>${esc(m.event)}</td>
<td>${m.ok ? '<span class="ok">Sent</span>' : '<span class="bad">Not sent</span>'}${m.pixelBrowser ? '<div class="mut">Browser pixel also fired</div>' : ""}</td>
<td><code>${esc(m.eventId)}</code></td><td class="mut">${esc(m.response)}</td></tr>`).join("");
  const consentNote = l.consent === "accepted" ? "Accepted cookies" :
    (l.consent === "rejected" ? "Declined cookies, so nothing about this lead is sent to Meta" : "Did not answer the cookie banner, so nothing is sent to Meta");

  return shell(l.firstName + " – Lead", `${navBar("list")}
<p><a href="/leads">← All leads</a></p>
<h1>${esc(l.firstName)} ${statusPill(l.status)}</h1>
${msg ? `<div class="msg">${esc(msg)}</div>` : ""}${err ? `<div class="msg err">${esc(err)}</div>` : ""}
<p class="journey">${esc(journeyLine(l))}</p>
<div class="grid">
<div class="card"><h2 style="margin-top:0">Contact</h2><dl>
<dt>Name</dt><dd>${esc(l.firstName)}</dd><dt>Email</dt><dd><a href="mailto:${esc(l.email)}">${esc(l.email)}</a></dd>
<dt>Phone</dt><dd><a href="tel:${esc(l.phone)}">${esc(l.phone)}</a></dd><dt>Landing page</dt><dd>/go/${esc(l.page)}/</dd>
<dt>Date</dt><dd>${esc(fmtDate(l.createdAt))}</dd><dt>Cookies</dt><dd>${esc(consentNote)}</dd><dt>Lead ID</dt><dd><code>${esc(l.id)}</code></dd></dl></div>
<div class="card"><h2 style="margin-top:0">Their answers</h2><dl>${answers || "<dd class='mut'>None</dd>"}</dl></div>
<div class="card"><h2 style="margin-top:0">Update</h2>
<form method="post"><input type="hidden" name="id" value="${esc(l.id)}"><input type="hidden" name="do" value="update">
<label for="status">Status</label><select id="status" name="status" style="width:100%;margin-bottom:10px">${STATUSES.map((s) => `<option${s === l.status ? " selected" : ""}>${s}</option>`).join("")}</select>
<label for="value">Booking value (£)</label><input id="value" name="value" inputmode="decimal" value="${esc(l.value)}" style="width:100%;margin-bottom:10px">
<label for="via">How did they book?</label><select id="via" name="via" style="width:100%;margin-bottom:10px">${Object.entries(BOOKED_VIA).map(([k, v]) => `<option value="${k}"${l.bookedVia === k ? " selected" : ""}>${esc(v.label)}</option>`).join("")}</select>
<label for="notes">Notes</label><textarea id="notes" name="notes">${esc(l.notes)}</textarea>
<p class="mut">Setting Booked or Completed with a value sends one Purchase event to Meta, once only. Not for online bookings, because the Dilvon form already tells Meta.</p>
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

function reportView(leads) {
  const groups = {};
  leads.forEach((l) => {
    const src = sourceOf(l.first);
    const camp = (l.first || {}).utm_campaign || "(no campaign)";
    const k = src + "||" + camp;
    const g = groups[k] || (groups[k] = { src, camp, leads: 0, contacted: 0, booked: 0, revenue: 0 });
    g.leads++;
    if (l.status !== "New") g.contacted++;
    if (BOOKED.includes(l.status)) { g.booked++; g.revenue += Number(l.value) || 0; }
  });
  const rows = Object.values(groups).sort((a, b) => b.revenue - a.revenue || b.leads - a.leads);
  const tot = rows.reduce((t, g) => ({ leads: t.leads + g.leads, booked: t.booked + g.booked, revenue: t.revenue + g.revenue }), { leads: 0, booked: 0, revenue: 0 });
  const body = rows.map((g) => `<tr><td>${esc(g.src)}</td><td>${esc(g.camp)}</td><td>${g.leads}</td><td>${g.contacted}</td><td>${g.booked}</td>
<td>${g.leads ? Math.round(g.booked / g.leads * 100) : 0}%</td><td>${money(g.revenue)}</td><td class="mut">Not connected</td></tr>`).join("");
  return shell("Report – Leads", `${navBar("report")}<h1>Campaign report</h1>
<p class="mut">Grouped by where each lead first came from. Ad spend shows once Meta's ads data is connected; until then it is left blank, not guessed.</p>
<div class="scroll"><table><thead><tr><th>Source</th><th>Campaign</th><th>Leads</th><th>Contacted</th><th>Booked</th><th>Booked %</th><th>Revenue</th><th>Ad spend</th></tr></thead>
<tbody>${body || `<tr><td colspan="8" class="mut">No leads yet.</td></tr>`}
${rows.length ? `<tr><td colspan="2"><strong>Total</strong></td><td><strong>${tot.leads}</strong></td><td></td><td><strong>${tot.booked}</strong></td><td></td><td><strong>${money(tot.revenue)}</strong></td><td></td></tr>` : ""}
</tbody></table></div>`);
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
<p class="mut">The booking link is followed by the service, e.g. <code>/domestic-cleaning</code>. Change it to your app.sncleaningservices.co.uk address once that is live.</p>
<button type="submit">Save pages</button></form>

<form method="post" class="card inline" style="margin-top:14px"><input type="hidden" name="do" value="addpage">
<div><label for="ns">Add a landing page address</label><input id="ns" name="slug" placeholder="deep-cleaning" pattern="[a-z0-9-]+" required></div>
<button type="submit" class="grey">Add page</button>
<p class="mut" style="flex-basis:100%;margin:0">This only adds the settings row. The page itself still has to be built at /go/that-name/.</p></form>`);
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
      if (p.get("password") === process.env.DASHBOARD_PASSWORD) return redirect("/leads", F.loginCookie());
      return html(loginPage("That password is not right."), { statusCode: 401 });
    }
    const st = F.stores(event);
    const act = p.get("do");

    if (act === "update" || act === "delete") {
      const id = p.get("id") || "";
      const lead = /^L[a-z0-9]+$/.test(id) ? await st.leads.get(id, { type: "json" }) : null;
      if (!lead) return redirect("/leads");
      if (act === "delete") { await st.leads.delete(id); return redirect("/leads?msg=deleted"); }

      const status = STATUSES.includes(p.get("status")) ? p.get("status") : lead.status;
      const valueRaw = (p.get("value") || "").replace(/[£,\s]/g, "");
      const via = BOOKED_VIA[p.get("via")] ? p.get("via") : "phone";
      if (valueRaw && !/^\d+(\.\d{1,2})?$/.test(valueRaw)) return redirect("/leads?id=" + id + "&err=value");
      if (BOOKED.includes(status) && !lead.purchaseSent && BOOKED_VIA[via].send && !valueRaw) {
        return redirect("/leads?id=" + id + "&err=needvalue");
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
        } else if (lead.consent !== "accepted") {
          note = "saved-noconsent";
        } else {
          const settings = await F.getSettings(st);
          const eventId = "purchase-" + lead.id; // fixed per lead: Meta drops any repeat
          const log = await F.sendToMeta(F.pixelForPage(settings, lead.page), lead, {
            name: "Purchase", id: eventId, actionSource: BOOKED_VIA[via].source,
            custom: { currency: "GBP", value: Number(valueRaw), content_name: lead.page }
          });
          lead.meta = lead.meta || [];
          lead.meta.push(log);
          if (log.ok) { lead.purchaseSent = true; note = "saved-sent"; } else { note = "saved-failed"; }
        }
      }
      await st.leads.setJSON(id, lead);
      return redirect("/leads?id=" + id + "&msg=" + note);
    }

    const s = await F.getSettings(st);
    if (act === "addpixel") {
      const pixelId = (p.get("pixelId") || "").replace(/\D/g, "");
      const tokenVal = (p.get("token") || "").trim();
      if (!pixelId || !tokenVal) return redirect("/leads?view=settings&err=pixel");
      s.pixels.push({ key: F.newId("P"), name: (p.get("name") || "Pixel").slice(0, 60), pixelId,
        token: tokenVal, testCode: (p.get("testCode") || "").trim().slice(0, 40) });
      await F.saveSettings(st, s);
      return redirect("/leads?view=settings&msg=pixel");
    }
    if (act === "delpixel") {
      const key = p.get("key");
      s.pixels = s.pixels.filter((x) => x.key !== key);
      Object.values(s.pages).forEach((pg) => { if (pg.pixel === key) pg.pixel = ""; });
      await F.saveSettings(st, s);
      return redirect("/leads?view=settings&msg=removed");
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
      return redirect("/leads?view=settings&msg=pages");
    }
    if (act === "addpage") {
      const slug = (p.get("slug") || "").toLowerCase().replace(/[^a-z0-9-]/g, "");
      if (slug && !s.pages[slug]) {
        s.pages[slug] = { pixel: "", bookingBase: "https://app.dilvon.com/book/sn-cleaning-services" };
        await F.saveSettings(st, s);
      }
      return redirect("/leads?view=settings&msg=pages");
    }
    return redirect("/leads");
  }

  if (!authed) return html(loginPage(""));
  const st = F.stores(event);

  const MSGS = {
    deleted: "Lead deleted.", saved: "Saved.", "saved-sent": "Saved. Purchase sent to Meta.",
    "saved-failed": "Saved, but Meta did not accept the Purchase. See Meta's reply below. Save again to retry.",
    "saved-noconsent": "Saved. Not sent to Meta because this person did not accept cookies.",
    "saved-dilvon": "Saved. Not sent to Meta, because the Dilvon booking form reports online bookings itself.",
    pixel: "Pixel added. Now choose it for a landing page below.", removed: "Pixel removed.", pages: "Landing pages saved."
  };
  const ERRS = {
    value: "The booking value must be a number, like 120 or 89.50.",
    needvalue: "Add the booking value (£) when marking as Booked, so Meta learns what the customer was worth.",
    pixel: "Pixel ID and access token are both needed."
  };

  if (q.view === "settings") return html(settingsView(await F.getSettings(st), MSGS[q.msg], ERRS[q.err]));
  const leads = await allLeads(st);
  if (q.view === "report") return html(reportView(leads));
  if (q.id) {
    const l = leads.find((x) => x.id === q.id);
    if (!l) return redirect("/leads");
    return html(detailView(l, MSGS[q.msg], ERRS[q.err]));
  }
  return html(listView(leads, q.q || "", q.status || "", MSGS[q.msg]));
};
