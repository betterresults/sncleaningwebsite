// SN Cleaning Services website editor. Pages are previewed from the live site and
// edited in place; edits are saved as drafts and go live in one Publish.
import { SECTIONS, THUMBS } from "./sections.mjs";

const O = window.EdOverlay;
const API = "/api/editor";
const ID = "/.netlify/identity";
const $ = (s, r = document) => r.querySelector(s);
const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const clone = (o) => JSON.parse(JSON.stringify(o));
const LS = "sn_editor_backup";
const AUTH = "sn_editor_auth";

// Pages that can be edited. Everything else comes from Supabase and is view only.
const MAIN_PAGES = [
  ["/", "Home"], ["/our-services/", "Services"], ["/about/", "About"], ["/gallery/", "Gallery"],
  ["/blog/", "Blog page"], ["/contact/", "Contact"]
];
const LEGAL_PAGES = [["/privacy-policy/", "Privacy policy"], ["/terms-and-conditions/", "Terms and conditions"], ["/cookies-policy/", "Cookies policy"]];
const EDITABLE = new Map([...MAIN_PAGES, ...LEGAL_PAGES]);
const THEME_VARS = [
  ["--h-primary", "Buttons (new design)", "#1f6b66"],
  ["--h-primary-dark", "Buttons when hovered", "#17524e"],
  ["--h-ink", "Headings (new design)", "#14302c"],
  ["--h-deep", "Dark panels", "#1d3f3b"],
  ["--h-sand", "Light background", "#f4f1eb"],
  ["--h-sage", "Accent on dark panels", "#b6d3b0"],
  ["--color-primary", "Main colour (other pages)", "#2c7d79"],
  ["--color-primary-dark", "Main colour, darker", "#215e5b"],
  ["--color-accent", "Accent (stars, highlights)", "#f4a300"],
  ["--color-dark", "Headings (other pages)", "#122624"]
];
const BLOCK_HELP = {
  "quote-form": "The quote form is connected to your booking forms, so it can't be changed here.",
  services: "Services come from Supabase, so they can't be changed here.",
  checklist: "The room checklist is interactive, so it can't be changed here.",
  map: "The coverage map comes from Supabase, so it can't be changed here.",
  form: "This is the Dilvon contact form. Change the form itself in Dilvon.",
  details: "Phone, email and hours come from Supabase settings.",
  actions: "These buttons use the phone and WhatsApp from Supabase settings.",
  posts: "Blog posts appear here automatically, newest first.",
  cases: "Case studies appear here automatically, newest first.",
  postmeta: "Click to change the title, date, summary and cover photo in Post settings."
};

let auth = JSON.parse(localStorage.getItem(AUTH) || "null"); // { access, refresh, exp, email }
let live = null, draft = null, repoImages = [], sitemapPaths = [];
let path = "/", mode = "edit", device = "desktop", tab = "pages";
let sel = null, saveTimer = null, saving = false, unsaved = false, savedAt = null;
let fdoc = null, baseline = null, pickCb = null;
const liveCache = new Map();

/* ---------------- basics ---------------- */
function toast(msg, bad) { const t = $("#toast"); t.textContent = msg; t.className = "toast show" + (bad ? " bad" : ""); clearTimeout(t._h); t._h = setTimeout(() => (t.className = "toast"), 3600); }
function loading(on) { $("#loadBar").classList.toggle("hidden", !on); }
async function idFetch(p, opts = {}) {
  const r = await fetch(ID + p, opts);
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(j.error_description || j.msg || j.error || "Sign in failed");
  return j;
}
function saveAuth(j, email) {
  auth = { access: j.access_token, refresh: j.refresh_token, exp: Date.now() + (j.expires_in || 3600) * 1000 - 60000, email: email || auth?.email };
  localStorage.setItem(AUTH, JSON.stringify(auth));
}
async function authHeader() {
  if (!auth) return {};
  if (Date.now() > auth.exp) {
    const j = await idFetch("/token", { method: "POST", headers: { "content-type": "application/x-www-form-urlencoded" }, body: new URLSearchParams({ grant_type: "refresh_token", refresh_token: auth.refresh }) });
    saveAuth(j);
  }
  return { authorization: "Bearer " + auth.access };
}
async function api(action, data = {}) {
  let headers = { "content-type": "application/json" };
  try { Object.assign(headers, await authHeader()); } catch { logout(); throw new Error("Please sign in again"); }
  const r = await fetch(API, { method: "POST", headers, body: JSON.stringify({ action, ...data }) });
  const j = await r.json().catch(() => ({ error: "Server error" }));
  if (r.status === 401) { logout(); throw new Error("Please sign in again"); }
  if (!r.ok) throw new Error(j.error || "Something went wrong");
  return j;
}
function logout() { localStorage.removeItem(AUTH); auth = null; location.hash = ""; location.reload(); }
function modal(title, bodyHtml, buttons, opts = {}) {
  return new Promise((resolve) => {
    const bg = document.createElement("div");
    bg.className = "modal-bg";
    bg.innerHTML = `<div class="modal${opts.wide ? " wide" : ""}"><div class="mh">${title}</div><div class="mb">${bodyHtml}</div><div class="mf"></div></div>`;
    const mf = $(".mf", bg);
    buttons.forEach((b) => {
      const el = document.createElement("button");
      el.className = "btn " + (b.cls || "");
      el.textContent = b.label;
      el.onclick = () => { const v = b.value === undefined ? true : b.value; const data = {}; bg.querySelectorAll("[name]").forEach((i) => (data[i.name] = i.type === "checkbox" ? i.checked : i.value)); bg.remove(); resolve(v ? (b.collect ? data : v) : null); };
      mf.appendChild(el);
    });
    bg.addEventListener("mousedown", (e) => { if (e.target === bg) { bg.remove(); resolve(null); } });
    document.body.appendChild(bg);
    if (opts.onOpen) opts.onOpen(bg);
    const first = bg.querySelector("input:not([type=hidden]),select,textarea");
    if (first) first.focus();
  });
}
const confirmBox = (title, text, ok = "OK", cls = "primary") => modal(title, `<p>${text}</p>`, [{ label: "Cancel", value: false }, { label: ok, cls }]);

/* ---------------- sign in ---------------- */
let loginMode = "signin", pendingToken = null;
function setLoginMode(m, title, sub) {
  loginMode = m;
  $("#loginTitle").textContent = title || "Website editor";
  $("#loginSub").textContent = sub || "Sign in with your email and password";
  $("#emailField").classList.toggle("hidden", m === "setpw");
  $("#pwField").classList.toggle("hidden", m === "forgot");
  $("#pw2Field").classList.toggle("hidden", m !== "setpw");
  $("#forgotLink").classList.toggle("hidden", m !== "signin");
  $("#backLink").classList.toggle("hidden", m === "signin");
  $("#loginBtn").textContent = { signin: "Sign in", forgot: "Email me a reset link", setpw: "Save password and sign in" }[m];
  $("#pw").autocomplete = m === "setpw" ? "new-password" : "current-password";
  $("#loginErr").textContent = ""; $("#loginErr").classList.remove("ok");
}
$("#forgotLink").onclick = (e) => { e.preventDefault(); setLoginMode("forgot", "Reset your password", "We will email you a link to choose a new password"); };
$("#backLink").onclick = (e) => { e.preventDefault(); setLoginMode("signin"); };
$("#loginForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const err = $("#loginErr"); err.textContent = ""; err.classList.remove("ok");
  const b = $("#loginBtn"); const label = b.textContent; b.disabled = true; b.innerHTML = '<span class="spinner"></span>';
  const email = $("#em").value.trim(), pw = $("#pw").value;
  try {
    if (loginMode === "signin") {
      const j = await idFetch("/token", { method: "POST", headers: { "content-type": "application/x-www-form-urlencoded" }, body: new URLSearchParams({ grant_type: "password", username: email, password: pw }) });
      saveAuth(j, email); await start();
    } else if (loginMode === "forgot") {
      await idFetch("/recover", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email }) });
      err.textContent = "Check your email for a link to reset your password."; err.classList.add("ok");
    } else {
      if (pw.length < 8) throw new Error("Please use at least 8 characters.");
      if (pw !== $("#pw2").value) throw new Error("The two passwords are not the same.");
      let j;
      if (pendingToken.type === "invite") j = await idFetch("/verify", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ token: pendingToken.token, type: "signup", password: pw }) });
      else {
        j = await idFetch("/verify", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ token: pendingToken.token, type: "recovery" }) });
        await idFetch("/user", { method: "PUT", headers: { "content-type": "application/json", authorization: "Bearer " + j.access_token }, body: JSON.stringify({ password: pw }) });
      }
      saveAuth(j);
      history.replaceState(null, "", location.pathname);
      await start();
    }
  } catch (er) { err.textContent = er.message; }
  b.disabled = false; b.textContent = label;
});
{
  const h = new URLSearchParams(location.hash.slice(1));
  if (h.get("invite_token")) { pendingToken = { type: "invite", token: h.get("invite_token") }; setLoginMode("setpw", "Welcome", "Choose a password for the website editor"); }
  else if (h.get("recovery_token")) { pendingToken = { type: "recovery", token: h.get("recovery_token") }; setLoginMode("setpw", "Choose a new password", "Type your new password twice"); }
  else setLoginMode("signin");
}
$("#logoutBtn").onclick = async () => { if (unsaved) await saveNow(); logout(); };

