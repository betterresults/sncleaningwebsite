/**
 * Partner dashboard at /partner. A commission-only partner logs in with their
 * code and password and sees only their own numbers: clicks on their link,
 * leads (with the details each customer gave), bookings and commission.
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
.stat{background:#fff;border:1px solid var(--line);border-radius:14px;padding:14px 16px;margin-bottom:12px}.stat b{display:block;font-size:26px}.stat span{color:var(--mut);font-size:13px}
table{width:100%;border-collapse:collapse;background:#fff;border:1px solid var(--line);border-radius:12px;overflow:hidden}
th,td{text-align:left;padding:10px 12px;border-bottom:1px solid var(--line);font-size:14px}th{background:#f0f4f3;font-size:12px;text-transform:uppercase;color:var(--mut)}
.mut{color:var(--mut);font-size:13px}code{font-size:13px;background:#f0f4f3;padding:3px 6px;border-radius:6px;word-break:break-all}
input{font:inherit;padding:10px 12px;border:1px solid #cfd8d5;border-radius:8px;width:100%;margin-bottom:12px}label{display:block;font-size:13px;font-weight:600;margin-bottom:4px}
button{font:600 15px Inter,system-ui,sans-serif;padding:11px 18px;border:0;border-radius:8px;background:var(--g);color:#fff;cursor:pointer}
.bad{color:#a62626;font-weight:600}a{color:var(--g)}
.tabs{display:flex;gap:6px;flex-wrap:wrap;margin-bottom:18px}.tabs a{padding:8px 14px;border-radius:999px;background:#fff;border:1px solid var(--line);color:var(--ink);text-decoration:none;font-weight:600;font-size:14px}.tabs a.on{background:var(--g);color:#fff;border-color:var(--g)}.tabs .out{margin-left:auto;background:none;border:0;color:var(--mut)}
.btns{display:flex;gap:8px;flex-wrap:wrap;margin-top:10px}.btn{display:inline-block;font:600 14px Inter,system-ui,sans-serif;padding:9px 14px;border-radius:8px;background:var(--g);color:#fff;border:0;cursor:pointer;text-decoration:none}.btn.line{background:#fff;color:var(--g);box-shadow:inset 0 0 0 1.5px var(--g)}
.resgrid{display:grid;grid-template-columns:repeat(auto-fill,minmax(230px,1fr));gap:12px}.res{background:#fff;border:1px solid var(--line);border-radius:12px;padding:14px}.res img{width:100%;border-radius:8px;margin-bottom:8px;display:block}.res p{margin:4px 0 0}
.lede{color:var(--mut);margin:0 0 20px}details.ans{margin-top:4px}details.ans summary{cursor:pointer;color:var(--g);font-weight:600;font-size:13px}details.ans dl{margin:6px 0 0;padding:8px 10px;background:#f6f8f7;border-radius:8px;display:grid;grid-template-columns:max-content 1fr;gap:3px 12px;font-size:13px}details.ans dt{color:var(--mut)}details.ans dd{margin:0}
.res{padding:0;overflow:hidden;display:flex;flex-direction:column;transition:box-shadow .15s}.res:hover{box-shadow:0 6px 20px rgba(18,59,57,.08)}
.res .thumb{aspect-ratio:16/9;background:#e7f0ee;display:grid;place-items:center;color:var(--g);position:relative}.res .thumb img{width:100%;height:100%;object-fit:cover;margin:0;border-radius:0}
.res .thumb.t-landing{background:#e7f0ee;color:var(--g)}.res .thumb.t-booking{background:#e3f5ea;color:#17703c}.res .thumb.t-video{background:#1d2926;color:#fff}.res .thumb.t-document{background:#f1e8fd;color:#6a2fb8}.res .thumb.t-link{background:#e8f0fe;color:#1a56c4}
.res .body{padding:14px;display:flex;flex-direction:column;flex:1}.res .body .btns{margin-top:auto;padding-top:12px}
.badge{display:inline-block;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.05em;color:var(--mut);margin-bottom:4px}
.chips{display:flex;gap:6px;flex-wrap:wrap;margin:0 0 16px}.chips button{font:600 13px Inter,system-ui,sans-serif;padding:7px 12px;border-radius:999px;background:#fff;color:var(--ink);border:1px solid var(--line)}.chips button.on{background:var(--g);color:#fff;border-color:var(--g)}
.linkbox{display:flex;gap:10px;align-items:center;flex-wrap:wrap}.linkbox code{flex:1;min-width:200px;padding:9px 10px}
.vid{position:relative;aspect-ratio:16/9;margin-bottom:8px}.vid iframe{position:absolute;inset:0;width:100%;height:100%;border:0;border-radius:8px}.scroll{overflow-x:auto}
</style></head><body>${inner.startsWith("<!--SIDE-->") ? inner.slice(11) : `<div class="wrap">${inner}</div>`}</body></html>`;
}

function setPwPage(pr, token, msg) {
  return shell("Set your password – SN Cleaning Services", `<div class="card" style="max-width:380px;margin:60px auto">
<h1>Welcome, ${esc(pr.name)}</h1><p class="mut">Choose a password for your partner account. Your username is <strong>${esc(pr.code)}</strong>.</p>${msg ? `<p class="bad">${esc(msg)}</p>` : ""}
<form method="post" action="/partner"><input type="hidden" name="do" value="setpw"><input type="hidden" name="invite" value="${esc(token)}">
<input type="text" name="username" value="${esc(pr.code)}" autocomplete="username" hidden>
<label for="np">New password (at least 6 characters)</label><input id="np" type="password" name="password" autocomplete="new-password" minlength="6" required autofocus>
<label for="np2">Type it again</label><input id="np2" type="password" name="password2" autocomplete="new-password" minlength="6" required>
<button type="submit">Save and log in</button></form></div>`);
}

function loginPage(msg) {
  return shell("Partner login – SN Cleaning Services", `<div class="card" style="max-width:380px;margin:60px auto">
<h1>Partner login</h1><p class="mut">SN Cleaning Services</p>${msg ? `<p class="bad">${esc(msg)}</p>` : ""}
<form method="post"><label for="c">Username</label><input id="c" name="code" autocomplete="username" required autofocus>
<label for="pw">Password</label><input id="pw" type="password" name="password" autocomplete="current-password" required>
<button type="submit">Log in</button></form></div>`);
}

const P = require("./partners");

const UI = require("./admin-ui");
// Wrap partner pages in the same left-menu layout as the admin dashboard
function side(on, pr, inner) {
  const a = (href, label, key, icon) => `<a href="${href}" class="${on === key ? "on" : ""}">${UI.ICONS[icon]}<span>${label}</span></a>`;
  return `<!--SIDE--><style>${UI.CSS}</style><div class="adm"><aside class="adm-side"><a class="adm-brand" href="/partner"><b>SN</b><span>${esc(pr.name)}<small>Partner</small></span></a>
<nav class="adm-nav" aria-label="Partner menu">${a("/partner", "Dashboard", "dash", "home")}${a("/partner?view=resources", "Resources", "res", "resources")}</nav>
<div class="adm-foot"><a href="/partner?logout=1">${UI.ICONS.logout}<span>Log out</span></a></div></aside>
<main class="adm-main"><div class="adm-inner" style="max-width:980px">${inner}</div></main></div>`;
}

const COPY_JS = `<script>document.addEventListener("click",function(e){var b=e.target.closest("[data-copy]");if(!b)return;navigator.clipboard.writeText(b.getAttribute("data-copy")).then(function(){var t=b.textContent;b.textContent="Copied";setTimeout(function(){b.textContent=t},1500)});});</script>`;

function ytEmbed(url) {
  const m = String(url).match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/shorts\/)([\w-]{11})/);
  return m ? "https://www.youtube-nocookie.com/embed/" + m[1] : "";
}

const TYPE_ICON = { landing: "M3 4h18v16H3zM3 8h18M7 12h6M7 15h10", booking: "M4 5h16v15H4zM4 9h16M8 3v4M16 3v4M8 13h3M8 16h6", image: "M4 5h16v14H4zM4 16l5-5 4 4 2-2 5 5M15.5 9.5h.01", video: "M8 5v14l11-7z", document: "M6 3h8l4 4v14H6zM14 3v4h4M9 12h6M9 16h6", link: "M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1" };
const typeIcon = (t) => `<svg viewBox="0 0 24 24" width="38" height="38" fill="${t === "video" ? "currentColor" : "none"}" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${TYPE_ICON[t] || TYPE_ICON.link}"/></svg>`;

function resourcesPage(pr, settings) {
  const order = ["landing", "booking", "image", "video", "document", "link"];
  const list = P.allResources(settings).sort((a, b) => order.indexOf(a.type) - order.indexOf(b.type));
  const types = order.filter((t) => list.some((r) => r.type === t));
  const card = (r) => {
    const url = P.isTagged(r.type) ? P.tagUrl(r.url, pr.code) : r.url;
    const isImg = r.type === "image" && /\.(png|jpe?g|webp|gif)(\?|$)/i.test(r.url);
    const yt = r.type === "video" ? ytEmbed(r.url) : "";
    const thumb = yt ? `<div class="vid" style="margin:0"><iframe src="${esc(yt)}" title="${esc(r.title)}" allowfullscreen loading="lazy" style="border-radius:0"></iframe></div>`
      : `<div class="thumb t-${esc(r.type)}">${isImg ? `<img src="${esc(r.url)}" alt="${esc(r.title)}" loading="lazy">` : typeIcon(r.type)}</div>`;
    return `<div class="res" data-type="${esc(r.type)}">${thumb}<div class="body"><span class="badge">${esc(P.RESOURCE_TYPES[r.type] || r.type)}</span>
<strong>${esc(r.title)}</strong>${r.description ? `<p class="mut">${esc(r.description)}</p>` : ""}${P.isTagged(r.type) ? `<p class="mut">Includes your username, so ${r.type === "landing" ? "clicks, leads and bookings" : "bookings"} count for you.</p>` : ""}
<div class="btns"><a class="btn" href="${esc(url)}" target="_blank" rel="noopener">${r.type === "image" ? "View" : r.type === "video" ? "Watch" : "Open"}</a><button type="button" class="btn line" data-copy="${esc(url)}">Copy link</button></div></div></div>`;
  };
  const chips = types.length > 1 ? `<div class="chips" role="group" aria-label="Filter"><button type="button" class="on" data-f="">All</button>${types.map((t) => `<button type="button" data-f="${t}">${esc(P.RESOURCE_TYPES[t])}s</button>`).join("")}</div>` : "";
  const filterJs = `<script>document.addEventListener("click",function(e){var b=e.target.closest("[data-f]");if(!b)return;var f=b.getAttribute("data-f");document.querySelectorAll("[data-f]").forEach(function(x){x.classList.toggle("on",x===b)});document.querySelectorAll(".res").forEach(function(c){c.hidden=!!f&&c.getAttribute("data-type")!==f});});</script>`;
  return shell("Resources – Partner", side("res", pr, `<h1>Resources</h1><p class="lede">Pictures, videos and links to share with people you refer.</p>
${list.length ? chips + `<div class="resgrid">${list.map(card).join("")}</div>` : `<div class="card mut">Nothing here yet. Check back soon.</div>`}${COPY_JS}${filterJs}`));
}

exports.handler = async (event) => {
  const st = F.stores(event);
  const settings = await F.getSettings(st);
  const q = event.queryStringParameters || {};

  if (P.ensureDefaults(settings)) await F.saveSettings(st, settings);

  if (event.httpMethod === "POST") {
    const p = new URLSearchParams(event.body || "");
    if (p.get("do") === "setpw") {
      const token = p.get("invite") || "";
      const pr = token && settings.partners.find((x) => x.invite && x.invite === token);
      if (!pr) return html(loginPage("That link has already been used. Log in with your username and password."), { statusCode: 400 });
      const pw = p.get("password") || "";
      if (pw.length < 6) return html(setPwPage(pr, token, "The password needs at least 6 characters."), { statusCode: 400 });
      if (pw !== (p.get("password2") || "")) return html(setPwPage(pr, token, "The two passwords are not the same."), { statusCode: 400 });
      pr.salt = require("crypto").randomBytes(16).toString("hex"); pr.hash = F.hashPw(pw, pr.salt); delete pr.invite;
      await F.saveSettings(st, settings);
      return redirect("/partner", F.partnerCookie(pr.key));
    }
    const code = (p.get("code") || "").trim().toLowerCase();
    const pr = settings.partners.find((x) => x.code === code);
    if (pr && F.checkPw(p.get("password") || "", pr)) return redirect("/partner", F.partnerCookie(pr.key));
    return html(loginPage("That username or password is not right."), { statusCode: 401 });
  }
  if (q.invite) {
    const pr = settings.partners.find((x) => x.invite && x.invite === q.invite);
    return pr ? html(setPwPage(pr, q.invite, "")) : html(loginPage("That link has already been used. Log in with your username and password."));
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
  const tidy = (v) => String(v == null ? "" : v).replace(/_/g, " ").trim();
  const ans = (l) => { const e = Object.entries(l.answers || {}); return e.length ? `<details class="ans"><summary>Answers</summary><dl>${e.map(([k, v]) => `<dt>${esc(tidy(k))}</dt><dd>${esc(tidy(v))}</dd>`).join("")}</dl></details>` : ""; };
  const rows = list.map((l) => `<tr><td><strong>${esc([l.firstName, l.lastName].filter(Boolean).join(" ") || "–")}</strong>${ans(l)}</td>
<td>${l.phone ? `<a href="tel:${esc(l.phone)}">${esc(l.phone)}</a>` : "–"}<div class="mut">${esc(l.email || "")}</div></td><td>${esc(l.postcode || "–")}</td>
<td>${esc(fmtDate(l.createdAt))}</td><td>${esc(statusText(l.status))}</td>
<td>${P.BOOKED.includes(l.status) && s.rate ? money((Number(l.value) || 0) * s.rate / 100) : "–"}</td></tr>`).join("");
  const conv = s.clicks ? Math.round(s.leads / s.clicks * 100) + "%" : "–";

  return html(shell(pr.name + " – Partner dashboard", side("dash", pr, `<h1>Hi ${esc(pr.name)}</h1><p class="lede">Your referrals for SN Cleaning Services</p>
<div class="card"><label>Your link to share</label><div class="linkbox"><code>${esc(link)}</code><button type="button" class="btn" data-copy="${esc(link)}">Copy link</button></div></div>
<div class="stats">
<div class="stat"><b>${s.clicks}</b><span>Clicks on your link</span></div>
<div class="stat"><b>${s.leads}</b><span>Leads (${conv} of clicks)</span></div>
<div class="stat"><b>${s.booked}</b><span>Booked</span></div>
${s.rate ? `<div class="stat"><b>${money(s.commission)}</b><span>Commission earned (${esc(String(s.rate))}%)</span></div>` : ""}
</div>
<p class="mut">This month: ${m.clicks} clicks · ${m.leads} leads · ${m.booked} booked${s.rate ? " · " + money(m.commission) + " commission" : ""}</p>
<h2>Your leads</h2>
<div class="scroll"><table><thead><tr><th>Name</th><th>Phone / email</th><th>Postcode</th><th>Date</th><th>Status</th><th>Commission</th></tr></thead>
<tbody>${rows || `<tr><td colspan="6" class="mut">No leads yet. Share your link to get started.</td></tr>`}</tbody></table></div>
<p class="mut" style="margin-top:14px">Clicks are counted from 14 October 2026. A lead shows as Booked once their cleaning is booked.</p>${COPY_JS}`)));
};
