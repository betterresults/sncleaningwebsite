/**
 * Password-protected applicant dashboard at /applicants
 *
 * Reads both Netlify forms server-side and shows every applicant with their
 * score, verdict and full answers. Nothing sensitive reaches the browser except
 * the page itself, and that is behind a password.
 *
 * Environment variables needed in Netlify:
 *   NETLIFY_API_TOKEN   - a personal access token (app.netlify.com/user/applications)
 *   DASHBOARD_PASSWORD  - whatever password you want to use
 */

const crypto = require("crypto");

const SOURCE_FORM = "cleaner-application";
const SCORED_FORM = "scored-application";
const COOKIE = "sn_applicants";

function token(pw) {
  return crypto.createHash("sha256").update("sn-applicants:" + pw).digest("hex");
}

function esc(v) {
  return String(v == null ? "" : v)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

async function api(path, key) {
  const res = await fetch("https://api.netlify.com/api/v1" + path, {
    headers: { authorization: "Bearer " + key }
  });
  if (!res.ok) throw new Error(path + " returned " + res.status);
  return res.json();
}

const QUESTIONS = [
  ["q1-enjoy", "What do you enjoy most about cleaning?"],
  ["q2-unhappy-customer", "A customer wasn't happy. What did you do?"],
  ["q3-wrong-method", "Client asks for a method you think is wrong"],
  ["q4-learned", "Something learned in the last year"],
  ["q5-job-finished", "How do you know a job is finished?"],
  ["q6-usual-arrival", "Usual arrival time"],
  ["q6b-arrival-notes", "Arrival notes"],
  ["q7-running-late", "Running 30 minutes late"],
  ["q8-least-confident", "Least confident with"],
  ["q9-would-leave", "What would make you leave"],
  ["q10-training-reaction", "Being trained a different way"],
  ["q11-products-used", "What they actually use"]
];

const DAYS = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];

