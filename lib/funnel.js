/**
 * Shared code for the ad landing funnels (/go/...), the lead store and Meta.
 *
 * Storage: Netlify Blobs (built into Netlify, nothing extra to set up).
 *   store "funnel-leads"    one record per lead, key = lead id
 *   store "funnel-settings" key "settings" = pixels, tokens and page settings
 *
 * Meta access tokens live only in the settings store. They are never sent to
 * the browser; the settings page only ever shows the last 4 characters.
 */

const crypto = require("crypto");
const { getStore, connectLambda } = require("@netlify/blobs");

const GRAPH_VERSION = process.env.META_GRAPH_VERSION || "v24.0";
const COOKIE = "sn_applicants"; // same login as the applicants dashboard

function stores(event) {
  if (event && event.blobs) connectLambda(event);
  return {
    leads: getStore({ name: "funnel-leads", consistency: "strong" }),
    settings: getStore({ name: "funnel-settings", consistency: "strong" })
  };
}

// Booking forms are on our own subdomain now (Dilvon custom domain).
const BOOKING_BASE = "https://app.sncleaningservices.co.uk/book/sn-cleaning-services";
const OLD_BOOKING_BASE = "https://app.dilvon.com/book/sn-cleaning-services";

const DEFAULT_SETTINGS = {
  pixels: [],          // { key, name, pixelId, token, testCode }
  pages: {             // slug -> { pixel: key of a pixel, bookingBase }
    domestic: { pixel: "", bookingBase: BOOKING_BASE }
  }
};

async function getSettings(st) {
  const s = (await st.settings.get("settings", { type: "json" })) || {};
  const pages = Object.assign({}, DEFAULT_SETTINGS.pages, s.pages || {});
  Object.values(pages).forEach((pg) => { if (!pg.bookingBase || pg.bookingBase === OLD_BOOKING_BASE) pg.bookingBase = BOOKING_BASE; });
  return {
    pixels: Array.isArray(s.pixels) ? s.pixels : [],
    pages
  };
}

async function saveSettings(st, s) {
  await st.settings.setJSON("settings", s);
}

function pixelForPage(settings, slug) {
  const page = settings.pages[slug] || {};
  return settings.pixels.find((p) => p.key === page.pixel) || null;
}

function newId(prefix) {
  return prefix + Date.now().toString(36) + crypto.randomBytes(3).toString("hex");
}

/* ---------- Meta Conversions API ---------- */

const sha = (v) => crypto.createHash("sha256").update(v).digest("hex");

function normPhone(p) {
  let d = String(p || "").replace(/\D/g, "");
  if (!d) return "";
  if (d.indexOf("00") === 0) d = d.slice(2);
  if (d.indexOf("0") === 0) d = "44" + d.slice(1); // UK numbers typed as 07...
  return d;
}

function userData(lead) {
  const u = {};
  const email = String(lead.email || "").trim().toLowerCase();
  const phone = normPhone(lead.phone);
  const fn = String(lead.firstName || "").trim().toLowerCase();
  if (email) u.em = [sha(email)];
  if (phone) u.ph = [sha(phone)];
  if (fn) u.fn = [sha(fn)];
  u.country = [sha("gb")];
  u.external_id = [sha(lead.id)];
  if (lead.ip) u.client_ip_address = lead.ip;
  if (lead.userAgent) u.client_user_agent = lead.userAgent;
  if (lead.fbc) u.fbc = lead.fbc;
  if (lead.fbp) u.fbp = lead.fbp;
  return u;
}

/**
 * Send one event to Meta. Returns a log entry that is stored on the lead.
 * Only called when the visitor accepted cookies.
 */
