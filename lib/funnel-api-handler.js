/**
 * Public endpoint used by the landing funnels at /go/<page>/
 *
 *   GET  /api/funnel?action=config&page=domestic   -> pixel ID + booking link base
 *   POST /api/funnel  {action:"lead", ...}          -> save the lead, send Lead to Meta
 *   POST /api/funnel  {action:"event", ...}         -> log a click (WhatsApp, phone,
 *                                                     booking form, call back)
 *
 * Meta is only told anything when the visitor pressed Accept on the cookie
 * banner. Tokens never leave the server.
 */

const F = require("./funnel");

const json = (code, obj) => ({
  statusCode: code,
  headers: { "content-type": "application/json", "cache-control": "no-store" },
  body: JSON.stringify(obj)
});

const clean = (v, n) => String(v == null ? "" : v).trim().slice(0, n || 200);

function cleanTouch(t) {
  t = t || {};
  const out = {};
  ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term", "fbclid", "gclid",
    "campaign_id", "adset_id", "ad_id",
    "landing", "referrer", "at"].forEach((k) => { if (t[k]) out[k] = clean(t[k], 500); });
  return out;
}

const EVENT_TYPES = {
  booking_click: { label: "Booking form", meta: "BookingClick" },
  whatsapp_click: { label: "WhatsApp", meta: "Contact" },
  phone_click: { label: "Phone call", meta: "Contact" },
  callback_request: { label: "Call back request", meta: "Contact" }
};

