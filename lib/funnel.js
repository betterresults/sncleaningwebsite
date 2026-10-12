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
    pages,
    // Facebook instant-form leads: verify token for the webhook, Page token to read
    // the lead, app secret to check Meta signed the message, pixel for Purchase.
    leadAds: Object.assign({ appId: "1413793426935005", verifyToken: "", pageToken: "", appSecret: "", pixel: "", pages: {}, lastConnect: "" }, s.leadAds || {})
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
  if (lead.metaLeadId) u.lead_id = Number(lead.metaLeadId); // Facebook instant-form lead (Meta wants a number)
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
      event_time: ev.time ? Math.floor(new Date(ev.time).getTime() / 1000) : Math.floor(Date.now() / 1000),
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

/* How the person chose to be contacted: "WhatsApp", "Book online", "Phone" or "".
   Read from the quote-method answer (Facebook form or landing page). */
function contactMethod(lead) {
  const a = lead.answers || {};
  const key = Object.keys(a).find((k) => /quote|contact|how would you like/i.test(k));
  const v = String(key ? a[key] : "").toLowerCase();
  if (/whats\s*app/.test(v)) return "WhatsApp";
  if (/book|online/.test(v)) return "Book online";
  if (/phone|call/.test(v)) return "Phone";
  // Landing page: what they tapped at the end (booking link, WhatsApp, call / call back)
  const MAP = { booking_click: "Book online", whatsapp_click: "WhatsApp", phone_click: "Phone", callback_request: "Phone" };
  const tapped = (lead.journey || []).filter((j) => MAP[j.type]).pop();
  if (tapped) return MAP[tapped.type];
  return "";
}

/* Every step the person took, oldest first, e.g.
   [{stage:"details_submitted", at}, {stage:"whatsapp_clicked", at}] */
const STAGE = { lead: "details_submitted", booking_click: "booking_form_opened", whatsapp_click: "whatsapp_clicked",
  phone_click: "call_clicked", callback_request: "call_back_requested" };
const STAGE_TEXT = { details_submitted: "Details submitted", booking_form_opened: "Opened booking form",
  whatsapp_clicked: "Clicked WhatsApp", call_clicked: "Clicked to call", call_back_requested: "Call back requested",
  facebook_form_submitted: "Filled in Facebook form" };
function stagesOf(lead) {
  if (lead.source === "facebook_form") {
    return [{ stage: "facebook_form_submitted", at: lead.createdAt, chose: contactMethod(lead) }];
  }
  return (lead.journey || []).filter((j) => STAGE[j.type]).map((j) => ({ stage: STAGE[j.type], at: j.at }));
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
    first_name: lead.firstName || "", last_name: lead.lastName || "",
    source: lead.source || "landing_page", lead_id: lead.metaLeadId || "",
    email: lead.email || "", phone: lead.phone || "",
    // Only a real-looking UK postcode (Meta test leads send long dummy text, which Dilvon rejects)
    postcode: /^[A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2}$/i.test(String(lead.postcode || "").trim()) ? String(lead.postcode).trim().toUpperCase() : "",
    fbp: lead.fbp || "", fbc: lead.fbc || "",
    fbclid: t.fbclid || "", gclid: t.gclid || "",
    utm_source: t.utm_source || "", utm_campaign: t.utm_campaign || "",
    utm_content: t.utm_content || "", utm_term: t.utm_term || "",
    campaign_id: t.campaign_id || "", adset_id: t.adset_id || "", ad_id: t.ad_id || "",
    campaign_name: t.campaign_name || "", adset_name: t.adset_name || "", ad_name: t.ad_name || "", form_id: t.form_id || "",
    page_url: lead.pageUrl || "",
    // What they chose / answered (Facebook form questions or landing page answers)
    // Dilvon only stores "message" for free text, so the key facts go here too
    message: (() => {
      const st = stagesOf(lead);
      const fmt = (iso) => iso ? new Date(iso).toLocaleString("en-GB", { timeZone: "Europe/London", day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }) : "";
      const tidy = (v) => String(v == null ? "" : v).replace(/_/g, " ").replace(/\s+/g, " ").trim();
      const lines = [];
      lines.push("Contact method: " + (contactMethod(lead) || "Not chosen"));
      if (st.length) lines.push("Steps: " + st.map((x) => (STAGE_TEXT[x.stage] || x.stage) + (x.chose ? " (" + x.chose + ")" : "") + " " + fmt(x.at)).join(" → "));
      Object.entries(lead.answers || {}).forEach(([q, ans]) => { const qq = tidy(q); lines.push(qq.charAt(0).toUpperCase() + qq.slice(1) + (/[?:]$/.test(qq) ? " " : ": ") + tidy(ans)); });
      return lines.join("\n").slice(0, 2000);
    })(),
    contact_method: contactMethod(lead),
    stages: stagesOf(lead),
    request: (() => { const s = stagesOf(lead).pop(); return !s ? "" : STAGE_TEXT[s.stage] + (s.chose ? ", chose " + s.chose : ""); })(),
    request_at: (() => { const s = stagesOf(lead).pop(); return s ? s.at : ""; })(),
    answers: lead.answers || {},
    answers_text: Object.entries(lead.answers || {}).map(([q, a]) => q + " " + a).join("\n"),
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

function pixelForLead(settings, lead) {
  if (lead.source === "facebook_form") return settings.pixels.find((p) => p.key === settings.leadAds.pixel) || null;
  return pixelForPage(settings, lead.page);
}

module.exports = {
  GRAPH_VERSION, pixelForLead, contactMethod, stores, getSettings, saveSettings, pixelForPage, newId,
  sendToMeta, sendToDilvon, isAuthed, loginCookie, esc, clientIp
};
