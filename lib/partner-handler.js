/**
 * Partner dashboard at /partner. A commission-only partner logs in with their
 * code and password and sees only their own numbers: clicks on their link,
 * leads, bookings and commission. Customers' contact details are never shown.
 */

const F = require("./funnel");
const esc = F.esc;

const BOOKED = ["Booked", "Completed"];
const html = (body, extra) => Object.assign({
  statusCode: 200, headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" }, body
}, extra || {});
const redirect = (to, cookie) => ({ statusCode: 302, headers: Object.assign({ location: to }, cookie ? { "set-cookie": cookie } : {}), body: "" });
const fmtDate = (iso) => iso ? new Date(iso).toLocaleDateString("en-GB", { timeZone: "Europe/London", day: "2-digit", month: "short", year: "numeric" }) : "";
const money = (n) => "£" + (Number(n) || 0).toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

function shell(title, inner) {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex">
<title>${esc(title)}</title><style>
:root{--g:#1f6b66;--ink:#1d2926;--mut:#5b6b67;--line:#e2e8e6;--bg:#f6f8f7}
*{box-sizing:border-box}body{margin:0;font:15px/1.5 Inter,system-ui,-apple-system,Segoe UI,sans-serif;color:var(--ink);background:var(--bg)}
.wrap{max-width:860px;margin:0 auto;padding:24px 16px 60px}h1{font-size:24px;margin:0 0 6px}h2{font-size:17px;margin:24px 0 10px}
.card{background:#fff;border:1px solid var(--line);border-radius:12px;padding:16px;margin-bottom:14px}
.stats{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:12px}
.stat{background:#fff;border:1px solid var(--line);border-radius:12px;padding:14px}.stat b{display:block;font-size:26px}.stat span{color:var(--mut);font-size:13px}
table{width:100%;border-collapse:collapse;background:#fff;border:1px solid var(--line);border-radius:12px;overflow:hidden}
th,td{text-align:left;padding:10px 12px;border-bottom:1px solid var(--line);font-size:14px}th{background:#f0f4f3;font-size:12px;text-transform:uppercase;color:var(--mut)}
.mut{color:var(--mut);font-size:13px}code{font-size:13px;background:#f0f4f3;padding:3px 6px;border-radius:6px;word-break:break-all}
input{font:inherit;padding:10px 12px;border:1px solid #cfd8d5;border-radius:8px;width:100%;margin-bottom:12px}label{display:block;font-size:13px;font-weight:600;margin-bottom:4px}
button{font:600 15px Inter,system-ui,sans-serif;padding:11px 18px;border:0;border-radius:8px;background:var(--g);color:#fff;cursor:pointer}
.bad{color:#a62626;font-weight:600}.top{display:flex;justify-content:space-between;align-items:center;gap:10px}a{color:var(--g)}
</style></head><body><div class="wrap">${inner}</div></body></html>`;
}

function loginPage(msg) {
  return shell("Partner login – SN Cleaning Services", `<div class="card" style="max-width:380px;margin:60px auto">
<h1>Partner login</h1><p class="mut">SN Cleaning Services</p>${msg ? `<p class="bad">${esc(msg)}</p>` : ""}
<form method="post"><label for="c">Your code</label><input id="c" name="code" autocomplete="username" required autofocus>
<label for="pw">Password</label><input id="pw" type="password" name="password" autocomplete="current-password" required>
<button type="submit">Log in</button></form></div>`);
}

async function allVisits(st) {
  const keys = [];
  let cursor;
  do { const pg = await st.visits.list(cursor ? { cursor } : {}); keys.push(...pg.blobs.map((b) => b.key)); cursor = pg.cursor; } while (cursor);
  return (await Promise.all(keys.map((k) => st.visits.get(k, { type: "json" })))).filter(Boolean);
}

exports.handler = async (event) => {
  const st = F.stores(event);
  const settings = await F.getSettings(st);
  const q = event.queryStringParameters || {};

  if (event.httpMethod === "POST") {
    const p = new URLSearchParams(event.body || "");
    const code = (p.get("code") || "").trim().toLowerCase();
    const pr = settings.partners.find((x) => x.code === code);
    if (pr && F.checkPw(p.get("password") || "", pr)) return redirect("/partner", F.partnerCookie(pr.key));
    return html(loginPage("That code or password is not right."), { statusCode: 401 });
  }
  if (q.logout) return redirect("/partner", "sn_partner=; Path=/partner; Max-Age=0; HttpOnly; Secure; SameSite=Lax");

  const key = F.partnerFromCookie(event);
  const pr = key && settings.partners.find((x) => x.key === key);
  if (!pr) return html(loginPage(""));

  const { blobs } = await st.leads.list();
  const leads = (await Promise.all(blobs.map((b) => st.leads.get(b.key, { type: "json" })))).filter(Boolean)
    .filter((l) => !l.partial && F.isPartnerTouch(l.first, pr.code))
    .sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""));
  const clicks = (await allVisits(st)).filter((v) => F.isPartnerTouch(v, pr.code)).length;
  const booked = leads.filter((l) => BOOKED.includes(l.status));
  const value = booked.reduce((t, l) => t + (Number(l.value) || 0), 0);
  const rate = Number(pr.commission) || 0;
  const link = "https://sncleaningservices.co.uk/go/domestic/?utm_source=partner&utm_campaign=" + encodeURIComponent(pr.code);
  const statusText = (s) => BOOKED.includes(s) ? "Booked" : (s === "Lost" ? "Not going ahead" : (s === "New" ? "New" : "In progress"));

  const rows = leads.map((l) => `<tr><td>${esc(fmtDate(l.createdAt))}</td><td>${esc(l.firstName || "")}</td><td>${esc(statusText(l.status))}</td>
<td>${BOOKED.includes(l.status) && rate ? money((Number(l.value) || 0) * rate / 100) : "–"}</td></tr>`).join("");

  return html(shell(pr.name + " – Partner dashboard", `<div class="top"><div><h1>Hi ${esc(pr.name)}</h1><p class="mut">Your referrals for SN Cleaning Services</p></div><a href="/partner?logout=1">Log out</a></div>
<div class="card"><label>Your link to share</label><code>${esc(link)}</code></div>
<div class="stats">
<div class="stat"><b>${clicks}</b><span>Clicks on your link</span></div>
<div class="stat"><b>${leads.length}</b><span>Leads</span></div>
<div class="stat"><b>${booked.length}</b><span>Booked</span></div>
${rate ? `<div class="stat"><b>${money(value * rate / 100)}</b><span>Commission earned (${esc(String(rate))}%)</span></div>` : ""}
</div>
<h2>Your leads</h2>
<table><thead><tr><th>Date</th><th>Name</th><th>Status</th><th>Commission</th></tr></thead>
<tbody>${rows || `<tr><td colspan="4" class="mut">No leads yet. Share your link to get started.</td></tr>`}</tbody></table>
<p class="mut" style="margin-top:14px">Clicks are counted from 14 October 2026. A lead shows as Booked once their cleaning is booked.</p>`));
};