/* ---------------- load ---------------- */
const hash = (s) => O.hash(s);
const fpPage = (src, k) => hash((src.html[k] ?? "") + JSON.stringify(src.pages[k] || {}));
const fpPost = (src, slug) => hash(JSON.stringify(src.posts.find((p) => p.slug === slug) || {}) + (src.bodies[slug] ?? ""));
function baseOf(src) {
  const h = {}, p = {};
  new Set([...Object.keys(src.pages), ...Object.keys(src.html)]).forEach((k) => (h[k] = fpPage(src, k)));
  src.posts.forEach((x) => (p[x.slug] = fpPost(src, x.slug)));
  return { h, p, site: hash(JSON.stringify(src.site)) };
}
// keep website updates made since the draft was started, unless the draft changed the same page
function mergeDraft(d, lv) {
  const out = { site: d.site, pages: d.pages || {}, html: d.html || {}, posts: d.posts || [], bodies: d.bodies || {}, images: d.images || [] };
  const base = d.base || { h: {}, p: {} };
  const keys = new Set([...Object.keys(lv.pages), ...Object.keys(lv.html)]);
  for (const k of keys) {
    const mine = k in out.pages || k in out.html;
    if ((!mine && !(k in base.h)) || (mine && base.h[k] && base.h[k] === fpPage(out, k))) {
      if (lv.pages[k]) out.pages[k] = clone(lv.pages[k]); else delete out.pages[k];
      if (k in lv.html) out.html[k] = lv.html[k]; else delete out.html[k];
    }
  }
  for (const lp of lv.posts) {
    const i = out.posts.findIndex((x) => x.slug === lp.slug);
    if ((i < 0 && !(lp.slug in base.p)) || (i >= 0 && base.p[lp.slug] && base.p[lp.slug] === fpPost(out, lp.slug))) {
      if (i < 0) out.posts.push(clone(lp)); else out.posts[i] = clone(lp);
      out.bodies[lp.slug] = lv.bodies[lp.slug] ?? "";
    }
  }
  if (base.site && base.site === hash(JSON.stringify(out.site))) out.site = clone(lv.site);
  out.base = baseOf(lv);
  return out;
}
async function start() {
  loading(true);
  try {
    const j = await api("load");
    live = j.content;
    repoImages = j.images;
    let d = j.draft;
    try {
      const b = JSON.parse(localStorage.getItem(LS) || "null");
      if (b && b.draft && (!d || b.at > Date.parse(d.savedAt || 0))) { d = b.draft; unsaved = true; }
    } catch {}
    draft = d ? mergeDraft(d, live) : { ...clone(live), images: [], base: baseOf(live) };
    savedAt = d && d.savedAt ? d.savedAt : null;
    $("#login").classList.add("hidden");
    $("#app").classList.remove("hidden");
    try {
      const sm = await (await fetch("/sitemap.xml", { cache: "no-store" })).text();
      sitemapPaths = [...sm.matchAll(/<loc>https?:\/\/[^/]+([^<]*)<\/loc>/g)].map((m) => m[1]);
    } catch {}
    const qs = new URLSearchParams(location.hash.slice(1));
    if (qs.get("p")) path = qs.get("p");
    renderPanel();
    await showPage(path);
    updateStatus();
    if (changeList().length) showBanner(`You have unpublished changes${savedAt ? " from " + new Date(savedAt).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" }) : ""}.`);
    if (unsaved) scheduleSave(200);
  } catch (e) { toast(e.message, true); }
  loading(false);
}
if (auth && !pendingToken) { $("#login").classList.add("hidden"); start(); }

function showBanner(text) {
  const b = $("#banner");
  b.innerHTML = `<span>${esc(text)}</span><button class="btn sm gold" id="bPub">Publish now</button><button class="btn sm" id="bDis">Discard</button><button class="mini" id="bX">✕</button>`;
  b.classList.remove("hidden");
  $("#bPub").onclick = () => { b.classList.add("hidden"); publish(); };
  $("#bDis").onclick = () => { b.classList.add("hidden"); discardAll(); };
  $("#bX").onclick = () => b.classList.add("hidden");
}

