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

function shell(title, inner, refresh) {
  return `<!DOCTYPE html><html lang="en-GB"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex,nofollow">
${refresh ? '<meta http-equiv="refresh" content="45">' : ""}
<title>${title}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Archivo:wght@500;600;700&family=Public+Sans:wght@400;500;600&display=swap">
<style>
:root{--ground:#F5F4EF;--surface:#fff;--surface-2:#EFEEE7;--ink:#16242B;--ink-soft:#55676E;--ink-faint:#839499;--line:#DDDCD3;--line-strong:#C3C2B7;--petrol:#0E4F5C;--petrol-soft:#E2EDEE;--marigold:#D9930B;--marigold-soft:#FBF0DA;--good:#1E7A4B;--good-soft:#E3F2E9;--bad:#A33A2A;--bad-soft:#F8E6E2;color-scheme:light}
@media(prefers-color-scheme:dark){:root:not([data-theme=light]){--ground:#121A1D;--surface:#1A2429;--surface-2:#202C32;--ink:#EAEDEB;--ink-soft:#A2B2B7;--ink-faint:#7A8A8F;--line:#2C3A40;--line-strong:#43555C;--petrol:#6FC4D0;--petrol-soft:#16333A;--marigold:#F0B54A;--marigold-soft:#33280F;--good:#6FD39B;--good-soft:#17331F;--bad:#F09A88;--bad-soft:#35201C;color-scheme:dark}}
*{box-sizing:border-box}
body{background:var(--ground);color:var(--ink);font-family:"Public Sans",system-ui,sans-serif;margin:0;font-size:16px;line-height:1.55}
.wrap{max-width:1680px;margin:0 auto;padding:26px 20px 64px}
h1{font-family:Archivo,sans-serif;font-size:clamp(26px,5vw,34px);letter-spacing:-.02em;margin:0 0 4px}
.sub{color:var(--ink-soft);margin:0 0 24px;font-size:15px}
.warn{background:var(--bad-soft);color:var(--bad);border-radius:3px;padding:12px 14px;margin:0 0 18px;font-size:15px}
.scroll{overflow-x:auto;border:1px solid var(--line);border-radius:4px;background:var(--surface)}
table{border-collapse:collapse;width:100%;min-width:1150px;font-size:14.5px}
thead th{position:sticky;top:0;background:var(--surface-2);text-align:left;font-family:Archivo,sans-serif;font-size:12px;letter-spacing:.07em;text-transform:uppercase;color:var(--ink-soft);padding:11px 10px;border-bottom:1px solid var(--line-strong);white-space:nowrap}
tbody td{padding:11px 10px;border-bottom:1px solid var(--line);vertical-align:top}
tr.row{cursor:pointer}
tr.row:hover td{background:var(--surface-2)}
.nm{font-weight:600;font-size:15px;display:block}
.dt{color:var(--ink-faint);font-size:12.5px}
td a{color:var(--petrol);text-decoration:none;white-space:nowrap}
.days{display:flex;flex-wrap:wrap;gap:4px;max-width:230px}
.d{font-size:12px;background:var(--petrol-soft);color:var(--petrol);border-radius:2px;padding:2px 6px;white-space:nowrap}
.ar{max-width:210px;color:var(--ink-soft);font-size:13.5px}
.tick{font-size:17px;font-weight:700}
.yes{color:var(--good)}.no{color:var(--bad)}
.act{white-space:nowrap}
.mini{width:auto;margin:0;font-size:12px;font-weight:600;padding:6px 10px;background:transparent;color:var(--petrol);border:1px solid var(--line-strong);border-radius:2px;cursor:pointer}
.mini:hover{background:var(--petrol-soft)}
.mini.danger{color:var(--bad);margin-top:6px}
.mini.danger:hover{background:var(--bad-soft)}
.mini.armed{background:var(--bad);color:#fff;border-color:var(--bad)}
.act form{margin:0}
.bar{display:flex;gap:10px;align-items:center;margin:0 0 16px;flex-wrap:wrap}
.bar form{margin:0}
.bar button{width:auto;margin:0;font-size:14px;padding:9px 14px}
.ok{background:var(--good-soft);color:var(--good);padding:10px 13px;border-radius:3px;margin:0 0 16px;font-size:14.5px}
.gen{font-family:Archivo,sans-serif;font-weight:700;font-size:15px;color:var(--petrol);text-align:center}
.fit{min-width:280px;max-width:320px}
.note{font-size:12.5px;line-height:1.45;color:var(--ink-soft);margin:7px 0 0;display:-webkit-box;-webkit-line-clamp:4;-webkit-box-orient:vertical;overflow:hidden}
.note.ask{color:var(--marigold);-webkit-line-clamp:2}
.sc{font-family:Archivo,sans-serif;font-variant-numeric:tabular-nums;font-weight:700;font-size:17px;color:var(--petrol);white-space:nowrap}
.badge{display:inline-block;font-family:Archivo,sans-serif;font-size:12px;font-weight:700;padding:4px 9px;border-radius:2px;white-space:nowrap}
.b-trial{background:var(--good-soft);color:var(--good)}
.b-phone{background:var(--marigold-soft);color:var(--marigold)}
.b-no{background:var(--bad-soft);color:var(--bad)}
.b-none{background:var(--surface-2);color:var(--ink-faint)}
tr.detail{display:none}
tr.detail.open{display:table-row}
tr.detail td{background:var(--surface-2);padding:18px 16px}
.facts{display:flex;flex-wrap:wrap;gap:6px;margin:0 0 14px}
.chip{font-size:13px;background:var(--surface);border:1px solid var(--line);border-radius:2px;padding:4px 9px;color:var(--ink-soft)}
.chip strong{color:var(--ink);font-weight:600}
.summary{margin:0 0 10px;padding:11px 13px;background:var(--petrol-soft);border-radius:3px;font-size:14.5px}
.flags{margin:0 0 12px;padding:11px 13px;background:var(--marigold-soft);border-left:3px solid var(--marigold);border-radius:0 3px 3px 0;font-size:14px}
.q{font-size:12.5px;color:var(--ink-faint);margin:12px 0 2px;text-transform:uppercase;letter-spacing:.06em;font-weight:600}
.a{font-size:14.5px;white-space:pre-wrap;margin:0}
.honesty{font-size:12.5px;color:var(--ink-faint);margin-top:14px;border-top:1px solid var(--line);padding-top:9px}
.empty{background:var(--surface);border:1px dashed var(--line-strong);border-radius:4px;padding:40px 20px;text-align:center;color:var(--ink-soft)}
.hint{font-size:13px;color:var(--ink-faint);margin:10px 0 0}
form.login{max-width:340px;margin:12vh auto;background:var(--surface);border:1px solid var(--line);border-radius:4px;padding:26px 24px}
label{display:block;font-weight:600;margin-bottom:8px;font-size:15px}
input[type=password]{width:100%;font:inherit;font-size:16px;padding:11px 12px;border:1px solid var(--line-strong);border-radius:2px;background:var(--surface-2);color:var(--ink)}
button{width:100%;margin-top:12px;font-family:Archivo,sans-serif;font-size:16px;font-weight:600;padding:13px;border:0;border-radius:2px;background:var(--petrol);color:var(--ground);cursor:pointer}
@media(prefers-color-scheme:dark){button{color:#0C1417}}
.err{color:var(--bad);font-size:14px;margin:10px 0 0}
</style></head><body><div class="wrap">${inner}</div>
<script>
document.addEventListener("click",function(e){
  var del=e.target.closest("button[data-confirm]");
  if(del){
    if(del.getAttribute("data-armed")!=="1"){
      e.preventDefault();
      del.setAttribute("data-armed","1");
      del.classList.add("armed");
      del.textContent="Delete for good?";
      setTimeout(function(){del.removeAttribute("data-armed");del.classList.remove("armed");del.textContent="Delete";},4000);
      return;
    }
  }
  var row=e.target.closest("tr.row");
  if(!row)return;
  if(e.target.closest("a")||e.target.closest("form")||e.target.closest("button"))return;
  var d=document.getElementById(row.getAttribute("data-for"));
  if(d)d.classList.toggle("open");
});
</script>
</body></html>`;
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
  if (s.includes("do not")) return "b-no";
  return "b-none";
}