function shell(title, inner) {
  return `<!DOCTYPE html><html lang="en-GB"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex,nofollow">
<title>${title}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Archivo:wght@500;600;700&family=Public+Sans:wght@400;500;600&display=swap">
<style>
:root{--ground:#F5F4EF;--surface:#fff;--surface-2:#EFEEE7;--ink:#16242B;--ink-soft:#55676E;--ink-faint:#839499;--line:#DDDCD3;--line-strong:#C3C2B7;--petrol:#0E4F5C;--petrol-soft:#E2EDEE;--marigold:#D9930B;--marigold-soft:#FBF0DA;--good:#1E7A4B;--good-soft:#E3F2E9;--bad:#A33A2A;--bad-soft:#F8E6E2;color-scheme:light}
@media(prefers-color-scheme:dark){:root:not([data-theme=light]){--ground:#121A1D;--surface:#1A2429;--surface-2:#202C32;--ink:#EAEDEB;--ink-soft:#A2B2B7;--ink-faint:#7A8A8F;--line:#2C3A40;--line-strong:#43555C;--petrol:#6FC4D0;--petrol-soft:#16333A;--marigold:#F0B54A;--marigold-soft:#33280F;--good:#6FD39B;--good-soft:#17331F;--bad:#F09A88;--bad-soft:#35201C;color-scheme:dark}}
*{box-sizing:border-box}
body{background:var(--ground);color:var(--ink);font-family:"Public Sans",system-ui,sans-serif;margin:0;font-size:16px;line-height:1.55}
.wrap{max-width:900px;margin:0 auto;padding:28px 18px 64px}
h1{font-family:Archivo,sans-serif;font-size:clamp(26px,5vw,34px);letter-spacing:-.02em;margin:0 0 4px}
.sub{color:var(--ink-soft);margin:0 0 24px;font-size:15px}
.card{background:var(--surface);border:1px solid var(--line);border-radius:4px;padding:18px 18px 16px;margin-bottom:14px}
.top{display:flex;justify-content:space-between;align-items:flex-start;gap:14px;flex-wrap:wrap}
.who{font-family:Archivo,sans-serif;font-size:19px;font-weight:700;margin:0 0 2px;letter-spacing:-.01em}
.meta{font-size:14px;color:var(--ink-soft)}
.meta a{color:var(--petrol)}
.badge{font-family:Archivo,sans-serif;font-size:13px;font-weight:700;padding:5px 11px;border-radius:2px;white-space:nowrap;letter-spacing:.01em}
.b-trial{background:var(--good-soft);color:var(--good)}
.b-phone{background:var(--marigold-soft);color:var(--marigold)}
.b-no{background:var(--bad-soft);color:var(--bad)}
.b-none{background:var(--surface-2);color:var(--ink-faint)}
.score{font-family:Archivo,sans-serif;font-variant-numeric:tabular-nums;font-size:22px;font-weight:700;color:var(--petrol);margin-left:10px}
.summary{margin:12px 0 0;padding:11px 13px;background:var(--petrol-soft);border-radius:3px;font-size:15px}
.flags{margin:8px 0 0;padding:11px 13px;background:var(--marigold-soft);border-left:3px solid var(--marigold);border-radius:0 3px 3px 0;font-size:14.5px}
.facts{display:flex;flex-wrap:wrap;gap:6px;margin:12px 0 0}
.chip{font-size:13px;background:var(--surface-2);border:1px solid var(--line);border-radius:2px;padding:4px 9px;color:var(--ink-soft)}
.chip strong{color:var(--ink);font-weight:600}
details{margin:12px 0 0;border-top:1px solid var(--line);padding-top:10px}
summary{cursor:pointer;font-size:14px;color:var(--petrol);font-weight:600;list-style:none}
summary::-webkit-details-marker{display:none}
summary::before{content:"▸ ";}
details[open] summary::before{content:"▾ ";}
.qa{margin:12px 0 0}
.q{font-size:13.5px;color:var(--ink-faint);margin:10px 0 2px;text-transform:uppercase;letter-spacing:.06em;font-weight:600}
.a{font-size:15px;white-space:pre-wrap;margin:0}
.honesty{font-size:13px;color:var(--ink-faint);margin-top:12px;border-top:1px solid var(--line);padding-top:9px}
.empty{background:var(--surface);border:1px dashed var(--line-strong);border-radius:4px;padding:40px 20px;text-align:center;color:var(--ink-soft)}
form.login{max-width:340px;margin:12vh auto;background:var(--surface);border:1px solid var(--line);border-radius:4px;padding:26px 24px}
label{display:block;font-weight:600;margin-bottom:8px;font-size:15px}
input[type=password]{width:100%;font:inherit;font-size:16px;padding:11px 12px;border:1px solid var(--line-strong);border-radius:2px;background:var(--surface-2);color:var(--ink)}
button{width:100%;margin-top:12px;font-family:Archivo,sans-serif;font-size:16px;font-weight:600;padding:13px;border:0;border-radius:2px;background:var(--petrol);color:var(--ground);cursor:pointer}
@media(prefers-color-scheme:dark){button{color:#0C1417}}
.err{color:var(--bad);font-size:14px;margin:10px 0 0}
.warn{background:var(--bad-soft);color:var(--bad);border-radius:3px;padding:12px 14px;margin:0 0 18px;font-size:15px}
</style></head><body><div class="wrap">${inner}</div></body></html>`;
}

function loginPage(msg) {
  return shell("Applicants", `<form class="login" method="POST">
    <label for="pw">Password</label>
    <input type="password" id="pw" name="password" autofocus autocomplete="current-password">
    <button type="submit">Open</button>
    ${msg ? `<p class="err">${esc(msg)}</p>` : ""}
  </form>`);
}

function verdictClass(v) {
  const s = (v || "").toLowerCase();
  if (s.includes("trial")) return "b-trial";
  if (s.includes("phone")) return "b-phone";
  if (s.includes("not interview") || s.includes("do not")) return "b-no";
  return "b-none";
}