/* ---------------- pages and change tracking ---------------- */
const norm = (p) => { p = (p || "/").split("#")[0].split("?")[0]; if (!p.startsWith("/")) p = "/" + p; return p === "/" || /\.[a-z0-9]+$/i.test(p) ? p : p.replace(/\/?$/, "/"); };
function info(p) {
  p = norm(p);
  let m = p.match(/^\/blog\/([a-z0-9-]+)\/$/);
  if (m && draft.posts.some((x) => x.slug === m[1] && (x.kind || "post") === "post")) return { type: "post", slug: m[1], key: O.pageKey(p) };
  m = p.match(/^\/case-studies\/([a-z0-9-]+)\/$/);
  if (m && draft.posts.some((x) => x.slug === m[1] && x.kind === "case")) return { type: "case", slug: m[1], key: O.pageKey(p) };
  if (EDITABLE.has(p)) return { type: "page", key: O.pageKey(p) };
  return { type: "view", key: O.pageKey(p) };
}
function label(p) {
  p = norm(p);
  if (EDITABLE.has(p)) return EDITABLE.get(p);
  const i = info(p);
  if (i.slug) return (draft.posts.find((x) => x.slug === i.slug) || {}).title || p;
  return p.replace(/^\/|\/$/g, "").replace(/\//g, " / ").replace(/-/g, " ") || "Home";
}
const postPath = (x) => (x.kind === "case" ? `/case-studies/${x.slug}/` : `/blog/${x.slug}/`);
function changeList() {
  if (!draft || !live) return [];
  const out = [];
  const keys = new Set([...Object.keys(draft.pages), ...Object.keys(draft.html), ...Object.keys(live.pages), ...Object.keys(live.html)]);
  for (const k of keys) if (fpPage(draft, k) !== fpPage(live, k)) out.push({ k, text: "Page: " + label(k === "home" ? "/" : "/" + k.replace(/--/g, "/") + "/") });
  const slugs = new Set([...draft.posts.map((x) => x.slug), ...live.posts.map((x) => x.slug)]);
  for (const s of slugs) {
    const d = draft.posts.find((x) => x.slug === s), l = live.posts.find((x) => x.slug === s);
    const kind = (d || l).kind === "case" ? "case study" : "blog post";
    if (!d) out.push({ k: s, text: `Deleted ${kind}: ${l.title}` });
    else if (!l) out.push({ k: s, text: `New ${kind}: ${d.title}` });
    else if (fpPost(draft, s) !== fpPost(live, s)) out.push({ k: s, text: `${kind[0].toUpperCase() + kind.slice(1)}: ${d.title}` });
  }
  if (JSON.stringify(draft.site) !== JSON.stringify(live.site)) out.push({ text: "Website colours" });
  return out;
}
function updateStatus() {
  const n = changeList().length;
  $("#chgCount").textContent = n;
  $("#publishBtn").disabled = n === 0 && !unsaved;
  const st = $("#status");
  st.className = "status" + (saving ? " saving" : unsaved ? " unsaved" : "");
  $("#statusText").textContent = saving ? "Saving…" : unsaved ? "Unsaved changes" : n ? "Saved · not published yet" : "Everything is published";
  const keys = new Set(changeList().map((c) => c.k));
  document.querySelectorAll(".plist li[data-p]").forEach((li) => { const i = info(li.dataset.p); li.querySelector(".chg")?.classList.toggle("hidden", !keys.has(i.slug || i.key)); });
}
function changed(opts = {}) {
  unsaved = true;
  try { localStorage.setItem(LS, JSON.stringify({ at: Date.now(), draft })); } catch {}
  scheduleSave();
  updateStatus();
  if (opts.rerender) showPage(path, true);
  if (opts.panel) renderPanel();
}
function scheduleSave(ms = 2500) { clearTimeout(saveTimer); saveTimer = setTimeout(saveNow, ms); }
async function saveNow() {
  clearTimeout(saveTimer);
  if (!unsaved || saving) return;
  saving = true; updateStatus();
  try {
    const j = await api("saveDraft", { draft });
    savedAt = j.savedAt; unsaved = false;
    try { localStorage.removeItem(LS); } catch {}
  } catch (e) { toast("Could not save: " + e.message, true); }
  saving = false; updateStatus();
}
$("#saveBtn").onclick = async () => { syncText(); unsaved = true; await saveNow(); toast("Saved. Press Publish when you are ready to go live."); };
document.addEventListener("keydown", (e) => { if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") { e.preventDefault(); $("#saveBtn").click(); } });
window.addEventListener("beforeunload", (e) => {
  if (unsaved || changeList().length) { if (unsaved) saveNow(); e.preventDefault(); e.returnValue = "You have changes that are not published yet."; }
});
$("#viewLive").onclick = () => window.open(path, "_blank");

/* ---------------- preview ---------------- */
document.querySelectorAll("#modeSeg button").forEach((b) => (b.onclick = () => { mode = b.dataset.mode; document.querySelectorAll("#modeSeg button").forEach((x) => x.classList.toggle("on", x === b)); deselect(); showPage(path, true); }));
document.querySelectorAll("#devSeg button").forEach((b) => (b.onclick = () => { device = b.dataset.dev; document.querySelectorAll("#devSeg button").forEach((x) => x.classList.toggle("on", x === b)); fit(); }));
window.addEventListener("resize", fit);
function fit() {
  const c = $("#canvas"), w = $("#frameWrap"), f = $("#frame");
  c.classList.toggle("mobile", device === "mobile");
  const W = device === "mobile" ? 390 : 1280;
  const s = Math.min(1, (c.clientWidth - 40) / (W + (device === "mobile" ? 20 : 0)));
  f.style.width = W + "px"; f.style.height = Math.round((c.clientHeight - 32) / s) - (device === "mobile" ? 20 : 0) + "px";
  w.style.transform = `scale(${s})`;
}
async function liveHtml(p) {
  if (liveCache.has(p)) return liveCache.get(p);
  let r = await fetch(p, { cache: "no-store" });
  const i = info(p);
  if (!r.ok && i.slug) r = await fetch(i.type === "case" ? "/case-studies/_template/" : "/blog/_template/", { cache: "no-store" });
  if (!r.ok) throw new Error("This page could not be loaded");
  const html = await r.text();
  liveCache.set(p, html);
  return html;
}
const imgUrl = (n) => (n.startsWith("/") ? n : (draft.images.includes(n) ? "/api/draft-image/" : "/images/uploads/") + n);
function fillPost(doc, i) {
  const x = draft.posts.find((p) => p.slug === i.slug);
  if (!x) return;
  const set = (s, v) => doc.querySelectorAll(s).forEach((el) => (el.textContent = v || ""));
  set("[data-ed-title]", x.title); set("[data-ed-excerpt]", x.excerpt); set("[data-ed-service]", x.service); set("[data-ed-area]", x.area);
  doc.querySelectorAll("[data-ed-date]").forEach((t) => {
    if (!x.date) return;
    t.setAttribute("datetime", x.date);
    t.textContent = new Date(x.date + "T12:00:00").toLocaleDateString("en-GB", x.kind === "case" ? { month: "long", year: "numeric" } : { day: "numeric", month: "long", year: "numeric" });
  });
  doc.querySelectorAll("[data-ed-cover]").forEach((im) => { if (x.cover) { im.setAttribute("src", imgUrl(x.cover)); im.removeAttribute("srcset"); } });
  const body = doc.querySelector("[data-ed-body]");
  if (body) body.innerHTML = draft.bodies[x.slug] ?? "";
}
async function previewHtml(p) {
  let html = (await liveHtml(p)).replace(/<style id="ed-theme">[\s\S]*?<\/style>/, "");
  const i = info(p);
  const page = i.type === "page" ? { html: draft.html[i.key], seo: (draft.pages[i.key] || {}).seo } : {};
  if (page.html == null) delete page.html;
  html = O.apply(html, { page, site: draft.site, siteUrl: location.origin });
  if (i.slug) {
    const doc = new DOMParser().parseFromString(html, "text/html");
    fillPost(doc, i);
    html = "<!DOCTYPE html>\n" + doc.documentElement.outerHTML;
  }
  for (const img of draft.images) html = html.split(`/images/uploads/${img}`).join(`/api/draft-image/${img}`);
  html = html.replace("<head>", `<head>\n<base href="${location.origin}/">`);
  if (!html.includes("/css/extras.css") && !html.includes(".author-box{")) html = html.replace("</head>", '<link rel="stylesheet" href="/css/extras.css"></head>');
  if (mode === "edit") html = html.replace(/<script(?![^>]*\btype=)/g, '<script type="text/x-ed-off"');
  return html;
}
async function showPage(p, keepScroll) {
  syncText();
  p = norm(p);
  const fr = $("#frame");
  const y = keepScroll && fr.contentWindow ? fr.contentWindow.scrollY : 0;
  path = p;
  history.replaceState(null, "", "#p=" + encodeURIComponent(p));
  $("#pageName").textContent = label(p);
  const i = info(p);
  const lock = $("#lockbar");
  lock.classList.toggle("hidden", i.type !== "view" || mode !== "edit");
  lock.textContent = "This page comes from Supabase, so it is view only.";
  const hint = $("#editHint");
  hint.classList.toggle("hidden", mode !== "edit" || i.type === "view");
  clearTimeout(hint._t); hint._t = setTimeout(() => hint.classList.add("hidden"), 7000);
  deselect(true);
  let html;
  loading(true);
  try { html = await previewHtml(p); } catch (e) { loading(false); return toast(e.message, true); }
  loading(false);
  fr.onload = () => {
    fdoc = fr.contentDocument;
    try { fr.contentWindow.scrollTo(0, y); } catch {}
    if (mode === "edit" && i.type !== "view") attachEditor(fdoc, i); else attachPreview(fdoc);
  };
  fr.srcdoc = html;
  fit();
  document.querySelectorAll(".plist li[data-p]").forEach((li) => li.classList.toggle("on", norm(li.dataset.p) === p));
}
function internalTarget(a) {
  const h = a.getAttribute("href") || "";
  if (/^(mailto:|tel:|#)/.test(h)) return null;
  try { const u = new URL(h, location.origin); return u.origin === location.origin && !/\.[a-z0-9]+$/i.test(u.pathname) ? u.pathname : null; } catch { return null; }
}
function attachPreview(doc) {
  doc.addEventListener("click", (e) => {
    const a = e.target.closest("a");
    if (!a) return;
    const t = internalTarget(a);
    e.preventDefault();
    if (t) showPage(t); else if (!(a.getAttribute("href") || "").startsWith("#")) window.open(a.href, "_blank");
  }, true);
}

/* ---------------- visual editing ---------------- */
const TEXT_TAGS = new Set(["H1", "H2", "H3", "H4", "H5", "P", "LI", "BLOCKQUOTE", "FIGCAPTION", "SUMMARY", "DT", "DD", "TD", "TH", "A", "BUTTON", "SPAN", "STRONG", "EM", "SMALL", "CITE", "LABEL", "B", "I"]);
const SINGLE_LINE = new Set(["H1", "H2", "H3", "H4", "H5", "A", "BUTTON", "SUMMARY", "SPAN", "STRONG", "EM", "SMALL", "CITE", "LABEL", "TH", "TD", "DT", "DD", "B", "I"]);
const EDIT_CSS = `
.pse-hover{outline:2px dashed rgba(44,125,121,.9)!important;outline-offset:2px;cursor:text}
img.pse-hover{cursor:pointer}
.pse-sel{outline:2px solid #2c7d79!important;outline-offset:2px}
[contenteditable=true]{outline:2px solid #2563eb!important;outline-offset:3px;cursor:text;caret-color:#2563eb}
.pse-sec-hover{box-shadow:inset 0 0 0 2px rgba(37,99,235,.45)}
.pse-sec-sel{box-shadow:inset 0 0 0 3px #2563eb}
[data-pse-block]{cursor:not-allowed}
[data-pse-block].pse-blk-hover{outline:2px dashed #94a3b8!important;outline-offset:2px}
[data-pse-block="postmeta"]{cursor:pointer}
.pse-chip{position:absolute;z-index:2147483646;background:#2563eb;color:#fff;font:600 12px/1 system-ui,sans-serif;padding:7px 10px;border-radius:0 0 8px 0;cursor:pointer;box-shadow:0 4px 12px rgba(0,0,0,.2);display:none}
.pse-add{position:absolute;z-index:2147483646;transform:translate(-50%,-50%);background:#fff;color:#2563eb;border:2px solid #2563eb;font:700 12px/1 system-ui,sans-serif;padding:8px 14px;border-radius:999px;cursor:pointer;box-shadow:0 6px 18px rgba(0,0,0,.18);display:none;white-space:nowrap}
.pse-add:hover{background:#2563eb;color:#fff}
.pse-tip{position:fixed;z-index:2147483647;background:#1f2937;color:#fff;font:500 12px/1.4 system-ui,sans-serif;padding:7px 10px;border-radius:8px;max-width:280px;pointer-events:none;display:none}
.ps-video::after{content:"Click to change the video";position:absolute;inset:0;display:flex;align-items:flex-end;justify-content:center;padding-bottom:14px;color:#fff;font:600 13px system-ui,sans-serif;background:linear-gradient(transparent 60%,rgba(0,0,0,.45));cursor:pointer;opacity:0;transition:opacity .2s;z-index:2}
.ps-video:hover::after,.ps-video.pse-sel::after{opacity:1}
.h-reveal{opacity:1!important;transform:none!important}
`;
let editRoot = null; // where edits are allowed: <main>, or the post body
function attachEditor(doc, i) {
  const st = doc.createElement("style"); st.textContent = EDIT_CSS; doc.head.appendChild(st);
  const main = doc.querySelector("main");
  if (!main) return;
  editRoot = main;
  if (i.type === "page") markBlocks(main);
  else {
    const body = main.querySelector("[data-ed-body]");
    editRoot = body || main;
    main.querySelectorAll("*").forEach((el) => { if (body && (el === body || body.contains(el) || el.contains(body))) return; el.dataset.pseBlock = "postmeta"; });
  }
  baseline = serialize();
  const chip = doc.createElement("div"); chip.className = "pse-chip"; chip.textContent = "⚙ Section"; doc.body.appendChild(chip);
  const add = doc.createElement("button"); add.className = "pse-add"; add.type = "button"; add.textContent = "+ Add section"; doc.body.appendChild(add);
  const tip = doc.createElement("div"); tip.className = "pse-tip"; doc.body.appendChild(tip);
  const sections = i.type === "page";
  let hoverEl = null, hoverSec = null;
  doc.addEventListener("mouseover", (e) => {
    const t = e.target;
    if (hoverEl) { hoverEl.classList.remove("pse-hover", "pse-blk-hover"); hoverEl = null; }
    tip.style.display = "none";
    if (!main.contains(t)) return;
    const blk = t.closest("[data-pse-block]");
    if (blk) {
      blk.classList.add("pse-blk-hover"); hoverEl = blk;
      tip.textContent = BLOCK_HELP[blk.dataset.pseBlock] || "This part updates automatically."; tip.style.display = "block";
    } else {
      const target = pickTarget(t);
      if (target && target.getAttribute("contenteditable") !== "true") { target.classList.add("pse-hover"); hoverEl = target; }
    }
    if (!sections) return;
    const sec = topSection(t, main);
    if (sec !== hoverSec) {
      if (hoverSec) hoverSec.classList.remove("pse-sec-hover");
      hoverSec = sec;
      if (sec) {
        sec.classList.add("pse-sec-hover");
        const r = sec.getBoundingClientRect(), sy = doc.defaultView.scrollY;
        chip.style.top = r.top + sy + "px"; chip.style.left = r.left + "px"; chip.style.display = sec.dataset.pseBlock ? "none" : "block"; chip._sec = sec;
        add.style.top = r.bottom + sy + "px"; add.style.left = r.left + r.width / 2 + "px"; add.style.display = "block"; add._sec = sec;
      } else chip.style.display = "none";
    }
  });
  doc.addEventListener("mousemove", (e) => { if (tip.style.display === "block") { tip.style.left = Math.min(e.clientX + 14, doc.defaultView.innerWidth - 300) + "px"; tip.style.top = e.clientY + 16 + "px"; } });
  doc.defaultView.addEventListener("scroll", () => {
    const sec = chip._sec; if (!sec) return;
    const r = sec.getBoundingClientRect(), sy = doc.defaultView.scrollY;
    chip.style.top = r.top + sy + "px"; chip.style.left = r.left + "px"; add.style.top = r.bottom + sy + "px"; add.style.left = r.left + r.width / 2 + "px";
  }, { passive: true });
  chip.addEventListener("click", (e) => { e.preventDefault(); e.stopPropagation(); if (chip._sec) select("section", chip._sec); });
  add.addEventListener("click", (e) => { e.preventDefault(); e.stopPropagation(); if (add._sec) openLibrary(add._sec, "after"); });
  doc.addEventListener("click", (e) => {
    const t = e.target;
    if (t === chip || t === add) return;
    const a = t.closest("a");
    if (a && a.getAttribute("contenteditable") !== "true") e.preventDefault();
    if (t.closest("form") && t.closest("[data-pse-block]")) e.preventDefault();
    if (!main.contains(t)) { if (t.closest("header,footer")) toast("The menu and footer come from the website code and Supabase settings."); deselect(); return; }
    const blk = t.closest("[data-pse-block]");
    if (blk) { e.preventDefault(); deselect(); if (blk.dataset.pseBlock === "postmeta") postSettings(info(path).slug); return; }
    const vid = t.closest(".ps-video");
    if (vid) { e.preventDefault(); select("video", vid); return; }
    if (t.tagName === "IMG") { e.preventDefault(); select("image", t); return; }
    const target = pickTarget(t);
    if (target) {
      if (target.tagName === "SUMMARY" && target.getAttribute("contenteditable") === "true") e.preventDefault();
      if (sel && sel.el === target) return;
      select("text", target); return;
    }
    const sec = sections ? topSection(t, main) : null;
    if (sec && !sec.dataset.pseBlock) select("section", sec); else deselect();
  }, true);
  doc.addEventListener("submit", (e) => e.preventDefault(), true);
  doc.addEventListener("keydown", (e) => {
    const el = e.target;
    if (!el || el.getAttribute?.("contenteditable") !== "true") return;
    if (e.key === "Escape") { e.preventDefault(); deselect(); return; }
    if (e.key === "Enter") { if (e.shiftKey && !SINGLE_LINE.has(el.tagName)) return; e.preventDefault(); return deselect(); }
    if (e.key === " " && (el.tagName === "SUMMARY" || el.tagName === "BUTTON")) { e.preventDefault(); doc.execCommand("insertText", false, " "); }
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") { e.preventDefault(); $("#saveBtn").click(); }
  });
  doc.addEventListener("paste", (e) => {
    const el = e.target.closest?.("[contenteditable=true]");
    if (!el) return;
    e.preventDefault();
    doc.execCommand("insertText", false, (e.clipboardData.getData("text/plain") || "").replace(/\s*\n\s*/g, " "));
  });
  doc.addEventListener("input", () => { if (sel && sel.kind === "text") { clearTimeout(attachEditor._t); attachEditor._t = setTimeout(syncText, 400); } });
}
function markBlocks(main) {
  const walker = main.ownerDocument.createTreeWalker(main, NodeFilter.SHOW_COMMENT);
  const opens = []; let n;
  while ((n = walker.nextNode())) if (/^sb:/.test(n.nodeValue)) opens.push(n);
  for (const start of opens) {
    const name = start.nodeValue.slice(3);
    let x = start.nextSibling;
    while (x && !(x.nodeType === 8 && x.nodeValue === "/sb")) { if (x.nodeType === 1) x.dataset.pseBlock = name; x = x.nextSibling; }
  }
}
function topSection(t, main) {
  let x = t.nodeType === 1 ? t : t.parentElement;
  while (x && x.parentElement !== main) x = x.parentElement;
  return x && x.parentElement === main ? x : null;
}
const hasOwnText = (el) => [...el.childNodes].some((c) => c.nodeType === 3 && c.nodeValue.trim());
function pickTarget(t) {
  let x = t.nodeType === 1 ? t : t.parentElement;
  if (!editRoot || !editRoot.contains(x) || x.closest("[data-pse-block]")) return null;
  while (x && x !== editRoot && x.tagName !== "MAIN") {
    if (TEXT_TAGS.has(x.tagName) && (hasOwnText(x) || x.tagName === "A" || x.tagName === "BUTTON")) {
      const up = x.parentElement;
      if (["STRONG", "EM", "B", "I", "SMALL"].includes(x.tagName) && up && ["P", "LI", "H1", "H2", "H3", "BLOCKQUOTE", "FIGCAPTION", "DD", "TD"].includes(up.tagName) && hasOwnText(up)) return up;
      if (x.tagName === "SPAN" && x.closest("a")) return x.closest("a");
      return x;
    }
    if (x.tagName === "IMG" || x.tagName === "SVG") return null;
    if (hasOwnText(x) && !["UL", "OL", "TABLE", "TBODY", "TR", "DL", "DETAILS", "FIGURE", "SECTION"].includes(x.tagName)) return x;
    x = x.parentElement;
  }
  return null;
}
function select(kind, el) {
  if (sel && sel.el === el) return;
  deselect(true);
  sel = { kind, el };
  if (kind === "text") { el.setAttribute("contenteditable", "true"); el.setAttribute("spellcheck", "true"); el.focus(); }
  else if (kind === "section") el.classList.add("pse-sec-sel");
  else el.classList.add("pse-sel");
  el.classList.remove("pse-hover");
  renderInspector();
}
function deselect(silent) {
  if (sel) {
    const el = sel.el;
    if (sel.kind === "text") { syncPage(); el.removeAttribute("contenteditable"); el.removeAttribute("spellcheck"); }
    el.classList.remove("pse-sel", "pse-sec-sel");
  }
  sel = null;
  if (!silent) renderInspector(); else { $("#insp").innerHTML = ""; $("#main").classList.add("noinspect"); fit(); }
}

/* serialize the edited page back into what is saved */
function cleanClone(root) {
  const c = root.cloneNode(true);
  c.querySelectorAll("[contenteditable]").forEach((x) => { x.removeAttribute("contenteditable"); x.removeAttribute("spellcheck"); });
  [c, ...c.querySelectorAll("*")].forEach((x) => {
    if (x.classList && x.classList.length) { [...x.classList].filter((k) => k.startsWith("pse-")).forEach((k) => x.classList.remove(k)); if (!x.classList.length) x.removeAttribute("class"); }
    if (x.dataset && x.dataset.pseBlock !== undefined) delete x.dataset.pseBlock;
  });
  c.querySelectorAll('script[type="text/x-ed-off"]').forEach((s) => s.removeAttribute("type"));
  c.querySelectorAll("details[open]").forEach((d) => d.removeAttribute("open"));
  c.querySelectorAll('[style=""]').forEach((x) => x.removeAttribute("style"));
  let html = c.innerHTML;
  html = html.split("/api/draft-image/").join("/images/uploads/");
  html = html.replace(/&nbsp;(?=[^\s<&])/g, " ").replace(/([^\s>;])&nbsp;/g, "$1 ");
  return html;
}
function serialize() {
  if (!fdoc || !editRoot) return null;
  const html = cleanClone(editRoot);
  return editRoot.tagName === "MAIN" ? O.collapse(html) : html;
}
function syncPage() {
  const html = serialize();
  if (html == null || html === baseline) return;
  const i = info(path);
  if (i.type === "page") {
    if (draft.html[i.key] === html) return;
    draft.html[i.key] = html;
    draft.pages[i.key] = { ...(draft.pages[i.key] || {}), path, updatedAt: new Date().toISOString() };
  } else if (i.slug) {
    if (draft.bodies[i.slug] === html) return;
    draft.bodies[i.slug] = html;
    const x = draft.posts.find((p) => p.slug === i.slug); if (x) x.updated = new Date().toISOString().slice(0, 10);
  } else return;
  baseline = html;
  changed();
}
function syncText() { if (sel && sel.kind === "text") syncPage(); }

function itemOf(el) {
  let x = el;
  while (x && x !== editRoot && x.tagName !== "SECTION" && x.tagName !== "MAIN") {
    const p = x.parentElement;
    if (p) {
      const sib = [...p.children].filter((c) => c.tagName === x.tagName && c.className === x.className && !c.dataset.pseBlock);
      if (sib.length >= 2 && !["SPAN", "STRONG", "EM", "A", "BR"].includes(x.tagName)) return x;
    }
    x = p;
  }
  return null;
}

/* ---------------- inspector ---------------- */
// The words on a link or button (keeps any icon inside it)
function textNodesOf(el) { const w = el.ownerDocument.createTreeWalker(el, 4); const out = []; let n; while ((n = w.nextNode())) if (n.nodeValue.trim()) out.push(n); return out; }
function linkText(el) { return textNodesOf(el).map((n) => n.nodeValue.trim()).join(" "); }
function setLinkText(el, v) {
  const ns = textNodesOf(el);
  if (!ns.length) { el.appendChild(el.ownerDocument.createTextNode(v)); return; }
  const lead = ns[0].nodeValue.match(/^\s*/)[0], trail = ns[0].nodeValue.match(/\s*$/)[0];
  ns[0].nodeValue = lead + v + trail;
  ns.slice(1).forEach((n) => { n.nodeValue = ""; });
}
function rgbToHex(c) {
  c = String(c).trim();
  if (/^#[0-9a-f]{6}$/i.test(c)) return c.toLowerCase();
  if (/^#[0-9a-f]{3}$/i.test(c)) return "#" + c.slice(1).split("").map((x) => x + x).join("").toLowerCase();
  const m = c.match(/\d+/g); if (!m) return "#000000";
  return "#" + m.slice(0, 3).map((v) => (+v).toString(16).padStart(2, "0")).join("");
}
const colorField = (label, value, id, resetId) => `<div class="color-row"><label>${label}</label><input type="color" id="${id}" value="${value}"><input class="inp hex" id="${id}Hex" value="${value}">${resetId ? `<button class="mini" id="${resetId}" title="Reset">↺</button>` : ""}</div>`;
function bindColor(id, fn) {
  const c = $("#" + id), h = $("#" + id + "Hex");
  c.oninput = () => { h.value = c.value; fn(c.value); };
  h.onchange = () => { if (/^#[0-9a-f]{6}$/i.test(h.value)) { c.value = h.value; fn(h.value); } };
}
function renderInspector() {
  const box = $("#insp");
  if (!sel || mode !== "edit") { box.innerHTML = ""; $("#main").classList.add("noinspect"); fit(); return; }
  const el = sel.el, win = fdoc.defaultView;
  const item = sel.kind !== "section" ? itemOf(el) : null;
  const itemTools = item ? `<div class="sec"><h5>This ${item.tagName === "LI" ? "list item" : item.tagName === "DETAILS" ? "question" : "item"}</h5><div class="tool-row"><button class="btn sm" id="iUp">↑ Up</button><button class="btn sm" id="iDown">↓ Down</button><button class="btn sm" id="iDup">Duplicate</button><button class="btn sm danger" id="iDel">Delete</button></div></div>` : "";
  let body = "";
  if (sel.kind === "text") {
    const cs = win.getComputedStyle(el);
    body = `<p class="hint">Type straight on the page. <kbd>Enter</kbd> finishes, <kbd>Esc</kbd> closes.</p>
      <div class="sec"><h5>Style</h5><div class="tool-row"><button class="btn sm" id="tB"><b>B</b></button><button class="btn sm" id="tI"><i>I</i></button><button class="btn sm" id="tLink">🔗 Link</button><button class="btn sm" id="tUnlink">Remove link</button></div>
      ${colorField("Text colour", rgbToHex(cs.color), "tCol", "tColReset")}</div>
      ${el.tagName === "A" ? `<div class="sec"><h5>Link</h5><label class="field"><span>Button text</span><input class="inp" id="lText" value="${esc(linkText(el))}"></label><label class="field"><span>Goes to</span><input class="inp" id="lHref" value="${esc(el.getAttribute("href") || "")}"></label>
      <label class="field"><span>Or pick a page</span><select class="inp" id="lPage"><option value="">Choose a page…</option>${[...EDITABLE].map(([p, l]) => `<option value="${p}">${esc(l)}</option>`).join("")}</select></label>
      <label class="row"><input type="checkbox" id="lNew" ${el.getAttribute("target") === "_blank" ? "checked" : ""}> Open in a new tab</label></div>` : ""}
      ${itemTools}`;
  } else if (sel.kind === "image") {
    body = `<img class="thumb" src="${esc(el.getAttribute("src"))}" alt="">
      <div class="sec"><div class="tool-row"><button class="btn primary sm" id="imUp">⬆ Upload new photo</button></div><p class="hint">Or choose one you already have:</p><div class="lib" id="imLib"></div></div>
      <div class="sec"><h5>Description for Google and screen readers</h5><input class="inp" id="imAlt" value="${esc(el.getAttribute("alt") || "")}"></div>${itemTools}`;
  } else if (sel.kind === "video") {
    const fr = el.querySelector("iframe"), cur = fr ? fr.getAttribute("src") || "" : "";
    body = `<p class="hint">${fr ? "Showing a video from " + (cur.includes("vimeo") ? "Vimeo" : "YouTube") + "." : "Showing your uploaded video."}</p>
      <div class="sec"><h5>YouTube or Vimeo link</h5><input class="inp" id="vLink" placeholder="Paste the link to the video" value="${fr ? esc(watchUrl(cur)) : ""}">
      <div class="tool-row" style="margin-top:6px"><button class="btn primary sm" id="vUse">Use this link</button></div><p class="hint">Best for longer videos. Copy the link from the address bar on YouTube or Vimeo.</p></div>
      <div class="sec"><h5>Or upload a short clip</h5><div class="tool-row"><button class="btn sm" id="vUp">⬆ Upload MP4</button></div><p class="hint">MP4 under 4 MB, about 20 to 30 seconds.</p></div>`;
  } else if (sel.kind === "section") {
    const cs = win.getComputedStyle(el);
    body = `<div class="sec"><h5>Colours for this section only</h5>
      ${colorField("Background", rgbToHex(cs.backgroundColor === "rgba(0, 0, 0, 0)" ? "#ffffff" : cs.backgroundColor), "sBg")}
      ${colorField("Text", rgbToHex(cs.color), "sTx")}
      ${colorField("Headings", rgbToHex(cs.getPropertyValue("--h-ink").trim() || cs.getPropertyValue("--color-dark").trim() || "#14302c"), "sHd")}
      ${colorField("Buttons", rgbToHex(cs.getPropertyValue("--h-primary").trim() || cs.getPropertyValue("--color-primary").trim() || "#1f6b66"), "sBt")}
      <button class="btn sm full" id="sReset">↺ Back to the website colours</button></div>
      <div class="sec"><h5>Section</h5><div class="tool-row"><button class="btn sm" id="sUp">↑ Move up</button><button class="btn sm" id="sDown">↓ Move down</button></div>
      <div class="tool-row" style="margin-top:6px"><button class="btn sm" id="sDup">Duplicate</button><button class="btn sm danger" id="sDel">Delete section</button></div></div>
      <div class="sec"><h5>Add a new section</h5><div class="tool-row"><button class="btn sm" id="sAddUp">+ Above</button><button class="btn sm primary" id="sAddDown">+ Below</button></div></div>`;
  }
  const title = { section: "Section", image: "Photo", video: "Video" }[sel.kind] || ({ A: "Link or button", H1: "Main heading", H2: "Heading", H3: "Small heading", P: "Paragraph", LI: "List item", SUMMARY: "Question" }[el.tagName] || "Text");
  box.innerHTML = `<div class="hd">${title}<span class="sp"></span><button class="mini" id="inspX">✕</button></div><div class="bd">${body}</div>`;
  $("#main").classList.remove("noinspect"); fit();
  $("#inspX").onclick = () => deselect();
  const exec = (cmd, val) => { fdoc.defaultView.focus(); if (sel.kind === "text") sel.el.focus(); fdoc.execCommand(cmd, false, val); syncPage(); };
  if (sel.kind === "text") {
    ["#tB", "#tI", "#tLink", "#tUnlink"].forEach((id) => ($(id).onmousedown = (e) => e.preventDefault()));
    $("#tB").onclick = () => exec("bold");
    $("#tI").onclick = () => exec("italic");
    $("#tLink").onclick = async () => { const r = await modal("Add a link", `<label class="field"><span>Web address or page</span><input class="inp" name="u" placeholder="https://… or /about/"></label>`, [{ label: "Cancel", value: false }, { label: "Add link", cls: "primary", collect: true }]); if (r && r.u) exec("createLink", r.u); };
    $("#tUnlink").onclick = () => exec("unlink");
    bindColor("tCol", (v) => { el.style.color = v; syncPage(); });
    $("#tColReset").onclick = () => { el.style.removeProperty("color"); syncPage(); renderInspector(); };
    if (el.tagName === "A") {
      $("#lText").oninput = () => { setLinkText(el, $("#lText").value); syncPage(); };
      $("#lHref").onchange = () => { el.setAttribute("href", $("#lHref").value.trim()); syncPage(); };
      $("#lPage").onchange = () => { if ($("#lPage").value) { $("#lHref").value = $("#lPage").value; el.setAttribute("href", $("#lPage").value); syncPage(); } };
      $("#lNew").onchange = () => { if ($("#lNew").checked) { el.setAttribute("target", "_blank"); el.setAttribute("rel", "noopener"); } else { el.removeAttribute("target"); el.removeAttribute("rel"); } syncPage(); };
    }
  }
  if (sel.kind === "image") {
    const all = [...draft.images.filter((n) => !/\.(mp4|webm)$/.test(n)).map((n) => ({ n, src: "/api/draft-image/" + n })), ...repoImages.map((n) => ({ n, src: n }))];
    $("#imLib").innerHTML = all.map((i) => `<img src="${i.src}" data-n="${esc(i.n)}" loading="lazy" title="${esc(i.n)}">`).join("");
    $("#imLib").onclick = (e) => { const t = e.target.closest("img[data-n]"); if (t) setImage(t.dataset.n); };
    $("#imUp").onclick = () => pickImage((n) => setImage(n));
    $("#imAlt").onchange = () => { el.setAttribute("alt", $("#imAlt").value.trim()); syncPage(); };
  }
  if (sel.kind === "video") {
    $("#vUse").onclick = () => {
      const u = embedUrl($("#vLink").value.trim());
      if (!u) return toast("That link doesn't look like a YouTube or Vimeo video.", true);
      el.innerHTML = `<iframe src="${u}" title="Video" loading="lazy" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>`;
      syncPage(); renderInspector(); toast("Video changed");
    };
    $("#vUp").onclick = () => pickVideo((f) => { el.innerHTML = `<video src="/api/draft-image/${f}" controls playsinline preload="metadata"></video>`; syncPage(); renderInspector(); toast("Video uploaded"); });
  }
  if (sel.kind === "section") {
    const setVars = (props, v) => { props.forEach((p) => el.style.setProperty(p, v)); syncPage(); };
    bindColor("sBg", (v) => setVars(["background"], v));
    bindColor("sTx", (v) => setVars(["color"], v));
    bindColor("sHd", (v) => setVars(["--h-ink", "--color-dark", "--ps-ink"], v));
    bindColor("sBt", (v) => setVars(["--h-primary", "--h-primary-dark", "--color-primary", "--color-primary-dark", "--ps-primary"], v));
    $("#sReset").onclick = () => { ["background", "color", "--h-ink", "--color-dark", "--ps-ink", "--h-primary", "--h-primary-dark", "--color-primary", "--color-primary-dark", "--ps-primary"].forEach((p) => el.style.removeProperty(p)); syncPage(); renderInspector(); };
    $("#sAddUp").onclick = () => openLibrary(el, "before");
    $("#sAddDown").onclick = () => openLibrary(el, "after");
    $("#sUp").onclick = () => moveUnit(el, -1);
    $("#sDown").onclick = () => moveUnit(el, 1);
    $("#sDup").onclick = () => { const c = el.cloneNode(true); c.classList.remove("pse-sec-sel", "pse-sec-hover"); el.after(c); syncPage(); toast("Section duplicated"); };
    $("#sDel").onclick = async () => { if (await confirmBox("Delete this section?", "It will be removed from this page. You can still discard your changes before publishing.", "Delete", "danger")) { el.remove(); sel = null; syncPage(); renderInspector(); } };
  }
  if (item) {
    $("#iUp").onclick = () => { const p = item.previousElementSibling; if (p && p.tagName === item.tagName) { p.before(item); syncPage(); } };
    $("#iDown").onclick = () => { const n = item.nextElementSibling; if (n && n.tagName === item.tagName) { n.after(item); syncPage(); } };
    $("#iDup").onclick = () => { const was = sel; deselect(true); item.after(item.cloneNode(true)); syncPage(); toast("Duplicated. Click the copy to change its text."); if (was) select(was.kind, was.el); };
    $("#iDel").onclick = async () => { if (await confirmBox("Delete this item?", "It will be removed from the page.", "Delete", "danger")) { deselect(true); item.remove(); syncPage(); } };
  }
}
// move a section, stepping over locked parts as a whole
function moveUnit(el, dir) {
  const isOpen = (n) => n && n.nodeType === 8 && /^sb:/.test(n.nodeValue), isClose = (n) => n && n.nodeType === 8 && n.nodeValue === "/sb";
  const sib = (n) => (dir < 0 ? n.previousSibling : n.nextSibling);
  let x = sib(el);
  while (x && x.nodeType !== 1 && !isOpen(x) && !isClose(x)) x = sib(x);
  if (!x) return;
  if (dir > 0) { if (isOpen(x)) { while (x && !isClose(x)) x = x.nextSibling; if (x) x.after(el); } else x.after(el); }
  else { if (isClose(x)) { while (x && !isOpen(x)) x = x.previousSibling; if (x) x.before(el); } else x.before(el); }
  syncPage();
  el.scrollIntoView({ block: "center", behavior: "smooth" });
}
function setImage(name) {
  if (!sel || sel.kind !== "image") return;
  sel.el.setAttribute("src", name.startsWith("/") ? name : "/api/draft-image/" + name);
  sel.el.removeAttribute("srcset"); sel.el.removeAttribute("sizes");
  syncPage(); renderInspector(); toast("Photo changed");
}
function embedUrl(u) {
  let m = u.match(/(?:youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/|live\/)|youtu\.be\/)([\w-]{11})/);
  if (m) return `https://www.youtube-nocookie.com/embed/${m[1]}`;
  m = u.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  return m ? `https://player.vimeo.com/video/${m[1]}` : null;
}
function watchUrl(u) {
  let m = u.match(/embed\/([\w-]{11})/); if (m) return `https://www.youtube.com/watch?v=${m[1]}`;
  m = u.match(/player\.vimeo\.com\/video\/(\d+)/); return m ? `https://vimeo.com/${m[1]}` : u;
}

/* ---------------- add section library ---------------- */
function openLibrary(ref, where) {
  const bg = document.createElement("div");
  bg.className = "modal-bg";
  bg.innerHTML = `<div class="modal wide"><div class="mh">Add a section<span class="sp"></span><button class="mini" data-x>✕</button></div>
    <div class="mb"><p class="hint" style="margin-top:0">Pick a design. It is added ${where === "before" ? "above" : "below"} the section you chose, and you can change every word, photo and colour after.</p>
    <div class="slib">${SECTIONS.map((t) => `<button class="scard" data-id="${t.id}">${THUMBS[t.thumb] || ""}<b>${esc(t.name)}</b><span>${esc(t.desc)}</span></button>`).join("")}</div></div></div>`;
  const close = () => bg.remove();
  bg.addEventListener("mousedown", (e) => { if (e.target === bg) close(); });
  bg.querySelector("[data-x]").onclick = close;
  bg.querySelectorAll(".scard").forEach((b) => (b.onclick = () => { close(); insertSection(ref, where, SECTIONS.find((t) => t.id === b.dataset.id)); }));
  document.body.appendChild(bg);
}
function insertSection(ref, where, tpl) {
  if (!tpl || !fdoc) return;
  const t = fdoc.createElement("template"); t.innerHTML = tpl.html.trim();
  const node = t.content.firstElementChild;
  let anchor = ref;
  if (ref.dataset.pseBlock) {
    if (where === "after") { let x = ref; while (x && !(x.nodeType === 8 && x.nodeValue === "/sb")) x = x.nextSibling; if (x) anchor = x; }
    else { let x = ref; while (x && !(x.nodeType === 8 && /^sb:/.test(x.nodeValue))) x = x.previousSibling; if (x) anchor = x; }
  }
  if (where === "before") anchor.before(node); else anchor.after(node);
  syncPage();
  node.scrollIntoView({ block: "center", behavior: "smooth" });
  select("section", node);
  toast(`“${tpl.name}” added. Click any text or photo in it to change it.`);
}

/* ---------------- uploads ---------------- */
async function compress(f) {
  if (f.type === "image/svg+xml" || f.type === "image/gif") return { data: await readData(f), ext: f.type === "image/svg+xml" ? "svg" : "gif" };
  const bmp = await createImageBitmap(f); const sc = Math.min(1, 1920 / bmp.width);
  const c = document.createElement("canvas"); c.width = Math.round(bmp.width * sc); c.height = Math.round(bmp.height * sc);
  c.getContext("2d").drawImage(bmp, 0, 0, c.width, c.height);
  const data = c.toDataURL("image/webp", 0.8);
  return data.startsWith("data:image/webp") ? { data, ext: "webp" } : { data: c.toDataURL("image/jpeg", 0.82), ext: "jpg" };
}
const readData = (f) => new Promise((r) => { const fr = new FileReader(); fr.onload = () => r(fr.result); fr.readAsDataURL(f); });
function pickImage(cb) { pickCb = cb; $("#fileIn").value = ""; $("#fileIn").click(); }
$("#fileIn").addEventListener("change", async () => {
  const f = $("#fileIn").files[0]; if (!f || !pickCb) return;
  if (f.size > 25e6) return toast("That photo is too large. Please choose one under 25 MB.", true);
  loading(true); toast("Uploading photo…");
  try { const { data, ext } = await compress(f); const j = await api("uploadImage", { name: f.name, ext, data }); draft.images.push(j.file); pickCb(j.file); }
  catch (e) { toast(e.message, true); }
  loading(false);
});
function pickVideo(cb) {
  const inp = document.createElement("input"); inp.type = "file"; inp.accept = "video/mp4,video/webm";
  inp.onchange = async () => {
    const f = inp.files[0]; if (!f) return;
    if (f.size > 4e6) return toast("That video is over 4 MB. Please upload it to YouTube and paste the link instead.", true);
    loading(true); toast("Uploading video…");
    try { const j = await api("uploadImage", { name: f.name, ext: /webm/.test(f.type) ? "webm" : "mp4", data: await readData(f) }); draft.images.push(j.file); cb(j.file); }
    catch (e) { toast(e.message, true); }
    loading(false);
  };
  inp.click();
}

/* ---------------- left panel ---------------- */
document.querySelectorAll("#tabs button").forEach((b) => (b.onclick = () => { tab = b.dataset.tab; document.querySelectorAll("#tabs button").forEach((x) => x.classList.toggle("on", x === b)); renderPanel(); }));
const openGroups = new Set(["main"]);
const pageItem = (p, l, gear = true) => `<li data-p="${esc(p)}" class="${norm(p) === path ? "on" : ""}"><span class="t">${esc(l)}</span><span class="chg hidden"></span>${gear ? `<button class="gear" data-set="${esc(p)}" title="Settings">⚙</button>` : ""}</li>`;
function group(id, title, items, extra = "") {
  const open = openGroups.has(id) || items.some(([p]) => norm(p) === path);
  if (open) openGroups.add(id);
  return `<details class="pgrp" data-g="${id}" ${open ? "open" : ""}><summary>${esc(title)}<span class="cnt">${items.length}</span></summary>${extra}<ul class="plist">${items.map(([p, l, g]) => pageItem(p, l, g !== false)).join("") || '<li class="hint">Nothing yet</li>'}</ul></details>`;
}
function renderPanel() {
  const p = $("#panel");
  if (tab === "pages") {
    const byDate = (k) => draft.posts.filter((x) => (x.kind || "post") === k).sort((a, b) => String(b.date).localeCompare(String(a.date))).map((x) => [postPath(x), x.title]);
    const known = new Set([...EDITABLE.keys(), ...draft.posts.map(postPath)]);
    const services = sitemapPaths.filter((s) => /^\/[a-z0-9-]+\/$/.test(s) && !known.has(s)).sort().map((s) => [s, label(s), false]);
    const areas = sitemapPaths.filter((s) => /^\/[a-z0-9-]+\/[a-z0-9-]+\/$/.test(s) && !known.has(s) && !s.startsWith("/blog/")).sort().map((s) => [s, label(s), false]);
    p.innerHTML = `<div style="display:grid;gap:8px;margin-bottom:10px"><button class="btn primary sm full" id="newPost">+ New blog post</button><button class="btn sm full" id="newCase">+ New case study</button></div>`
      + group("main", "Main pages", MAIN_PAGES) + group("posts", "Blog posts", byDate("post")) + group("cases", "Case studies", byDate("case"))
      + group("legal", "Legal pages", LEGAL_PAGES)
      + group("view", "Other pages (view only)", services)
      + group("areas", "Area pages (view only)", areas, `<input class="inp search" id="areaSearch" placeholder="Search areas">`);
  }
  if (tab === "design") {
    p.innerHTML = `<p class="hint">Website colours for every page. Changes show straight away in the preview.</p>`
      + THEME_VARS.map(([v, l, d]) => colorField(l, (draft.site.theme || {})[v] || d, "th" + v.replace(/-/g, "_"), "thr" + v.replace(/-/g, "_"))).join("")
      + `<button class="btn sm full" id="themeReset" style="margin-top:10px">↺ Back to the original colours</button>`;
  }
  if (tab === "settings") {
    p.innerHTML = `<p class="hint">Business details (phone, email, hours, social links) come from your Supabase settings, so they are changed there.</p>
      <p class="hint">Each page's Google title, description and share photo: click ⚙ next to the page in Pages.</p>
      <div class="grp">Undo</div><button class="btn sm full danger" id="discardAll">Discard all unpublished changes</button>`;
  }
  bindPanel(); updateStatus();
}
function bindPanel() {
  const p = $("#panel");
  p.querySelectorAll(".plist li[data-p]").forEach((li) => (li.onclick = (e) => { if (e.target.closest("[data-set]")) return; showPage(li.dataset.p); }));
  p.querySelectorAll("details.pgrp").forEach((d) => d.addEventListener("toggle", () => { if (d.open) openGroups.add(d.dataset.g); else openGroups.delete(d.dataset.g); }));
  p.querySelectorAll("[data-set]").forEach((b) => (b.onclick = () => { const i = info(b.dataset.set); if (i.slug) postSettings(i.slug); else pageSettings(norm(b.dataset.set)); }));
  if ($("#newPost")) $("#newPost").onclick = () => newPost("post");
  if ($("#newCase")) $("#newCase").onclick = () => newPost("case");
  if ($("#areaSearch")) $("#areaSearch").oninput = (e) => { const q = e.target.value.toLowerCase(); e.target.parentElement.querySelectorAll("li[data-p]").forEach((li) => li.classList.toggle("hidden", !li.textContent.toLowerCase().includes(q))); };
  THEME_VARS.forEach(([v]) => {
    const id = "th" + v.replace(/-/g, "_");
    if (!$("#" + id)) return;
    bindColor(id, (val) => { draft.site.theme = { ...draft.site.theme, [v]: val }; applyTheme(); changed(); });
    $("#thr" + v.replace(/-/g, "_")).onclick = () => { const t = { ...draft.site.theme }; delete t[v]; draft.site.theme = t; changed({ rerender: true, panel: true }); };
  });
  if ($("#themeReset")) $("#themeReset").onclick = () => { draft.site.theme = {}; changed({ rerender: true, panel: true }); };
  if ($("#discardAll")) $("#discardAll").onclick = discardAll;
}
function applyTheme() {
  if (!fdoc) return;
  let s = fdoc.getElementById("ed-theme-live");
  if (!s) { s = fdoc.createElement("style"); s.id = "ed-theme-live"; fdoc.head.appendChild(s); }
  s.textContent = O.themeCss(draft.site.theme);
}

/* ---------------- page settings ---------------- */
const shareOptions = (cur) => `<option value="">Automatic</option>` + [...draft.images.filter((n) => !/\.(mp4|webm)$/.test(n)), ...repoImages].map((n) => `<option value="${esc(n)}" ${cur === n ? "selected" : ""}>${esc(n.split("/").pop())}</option>`).join("");
async function pageSettings(p) {
  const i = info(p);
  if (i.type === "view") return toast("This page comes from Supabase, so its settings are changed there.");
  const m = draft.pages[i.key] || {}, seo = m.seo || {};
  const r = await modal(`Page settings: ${esc(label(p))}`, `
    <p class="hint">How this page appears on Google and when shared. Leave empty to keep what it has now.</p>
    <label class="field"><span>Google title</span><input class="inp" name="title" value="${esc(seo.title)}" placeholder="Keep the current title"></label>
    <label class="field"><span>Google description</span><textarea class="inp" name="desc" rows="3" placeholder="Keep the current description">${esc(seo.desc)}</textarea></label>
    <label class="field"><span>Photo for link previews</span><select class="inp" name="ogImage">${shareOptions(seo.ogImage)}</select></label>
    <label class="row"><input type="checkbox" name="noindex" ${seo.noindex ? "checked" : ""}> Hide this page from Google</label>
    <p class="hint" style="margin-top:12px"><a href="#" id="revertPage">Undo all unpublished changes on this page</a></p>`,
    [{ label: "Cancel", value: false }, { label: "Save", cls: "primary", collect: true }],
    { onOpen: (bg) => (bg.querySelector("#revertPage").onclick = (e) => { e.preventDefault(); bg.remove(); revertPage(i.key); }) });
  if (!r) return;
  const n = {}; if (r.title.trim()) n.title = r.title.trim(); if (r.desc.trim()) n.desc = r.desc.trim(); if (r.ogImage) n.ogImage = r.ogImage; if (r.noindex) n.noindex = true;
  draft.pages[i.key] = { ...m, path: p, seo: n, updatedAt: new Date().toISOString() };
  changed(); toast("Page settings saved");
}
function revertPage(key) {
  if (live.pages[key]) draft.pages[key] = clone(live.pages[key]); else delete draft.pages[key];
  if (key in live.html) draft.html[key] = live.html[key]; else delete draft.html[key];
  changed({ rerender: true }); toast("This page is back to the published version");
}

/* ---------------- blog posts and case studies ---------------- */
const today = () => new Date().toISOString().slice(0, 10);
const slugify = (s) => s.toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 70).replace(/-$/, "");
const imgOptions = () => [...draft.images.filter((n) => !/\.(mp4|webm)$/.test(n)).map((n) => ({ n, src: "/api/draft-image/" + n })), ...repoImages.map((n) => ({ n, src: n }))];
const STARTER = {
  post: `<p>Write a short introduction here: what this post helps with and who it is for.</p>\n<h2>First heading</h2>\n<p>Write your first paragraph here. Click any text to change it, and use Duplicate in the right panel to add more paragraphs or headings.</p>`,
  case: `<h2>The job</h2>\n<p>Who the client was, the property, and what they needed.</p>\n<div class="cs-ba"><figure><img src="/images/services/builders.jpg" alt="Before"><figcaption>Before</figcaption></figure><figure><img src="/images/services/deep.jpg" alt="After"><figcaption>After</figcaption></figure></div>\n<h2>What we did</h2>\n<p>How long it took, how many cleaners, and the main tasks.</p>\n<h2>The result</h2>\n<p>How the property looked at the end and what the client said.</p>\n<blockquote>Client's words, copied from their review or message.</blockquote>`
};
async function newPost(kind) {
  const isCase = kind === "case";
  const r = await modal(isCase ? "New case study" : "New blog post", `
    <label class="field"><span>Title</span><input class="inp" name="title" placeholder="${isCase ? "e.g. End of tenancy clean of a 3 bed house in Romford" : "e.g. How often should you deep clean your oven?"}"></label>
    ${isCase ? `<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px"><label class="field"><span>Service</span><input class="inp" name="service" placeholder="e.g. End of tenancy"></label><label class="field"><span>Area</span><input class="inp" name="area" placeholder="e.g. Romford"></label></div>` : ""}
    <p class="hint">It opens straight away so you can write it on the page. Add the cover photo and summary in its settings.</p>`,
    [{ label: "Cancel", value: false }, { label: "Create", cls: "primary", collect: true }]);
  if (!r || !r.title.trim()) return;
  const title = r.title.trim();
  let slug = slugify(title), k = 2;
  const taken = (s) => draft.posts.some((x) => x.slug === s) || sitemapPaths.some((p) => p === `/blog/${s}/` || p === `/${s}/` || p === `/case-studies/${s}/`) || s === "_template";
  while (taken(slug)) slug = slugify(title).slice(0, 66) + "-" + k++;
  draft.posts.push({ kind, slug, title, excerpt: "", date: today(), updated: today(), cover: isCase ? "/images/services/deep.jpg" : "/images/hero-living-room.jpg", ...(isCase ? { service: r.service.trim(), area: r.area.trim() } : {}) });
  draft.bodies[slug] = STARTER[kind];
  openGroups.add(isCase ? "cases" : "posts");
  changed({ panel: true });
  await showPage(isCase ? `/case-studies/${slug}/` : `/blog/${slug}/`);
  toast("Created. Click the text to write it, then add a cover photo and summary in its settings.");
}
async function postSettings(slug) {
  const m = draft.posts.find((x) => x.slug === slug);
  if (!m) return;
  const isCase = m.kind === "case";
  const r = await modal(isCase ? "Case study settings" : "Post settings", `
    <label class="field"><span>Title</span><input class="inp" name="title" value="${esc(m.title)}"></label>
    ${isCase ? `<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px"><label class="field"><span>Service</span><input class="inp" name="service" value="${esc(m.service)}"></label><label class="field"><span>Area</span><input class="inp" name="area" value="${esc(m.area)}"></label></div>` : ""}
    <label class="field"><span>Date</span><input class="inp" type="date" name="date" value="${esc(m.date || today())}"></label>
    <label class="field"><span>Short summary (shown on the cards and on Google)</span><textarea class="inp" name="excerpt" rows="2">${esc(m.excerpt)}</textarea></label>
    <div class="field"><span>Cover photo</span><input type="hidden" name="cover" value="${esc(m.cover)}">
      <div style="display:flex;align-items:center;gap:12px;margin:6px 0"><img id="pcPrev" src="${esc(imgUrl(m.cover || ""))}" alt="" style="width:120px;aspect-ratio:3/2;object-fit:cover;border-radius:8px"><button class="btn sm" id="pcUp" type="button">⬆ Upload new photo</button></div>
      <div class="lib" id="pcLib" style="max-height:170px;grid-template-columns:repeat(6,1fr)">${imgOptions().map((i) => `<img src="${i.src}" data-n="${esc(i.n)}" loading="lazy">`).join("")}</div></div>
    <p class="hint" style="margin-top:14px">How it appears on Google. Leave empty to use the title and summary.</p>
    <label class="field"><span>Google title</span><input class="inp" name="metaTitle" value="${esc(m.metaTitle)}"></label>
    <label class="field"><span>Google description</span><textarea class="inp" name="metaDesc" rows="2">${esc(m.metaDesc)}</textarea></label>
    <label class="row"><input type="checkbox" name="noindex" ${m.noindex ? "checked" : ""}> Hide from Google</label>
    <p class="hint" style="margin-top:12px"><a href="#" id="delPost" style="color:#b3261e">Delete this ${isCase ? "case study" : "post"}</a></p>`,
    [{ label: "Cancel", value: false }, { label: "Save", cls: "primary", collect: true }],
    { wide: false, onOpen: (bg) => {
      bg.querySelector(".modal").style.width = "min(620px,96vw)";
      const setImg = (n) => { bg.querySelector('[name="cover"]').value = n; bg.querySelector("#pcPrev").src = imgUrl(n); };
      bg.querySelector("#pcLib").onclick = (e) => { const t = e.target.closest("img[data-n]"); if (t) setImg(t.dataset.n); };
      bg.querySelector("#pcUp").onclick = () => pickImage((n) => setImg(n));
      bg.querySelector("#delPost").onclick = async (e) => {
        e.preventDefault(); bg.remove();
        if (!(await confirmBox(`Delete this ${isCase ? "case study" : "post"}?`, "It will be removed from the website when you publish.", "Delete", "danger"))) return;
        draft.posts = draft.posts.filter((x) => x.slug !== slug); delete draft.bodies[slug];
        changed({ panel: true }); showPage(isCase ? "/" : "/blog/"); toast("Deleted");
      };
    } });
  if (!r) return;
  Object.assign(m, { title: r.title.trim() || m.title, date: r.date || m.date, excerpt: r.excerpt.trim(), cover: r.cover || m.cover, metaTitle: r.metaTitle.trim(), metaDesc: r.metaDesc.trim(), noindex: !!r.noindex, updated: today() });
  if (isCase) Object.assign(m, { service: r.service.trim(), area: r.area.trim() });
  if (!m.noindex) delete m.noindex; if (!m.metaTitle) delete m.metaTitle; if (!m.metaDesc) delete m.metaDesc;
  changed({ rerender: true, panel: true }); toast("Settings saved");
}

/* ---------------- publish ---------------- */
async function publish() {
  syncText();
  const list = changeList();
  if (!list.length && !unsaved) return toast("Everything is already published");
  const noSummary = draft.posts.filter((x) => !x.excerpt);
  const ok = await modal("Publish your changes?", `<p>These changes will go live on <b>sncleaningservices.co.uk</b>:</p><ul>${list.map((c) => `<li>${esc(c.text)}</li>`).join("")}</ul>${noSummary.length ? `<p class="hint">Tip: ${noSummary.map((x) => "“" + esc(x.title) + "”").join(", ")} has no short summary yet. Add one in its settings for Google.</p>` : ""}<p class="hint">The website rebuilds after publishing. Changes are live in about 3 to 5 minutes.</p>`, [{ label: "Not yet", value: false }, { label: "Publish", cls: "gold" }]);
  if (!ok) return;
  loading(true);
  const b = $("#publishBtn"); b.disabled = true;
  try {
    unsaved = true; await saveNow();
    if (unsaved) throw new Error("Could not save your changes first");
    await api("publish", { message: "Update website from editor: " + list.map((c) => c.text).join(", ").slice(0, 200) });
    live = clone({ site: draft.site, pages: draft.pages, html: draft.html, posts: draft.posts, bodies: draft.bodies });
    draft.base = baseOf(live);
    liveCache.clear();
    toast("Published! The website is live with your changes in about 3 to 5 minutes.");
  } catch (e) { toast(e.message, true); }
  b.disabled = false; loading(false); updateStatus();
}
$("#publishBtn").onclick = publish;
async function discardAll() {
  if (!(await confirmBox("Discard all unpublished changes?", "Everything goes back to what is live on the website now. This cannot be undone.", "Discard", "danger"))) return;
  loading(true);
  try {
    await api("discardDraft");
    try { localStorage.removeItem(LS); } catch {}
    draft = { ...clone(live), images: [], base: baseOf(live) }; unsaved = false;
    renderPanel(); await showPage(info(path).slug && !live.posts.some((x) => x.slug === info(path).slug) ? "/" : path); updateStatus();
    toast("Changes discarded");
  } catch (e) { toast(e.message, true); }
  loading(false);
}