async function sendToMeta(pixel, lead, ev) {
  const entry = {
    at: new Date().toISOString(),
    event: ev.name,
    eventId: ev.id,
    pixelId: pixel ? pixel.pixelId : "",
    channel: "CAPI",
    ok: false,
    response: ""
  };
  if (!pixel || !pixel.pixelId || !pixel.token) {
    entry.response = "Not sent: no pixel and token set for this page";
    return entry;
  }
  const body = {
    data: [{
      event_name: ev.name,
      event_time: Math.floor(Date.now() / 1000),
      event_id: ev.id,
      action_source: ev.actionSource || "website",
      user_data: userData(lead),
      custom_data: ev.custom || {}
    }]
  };
  if ((ev.actionSource || "website") === "website") {
    body.data[0].event_source_url = lead.pageUrl || "https://sncleaningservices.co.uk/go/" + lead.page + "/";
  }
  if (pixel.testCode) body.test_event_code = pixel.testCode;
  try {
    const res = await fetch(
      "https://graph.facebook.com/" + GRAPH_VERSION + "/" + encodeURIComponent(pixel.pixelId) +
        "/events?access_token=" + encodeURIComponent(pixel.token),
      { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) }
    );
    const text = await res.text();
    entry.ok = res.ok;
    entry.response = text.slice(0, 400);
  } catch (err) {
    entry.response = "Error: " + String(err.message || err).slice(0, 300);
  }
  return entry;
}

/* Hand a finished lead to Dilvon, so the booking app knows who they are when
   they arrive (matched by ref = our lead ID). Key: DILVON_LEAD_KEY in Netlify. */
async function sendToDilvon(lead) {
  const key = process.env.DILVON_LEAD_KEY;
  const out = { at: new Date().toISOString(), ok: false, response: "" };
  if (!key) { out.response = "Not sent: DILVON_LEAD_KEY is not set"; return out; }
  const t = Object.assign({}, lead.first || {}, lead.last || {});
  const body = {
    ref: lead.id,
    first_name: lead.firstName || "", last_name: "",
    email: lead.email || "", phone: lead.phone || "", postcode: lead.postcode || "",
    fbp: lead.fbp || "", fbc: lead.fbc || "",
    fbclid: t.fbclid || "", gclid: t.gclid || "",
    utm_source: t.utm_source || "", utm_campaign: t.utm_campaign || "",
    utm_content: t.utm_content || "", utm_term: t.utm_term || "",
    campaign_id: t.campaign_id || "", adset_id: t.adset_id || "", ad_id: t.ad_id || "",
    page_url: lead.pageUrl || "",
    client_ip: lead.ip || "", user_agent: lead.userAgent || ""
  };
  try {
    const res = await fetch("https://auth.dilvon.com/functions/v1/receive-external-lead", {
      method: "POST",
      headers: { "content-type": "application/json", "X-Dilvon-Key": key },
      body: JSON.stringify(body)
    });
    out.ok = res.ok;
    out.response = (res.status + " " + (await res.text())).slice(0, 300);
  } catch (err) {
    out.response = "Error: " + String(err.message || err).slice(0, 200);
  }
  return out;
}

/* ---------- helpers for pages ---------- */

function token(pw) {
  return crypto.createHash("sha256").update("sn-applicants:" + pw).digest("hex");
}

function isAuthed(event) {
  const pw = process.env.DASHBOARD_PASSWORD;
  if (!pw) return false;
  const cookies = (event.headers && event.headers.cookie) || "";
  return cookies.split(";").some((c) => c.trim() === COOKIE + "=" + token(pw));
}

function loginCookie() {
  return COOKIE + "=" + token(process.env.DASHBOARD_PASSWORD) +
    "; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=604800";
}

function esc(v) {
  return String(v == null ? "" : v)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

function clientIp(event) {
  const h = event.headers || {};
  return h["x-nf-client-connection-ip"] || (h["x-forwarded-for"] || "").split(",")[0].trim() || "";
}

module.exports = {
  stores, getSettings, saveSettings, pixelForPage, newId,
  sendToMeta, sendToDilvon, isAuthed, loginCookie, esc, clientIp
};