function card(app, scored) {
  const d = app.data || {};
  const s = (scored && scored.data) || {};
  const days = DAYS
    .map((day) => d["availability-" + day])
    .filter(Boolean)
    .map((v) => `<span class="chip">${esc(v)}</span>`).join("");
  const areas = Array.isArray(d.areas) ? d.areas.join(", ") : (d.areas || "");
  const when = new Date(app.created_at).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" });

  const facts = [
    ["Experience", d["experience-level"]],
    ["Wants", d["work-type"]],
    ["Pay", d["pay-ok"]],
    ["Ambition", d.growth],
    ["Travel", d.transport || d.drives],
    ["DBS", d.dbs],
    ["Right to work", d["right-to-work"]]
  ].filter((f) => f[1]).map((f) => `<span class="chip">${esc(f[0])}: <strong>${esc(f[1])}</strong></span>`).join("");

  const qa = QUESTIONS.filter(([k]) => d[k]).map(
    ([k, label]) => `<p class="q">${esc(label)}</p><p class="a">${esc(d[k])}</p>`
  ).join("");

  return `<div class="card">
    <div class="top">
      <div>
        <p class="who">${esc(d.name || "Unnamed")}</p>
        <p class="meta">${esc(d["based-in"] || "")}${d.phone ? ` &middot; <a href="tel:${esc(d.phone)}">${esc(d.phone)}</a>` : ""} &middot; ${esc(when)}</p>
      </div>
      <div style="display:flex;align-items:center">
        <span class="badge ${verdictClass(s.verdict)}">${esc(s.verdict || "Not scored yet")}</span>
        ${s.score ? `<span class="score">${esc(s.score)}</span>` : ""}
      </div>
    </div>
    ${s.summary ? `<p class="summary">${esc(s.summary)}</p>` : ""}
    ${s.flags && s.flags !== "None" ? `<p class="flags"><strong>Ask about:</strong> ${esc(s.flags)}</p>` : ""}
    <div class="facts">${facts}${areas ? `<span class="chip">Covers: <strong>${esc(areas)}</strong></span>` : ""}</div>
    ${days ? `<div class="facts">${days}</div>` : ""}
    ${qa ? `<details><summary>Read their answers</summary><div class="qa">${qa}</div></details>` : ""}
    <p class="honesty">${esc([d["time-taken"], d["typed-or-pasted"], d["left-the-page"]].filter(Boolean).join("  |  "))}</p>
  </div>`;
}

exports.handler = async (event) => {
  const pw = process.env.DASHBOARD_PASSWORD;
  const key = process.env.NETLIFY_API_TOKEN;

  if (!pw) return { statusCode: 200, headers: { "content-type": "text/html" },
    body: shell("Applicants", `<p class="warn">DASHBOARD_PASSWORD is not set in Netlify, so this page cannot be protected. Add it in Site configuration &rarr; Environment variables.</p>`) };

  const cookies = event.headers.cookie || "";
  let authed = cookies.split(";").some((c) => c.trim() === COOKIE + "=" + token(pw));

  if (event.httpMethod === "POST") {
    const params = new URLSearchParams(event.body || "");
    if (params.get("password") === pw) {
      return { statusCode: 302, headers: {
        "set-cookie": COOKIE + "=" + token(pw) + "; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=604800",
        location: "/applicants"
      }, body: "" };
    }
    return { statusCode: 401, headers: { "content-type": "text/html" }, body: loginPage("That password is not right.") };
  }

  if (!authed) return { statusCode: 200, headers: { "content-type": "text/html" }, body: loginPage("") };

  if (!key) return { statusCode: 200, headers: { "content-type": "text/html" },
    body: shell("Applicants", `<h1>Applicants</h1><p class="warn">NETLIFY_API_TOKEN is not set, so I cannot read the submissions. Create one at app.netlify.com/user/applications and add it in Site configuration &rarr; Environment variables.</p>`) };

  try {
    const siteId = process.env.SITE_ID;
    const forms = await api("/sites/" + siteId + "/forms", key);
    const src = forms.find((f) => f.name === SOURCE_FORM);
    const sc = forms.find((f) => f.name === SCORED_FORM);

    const [apps, scores] = await Promise.all([
      src ? api("/forms/" + src.id + "/submissions?per_page=200", key) : [],
      sc ? api("/forms/" + sc.id + "/submissions?per_page=200", key) : []
    ]);

    const byName = {};
    scores.forEach((s) => {
      const n = ((s.data || {}).applicant || "").trim().toLowerCase();
      if (!n) return;
      if (!byName[n] || new Date(s.created_at) > new Date(byName[n].created_at)) byName[n] = s;
    });

    const list = apps
      .filter((a) => !/^zz /i.test(((a.data || {}).name || "")))
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    const body = list.length
      ? list.map((a) => card(a, byName[(((a.data || {}).name) || "").trim().toLowerCase()])).join("")
      : `<div class="empty">No applications yet. They will appear here the moment someone submits the form.</div>`;

    return { statusCode: 200, headers: { "content-type": "text/html", "cache-control": "no-store" },
      body: shell("Applicants", `<h1>Applicants</h1><p class="sub">${list.length} application${list.length === 1 ? "" : "s"}, newest first. Test rows are hidden.</p>${body}`) };
  } catch (err) {
    return { statusCode: 200, headers: { "content-type": "text/html" },
      body: shell("Applicants", `<h1>Applicants</h1><p class="warn">Could not load submissions: ${esc(String(err))}</p>`) };
  }
};