const SHORT = { monday: "Mon", tuesday: "Tue", wednesday: "Wed", thursday: "Thu", friday: "Fri", saturday: "Sat", sunday: "Sun" };

function rows(app, scored, i) {
  const d = app.data || {};
  const s = (scored && scored.data) || {};

  const delivery = (s.summary || "");
  const sent = delivery.startsWith("Routine fired OK");
  const statusV = (s.verdict || "");
  const isRealVerdict = /trial|phone|do not/i.test(statusV);

  const days = Object.keys(SHORT)
    .map((k) => [SHORT[k], d["availability-" + k]])
    .filter((p) => p[1])
    .map((p) => `<span class="d">${esc(p[0])} ${esc(String(p[1]).split(":").pop().trim())}</span>`)
    .join("");

  const areas = Array.isArray(d.areas) ? d.areas.join(", ") : (d.areas || "");
  const when = new Date(app.created_at).toLocaleString("en-GB", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });

  const facts = [
    ["Experience", d["experience-level"]],
    ["Wants", d["work-type"]],
    ["Pay", d["pay-ok"]],
    ["Ambition", d.growth],
    ["Travel", d.transport || d.drives],
    ["DBS", d.dbs],
    ["Right to work", d["right-to-work"]],
    ["Other areas", d["areas-other"]]
  ].filter((f) => f[1]).map((f) => `<span class="chip">${esc(f[0])}: <strong>${esc(f[1])}</strong></span>`).join("");

  const qa = QUESTIONS.filter(([k]) => d[k]).map(
    ([k, label]) => `<p class="q">${esc(label)}</p><p class="a">${esc(d[k])}</p>`
  ).join("");

  const id = "d" + i;

  return `<tr class="row" data-for="${id}">
    <td><span class="nm">${esc(d.name || "Unnamed")}</span><span class="dt">${esc(when)}</span></td>
    <td class="gen">${esc(d.gender === "Female" ? "F" : d.gender === "Male" ? "M" : d.gender ? "\u2013" : "")}</td>
    <td>${d.phone ? `<a href="tel:${esc(String(d.phone).replace(/\s/g, ""))}">${esc(d.phone)}</a>` : ""}</td>
    <td>${esc(d["based-in"] || "")}</td>
    <td><div class="days">${days || '<span class="dt">none given</span>'}</div></td>
    <td class="ar">${esc(areas)}</td>
    <td class="tick ${sent ? "yes" : "no"}">${sent ? "&#10003;" : "&#10007;"}</td>
    <td class="sc">${esc(s.score || "")}</td>
    <td class="act"><form method="POST"><input type="hidden" name="resend" value="${esc(app.id)}"><button class="mini" type="submit">Re-run</button></form>
      <form method="POST" class="del"><input type="hidden" name="delete" value="${esc(app.id)}"><input type="hidden" name="who" value="${esc(d.name || "")}"><button class="mini danger" type="submit" data-confirm="1">Delete</button></form></td>
    <td class="fit">${isRealVerdict ? `<span class="badge ${verdictClass(statusV)}">${esc(statusV)}</span>` : `<span class="badge b-none">Not scored</span>`}${s.summary && isRealVerdict ? `<p class="note">${esc(s.summary)}</p>` : ""}${s.flags && s.flags !== "None" && isRealVerdict ? `<p class="note ask"><strong>Ask:</strong> ${esc(s.flags)}</p>` : ""}</td>
  </tr>
  <tr class="detail" id="${id}"><td colspan="10">
    ${s.summary && isRealVerdict ? `<p class="summary">${esc(s.summary)}</p>` : ""}
    ${s.flags && s.flags !== "None" ? `<p class="flags"><strong>Ask about:</strong> ${esc(s.flags)}</p>` : ""}
    <div class="facts">${facts}</div>
    ${qa}
    <p class="honesty">${esc([d["time-taken"], d["typed-or-pasted"], d["left-the-page"]].filter(Boolean).join("  |  "))}${sent ? "" : "  |  Delivery: " + esc(delivery || "not sent to the routine")}</p>
  </td></tr>`;
}