exports.handler = async (event) => {
  const st = F.stores(event);

  if (event.httpMethod === "GET") {
    const q = event.queryStringParameters || {};
    // Read-only check of recent leads and their Dilvon status (header x-status-key = STATUS_KEY env var)
    if (q.action === "status") {
      const key = process.env.STATUS_KEY;
      if (!key || (event.headers || {})["x-status-key"] !== key) return json(403, { error: "forbidden" });
      const { blobs } = await st.leads.list();
      const rows = (await Promise.all(blobs.map((x) => st.leads.get(x.key, { type: "json" })))).filter(Boolean)
        .sort((x, y) => (y.createdAt || "").localeCompare(x.createdAt || "")).slice(0, Number(q.limit) || 30);
      return json(200, rows.map((l) => ({ id: l.id, name: l.firstName, createdAt: l.createdAt, source: l.source || "landing_page",
        partial: !!l.partial, status: l.status, dilvonOk: !!(l.dilvon && l.dilvon.ok), dilvon: l.dilvon ? l.dilvon.response : "not sent" })));
    }
    if (q.action === "config") {
      const settings = await F.getSettings(st);
      const page = settings.pages[q.page] || {};
      const pixel = F.pixelForPage(settings, q.page);
      return json(200, {
        pixelId: pixel ? pixel.pixelId : "",
        bookingBase: page.bookingBase || "https://app.sncleaningservices.co.uk/book/sn-cleaning-services"
      });
    }
    return json(400, { ok: false });
  }

  if (event.httpMethod !== "POST") return json(405, { ok: false });

  let b;
  try { b = JSON.parse(event.body || "{}"); } catch (e) { return json(400, { ok: false }); }
  if (b.website) return json(200, { ok: true }); // honeypot filled in: a bot

  const consent = b.consent === "accepted" ? "accepted" : (b.consent === "rejected" ? "rejected" : "unknown");

  // "partial": they have typed something into name / email / phone but not pressed
  // Next yet. Saved straight away so drop-offs are not lost. Meta is NOT told.
  // "lead": they pressed Next with valid details. This is the real Lead.
  if (b.action === "lead" || b.action === "partial") {
    const full = b.action === "lead";
    const email = clean(b.email, 200);
    const phone = clean(b.phone, 40);
    const firstName = clean(b.firstName, 80);
    const postcode = clean(b.postcode, 12).toUpperCase();
    if (full && (!firstName || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email) || phone.replace(/\D/g, "").length < 9)) {
      return json(400, { ok: false, error: "Please check your name, email and phone number." });
    }
    if (!full && !firstName && !email && !phone && !postcode) return json(200, { ok: true });
    const page = clean(b.page, 40).replace(/[^a-z0-9-]/g, "") || "domestic";
    const now = new Date().toISOString();

    // Same visitor typing more or pressing Next again: update, don't duplicate.
    let lead = null;
    if (b.leadId && /^L[a-z0-9]+$/.test(b.leadId)) {
      lead = await st.leads.get(b.leadId, { type: "json" });
    }
    const isNew = !lead;
    if (isNew) {
      lead = {
        id: F.newId("L"),
        page,
        createdAt: now,
        status: "New",
        value: "",
        notes: "",
        partial: true,
        journey: [{ at: now, type: "started", detail: "Started typing their details" }],
        meta: [],
        purchaseSent: false
      };
    }
    // A lead that already finished stays finished if a late "partial" save arrives.
    if (!full && lead.partial !== true) return json(200, { ok: true, leadId: lead.id });

    const needsLeadEvent = full && lead.partial === true;
    Object.assign(lead, {
      updatedAt: now,
      firstName, email, phone, postcode,
      answers: typeof b.answers === "object" && b.answers ? Object.fromEntries(
        Object.entries(b.answers).slice(0, 20).map(([k, v]) => [clean(k, 60), clean(Array.isArray(v) ? v.join(", ") : v, 300)])
      ) : (lead.answers || {}),
      first: (lead.first && Object.keys(lead.first).length) ? lead.first : cleanTouch(b.first),
      last: cleanTouch(b.last),
      visitorId: clean(b.visitorId, 60),
      consent,
      fbc: consent === "accepted" ? clean(b.fbc, 300) : "",
      fbp: consent === "accepted" ? clean(b.fbp, 120) : "",
      pageUrl: clean(b.pageUrl, 500),
      ip: F.clientIp(event),
      userAgent: clean((event.headers || {})["user-agent"], 400)
    });

    if (needsLeadEvent) {
      lead.partial = false;
      lead.completedAt = now;
      lead.pixelBrowser = !!b.pixelFired;
      lead.journey.push({ at: now, type: "lead", detail: "Details submitted" });
      // Same ID as the browser pixel and as Dilvon uses (lead_<ref>), so Meta counts this person once.
      lead.leadEventId = "lead_" + lead.id;
      if (consent === "accepted") {
        const settings = await F.getSettings(st);
        const log = await F.sendToMeta(F.pixelForPage(settings, page), lead, {
          name: "Lead", id: lead.leadEventId, custom: { content_name: page }
        });
        log.pixelBrowser = lead.pixelBrowser;
        lead.meta.push(log);
      } else {
        lead.meta.push({ at: now, event: "Lead", eventId: lead.leadEventId, channel: "CAPI", ok: false,
          response: "Not sent: visitor did not accept cookies" });
      }
    }
    if (needsLeadEvent) lead.dilvon = await F.sendToDilvon(lead);
    await st.leads.setJSON(lead.id, lead);
    return json(200, { ok: true, leadId: lead.id, completed: lead.partial !== true });
  }

  if (b.action === "event") {
    const type = EVENT_TYPES[b.type] ? b.type : null;
    if (!type || !/^L[a-z0-9]+$/.test(b.leadId || "")) return json(400, { ok: false });
    const lead = await st.leads.get(b.leadId, { type: "json" });
    if (!lead) return json(404, { ok: false });
    const now = new Date().toISOString();
    const detail = EVENT_TYPES[type].label + (b.detail ? ": " + clean(b.detail, 120) : "");
    lead.journey = lead.journey || [];
    lead.journey.push({ at: now, type, detail });
    lead.updatedAt = now;
    const eventId = clean(b.eventId, 80) || F.newId(type + "-");
    if (lead.consent === "accepted" && consent === "accepted") {
      const settings = await F.getSettings(st);
      const log = await F.sendToMeta(F.pixelForPage(settings, lead.page), lead, {
        name: EVENT_TYPES[type].meta, id: eventId, custom: { content_name: detail }
      });
      log.pixelBrowser = !!b.pixelFired;
      lead.meta.push(log);
    }
    await st.leads.setJSON(lead.id, lead);
    return json(200, { ok: true });
  }

  return json(400, { ok: false });
};
