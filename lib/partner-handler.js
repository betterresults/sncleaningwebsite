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
.bad{color:#a62626;font-weight:600}a{color:var(--g)}
.tabs{display:flex;gap:6px;flex-wrap:wrap;margin-bottom:18px}.tabs a{padding:8px 14px;border-radius:999px;background:#fff;border:1px solid var(--line);color:var(--ink);text-decoration:none;font-weight:600;font-size:14px}.tabs a.on{background:var(--g);color:#fff;border-color:var(--g)}.tabs .out{margin-left:auto;background:none;border:0;color:var(--mut)}
.btns{display:flex;gap:8px;flex-wrap:wrap;margin-top:10px}.btn{display:inline-block;font:600 14px Inter,system-ui,sans-serif;padding:9px 14px;border-radius:8px;background:var(--g);color:#fff;border:0;cursor:pointer;text-decoration:none}.btn.line{background:#fff;color:var(--g);box-shadow:inset 0 0 0 1.5px var(--g)}
.resgrid{display:grid;grid-template-columns:repeat(auto-fill,minmax(230px,1fr));gap:12px}.res{background:#fff;border:1px solid var(--line);border-radius:12px;padding:14px}.res img{width:100%;border-radius:8px;margin-bottom:8px;display:block}.res p{margin:4px 0 0}
.vid{position:relative;aspect-ratio:16/9;margin-bottom:8px}.vid iframe{position:absolute;inset:0;width:100%;height:100%;border:0;border-radius:8px}.scroll{overflow-x:auto}
</style></head><body><div class="wrap">${inner}</div></body></html>`;
}

function loginPage(msg) {
  return shell("Partner login – SN Cleaning Services", `<div class="card" style="max-width:380px;margin:60px auto">
<h1>Partner login</h1><p class="mut">SN Cleaning Services</p>${msg ? `<p class="bad">${esc(msg)}</p>` : ""}
<form method="post"><label for="c">Your code</label><input id="c" name="code" autocomplete="username" required autofocus>
<label for="pw">Password</label><input id="pw" type="password" name="password" autocomplete="current-password" required>
<button type="submit">Log in</button></form></div>`);
}

const P = require("./partners");

function nav(on) {
  const a = (href, label, key) => `<a href="${href}" class="${on === key ? "on" : ""}">${label}</a>`;
  return `<nav class="tabs">${a("/partner", "Dashboard", "dash")}${a("/partner?view=resources", "Resources", "res")}<a href="/partner?logout=1" class="out">Log out</a></nav>`;
}

const COPY_JS = `<script>document.addEventListener("click",function(e){var b=e.target.closest("[data-copy]");if(!b)return;navigator.clipboard.writeText(b.getAttribute("data-copy")).then(function(){var t=b.textContent;b.textContent="Copied";setTimeout(function(){b.textContent=t},1500)});});</script>`;

function ytEmbed(url) {
  const m = String(url).match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/shorts\/)([\w-]{11})/);
  return m ? "https://www.youtube-nocookie.com/embed/" + m[1] : "";
}

function resourcesPage(pr, settings) {
  const groups = {};
  settings.resources.forEach((r) => { (groups[r.type] = groups[r.type] || []).push(r); });
  const order = ["booking", "image", "video", "document", "link"];
  const card = (r) => {
    const url = r.type === "booking" ? P.tagUrl(r.url, pr.code) : r.url;
    const isImg = r.type === "image" && /\.(png|jpe?g|webp|gif)(\?|$)/i.test(r.url);
    const yt = r.type === "video" ? ytEmbed(r.url) : "";
    return `<div class="res">${isImg ? `<img src="${esc(r.url)}" alt="${esc(r.title)}" loading="lazy">` : ""}${yt ? `<div class="vid"><iframe src="${esc(yt)}" title="${esc(r.title)}" allowfullscreen loading="lazy"></iframe></div>` : ""}
<strong>${esc(r.title)}</strong>${r.description ? `<p class="mut">${esc(r.description)}</p>` : ""}
<div class="btns"><a class="btn" href="${esc(url)}" target="_blank" rel="noopener">Open</a><button type="button" class="btn line" data-copy="${esc(url)}">Copy link</button></div></div>`;
  };
  const body = order.filter((t) => groups[t]).map((t) => `<h2>${esc(P.RESOURCE_TYPES[t])}${t === "booking" ? "s" : "s"}</h2>
${t === "booking" ? `<p class="mut">These links already include your code, so any booking made through them is credited to you.</p>` : ""}
<div class="resgrid">${groups[t].map(card).join("")}</div>`).join("");
  return shell("Resources – Partner", `${nav("res")}<h1>Resources</h1><p class="mut">Images, videos and links you can share.</p>
${body || `<p class="mut">Nothing here yet. Check back soon.</p>`}${COPY_JS}`);
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
  if (q.view === "resources") return html(resourcesPage(pr, settings));

  const [leads, visits] = await Promise.all([P.allLeads(st), P.allVisits(st)]);
  const s = P.statsFor(pr, leads, visits);
  const month = new Date().toISOString().slice(0, 7);
  const m = P.statsFor(pr, leads, visits, month + "-01", "");
  const link = P.partnerLink(pr.code);
  const statusText = (x) => P.BOOKED.includes(x) ? "Booked" : (x === "Lost" ? "Not going ahead" : (x === "New" ? "New" : "In progress"));
  const list = s.leadList.sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""));
  const rows = list.map((l) => `<tr><td>${esc(fmtDate(l.createdAt))}</td><td>${esc(l.firstName || "")}</td><td>${esc(statusText(l.status))}</td>
<td>${P.BOOKED.includes(l.status) && s.rate ? money((Number(l.value) || 0) * s.rate / 100) : "–"}</td></tr>`).join("");
  const conv = s.clicks ? Math.round(s.leads / s.clicks * 100) + "%" : "–";

  return html(shell(pr.name + " – Partner dashboard", `${nav("dash")}<h1>Hi ${esc(pr.name)}</h1><p class="mut">Your referrals for SN Cleaning Services</p>
<div class="card"><label>Your link to share</label><code>${esc(link)}</code><div class="btns"><button type="button" class="btn" data-copy="${esc(link)}">Copy link</button></div></div>
<div class="stats">
<div class="stat"><b>${s.clicks}</b><span>Clicks on your link</span></div>
<div class="stat"><b>${s.leads}</b><span>Leads (${conv} of clicks)</span></div>
<div class="stat"><b>${s.booked}</b><span>Booked</span></div>
${s.rate ? `<div class="stat"><b>${money(s.commission)}</b><span>Commission earned (${esc(String(s.rate))}%)</span></div>` : ""}
</div>
<p class="mut">This month: ${m.clicks} clicks · ${m.leads} leads · ${m.booked} booked${s.rate ? " · " + money(m.commission) + " commission" : ""}</p>
<h2>Your leads</h2>
<div class="scroll"><table><thead><tr><th>Date</th><th>Name</th><th>Status</th><th>Commission</th></tr></thead>
<tbody>${rows || `<tr><td colspan="4" class="mut">No leads yet. Share your link to get started.</td></tr>`}</tbody></table></div>
<p class="mut" style="margin-top:14px">Clicks are counted from 14 October 2026. A lead shows as Booked once their cleaning is booked.</p>${COPY_JS}`));
};