const ROUTINE_URL =
  process.env.CLAUDE_ROUTINE_URL ||
  "https://api.anthropic.com/v1/claude_code/routines/trig_01J9HNhNVxmx8homMMU2EjfJ/fire";
const SKIP = ["ip", "user_agent", "referrer", "bot-field"];

async function apiDelete(path, key) {
  const res = await fetch("https://api.netlify.com/api/v1" + path, {
    method: "DELETE",
    headers: { authorization: "Bearer " + key }
  });
  return res.ok;
}

async function fireRoutine(sub) {
  const d = sub.data || {};
  const tok = process.env.CLAUDE_ROUTINE_TOKEN || process.env.ANTHROPIC_API_KEY;
  if (!tok) return "No token set in Netlify.";

  const answers = Object.keys(d).filter((k) => !SKIP.includes(k))
    .map((k) => k + ": " + (Array.isArray(d[k]) ? d[k].join(", ") : d[k])).join("\n");

  const message = "A cleaner application is being re-sent for scoring. " +
    "Rate this applicant against the scoring rules and save the result.\n\n" +
    "Submitted: " + (sub.created_at || "") + "\nNetlify submission id: " + (sub.id || "") + "\n\n" + answers;

  let outcome;
  try {
    const res = await fetch(ROUTINE_URL, {
      method: "POST",
      headers: Object.assign(
        { "content-type": "application/json", "anthropic-version": "2023-06-01" },
        tok.startsWith("sk-ant-oat")
          ? { "authorization": "Bearer " + tok, "anthropic-beta": "oauth-2025-04-20" }
          : { "x-api-key": tok }
      ),
      body: JSON.stringify({ text: message })
    });
    const t = await res.text();
    outcome = res.ok ? "Routine fired OK (" + res.status + "). " + t.slice(0, 200)
                     : "Routine call failed with " + res.status + ". " + t.slice(0, 400);
  } catch (err) {
    outcome = "Routine call threw: " + String(err).slice(0, 300);
  }

  const site = process.env.URL || "https://sncleaningwebsite.netlify.app";
  try {
    await fetch(site + "/", {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        "form-name": SCORED_FORM,
        applicant: d.name || "Unknown",
        phone: d.phone || "",
        "based-in": d["based-in"] || "",
        score: "", verdict: outcome.startsWith("Routine fired OK") ? "Sent to routine" : "Not sent",
        summary: outcome, flags: "",
        honesty: [d["time-taken"], d["typed-or-pasted"], d["left-the-page"]].filter(Boolean).join(" | ")
      }).toString()
    });
  } catch (err) { /* logged below */ }
  return outcome;
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

    if (authed && params.get("delete")) {
      const key2 = process.env.NETLIFY_API_TOKEN;
      const id = params.get("delete");
      const who = (params.get("who") || "").trim().toLowerCase();
      try {
        await apiDelete("/submissions/" + id, key2);
        // remove any score rows for the same person so nothing is left orphaned
        if (who) {
          const forms = await api("/sites/" + process.env.SITE_ID + "/forms", key2);
          const sc = forms.find((f) => f.name === SCORED_FORM);
          if (sc) {
            const scores = await api("/forms/" + sc.id + "/submissions?per_page=200", key2);
            for (const s of scores) {
              if (((s.data || {}).applicant || "").trim().toLowerCase() === who) {
                await apiDelete("/submissions/" + s.id, key2);
              }
            }
          }
        }
      } catch (err) {
        console.error("Delete failed", err);
      }
      return { statusCode: 302, headers: { location: "/applicants?deleted=1" }, body: "" };
    }

    if (authed && (params.get("resend") || params.get("resend-all"))) {
      const key2 = process.env.NETLIFY_API_TOKEN;
      try {
        const forms = await api("/sites/" + process.env.SITE_ID + "/forms", key2);
        const src = forms.find((f) => f.name === SOURCE_FORM);
        const sc = forms.find((f) => f.name === SCORED_FORM);
        const [apps, scores] = await Promise.all([
          api("/forms/" + src.id + "/submissions?per_page=200", key2),
          sc ? api("/forms/" + sc.id + "/submissions?per_page=200", key2) : []
        ]);

        let targets;
        if (params.get("resend")) {
          targets = apps.filter((a) => a.id === params.get("resend"));
        } else {
          const scoredNames = new Set(scores
            .filter((s) => /trial|phone|do not/i.test((s.data || {}).verdict || ""))
            .map((s) => ((s.data || {}).applicant || "").trim().toLowerCase()));
          targets = apps
            .filter((a) => !/^zz |test application|pipeline test/i.test(((a.data || {}).name || "")))
            .filter((a) => !scoredNames.has((((a.data || {}).name) || "").trim().toLowerCase()))
            .slice(0, 10);
        }
        for (const t of targets) await fireRoutine(t);
      } catch (err) {
        console.error("Re-send failed", err);
      }
      return { statusCode: 302, headers: { location: "/applicants?sent=1" }, body: "" };
    }

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
      .filter((a) => !/^zz |test application|pipeline test/i.test(((a.data || {}).name || "")))
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    const body = list.length
      ? `<div class="scroll"><table>
          <thead><tr>
            <th>Name</th><th>F/M</th><th>Phone</th><th>Postcode / town</th><th>Days available</th>
            <th>Areas covered</th><th>Sent</th><th>Score</th><th></th><th>Fit &amp; notes</th>
          </tr></thead>
          <tbody>${list.map((a, i) => rows(a, byName[(((a.data || {}).name) || "").trim().toLowerCase()], i)).join("")}</tbody>
        </table></div>
        <p class="hint">Click any row to open that person's full answers. This page refreshes itself every 45 seconds. &#10003; means their application reached the scoring routine.</p>`
      : `<div class="empty">No applications yet. They will appear here the moment someone submits the form.</div>`;

    return { statusCode: 200, headers: { "content-type": "text/html", "cache-control": "no-store" },
      body: shell("Applicants", `<h1>Applicants</h1>${(event.queryStringParameters || {}).sent ? `<p class="ok">Sent to the routine. Scores appear here once it writes them back &mdash; refresh in a minute.</p>` : ""}${(event.queryStringParameters || {}).deleted ? `<p class="ok">Deleted.</p>` : ""}<div class="bar"><form method="POST"><input type="hidden" name="resend-all" value="1"><button type="submit">Re-run everyone not scored</button></form></div><p class="sub">${list.length} application${list.length === 1 ? "" : "s"}, newest first. Test entries are hidden.</p>${body}`, true) };
  } catch (err) {
    return { statusCode: 200, headers: { "content-type": "text/html" },
      body: shell("Applicants", `<h1>Applicants</h1><p class="warn">Could not load submissions: ${esc(String(err))}</p>`) };
  }
};
