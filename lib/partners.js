/**
 * Shared partner logic: stats per partner, goal progress, resources.
 *
 * Settings (funnel-settings / "settings"):
 *   partners:  [{ key, name, code, salt, hash, commission, createdAt }]
 *   resources: [{ key, title, type, url, description, createdAt }]
 *              type = image | video | booking | link | document
 *   goals:     [{ key, label, type, target, start, deadline }]
 *              type = partners | partners_clicks | partners_leads | clicks | leads | bookings
 *   partnerSync: { key }   secret Dilvon uses to tell us a partner's lead booked
 */

const F = require("./funnel");

const BOOKED = ["Booked", "Completed"];

const GOAL_TYPES = {
  partners: "Partners signed up",
  partners_clicks: "Partners bringing clicks",
  partners_leads: "Partners bringing leads",
  clicks: "Total clicks",
  leads: "Total leads",
  bookings: "Total bookings"
};

const RESOURCE_TYPES = { image: "Image", video: "Video", booking: "Booking form", link: "Link", document: "Document" };

const partnerLink = (code) => "https://sncleaningservices.co.uk/go/domestic/?utm_source=partner&utm_campaign=" + encodeURIComponent(code);

// Add the partner's tag to a link (used for booking-form links on the resources page)
function tagUrl(url, code) {
  try {
    const u = new URL(url);
    u.searchParams.set("utm_source", "partner");
    u.searchParams.set("utm_campaign", code);
    return u.toString();
  } catch (e) { return url; }
}

const isPartnerLead = (l, code) => !l.partial && F.isPartnerTouch(l.first, code);
const inWindow = (iso, from, to) => !!iso && (!from || iso >= from) && (!to || iso <= to + "T23:59:59");

// Per-partner numbers. from/to = optional ISO dates (YYYY-MM-DD) to limit the period.
function statsFor(p, leads, visits, from, to) {
  const ls = leads.filter((l) => isPartnerLead(l, p.code) && inWindow(l.createdAt, from, to));
  const vs = visits.filter((v) => F.isPartnerTouch(v, p.code) && inWindow(v.at, from, to));
  const booked = ls.filter((l) => BOOKED.includes(l.status));
  const value = booked.reduce((t, l) => t + (Number(l.value) || 0), 0);
  const rate = Number(p.commission) || 0;
  const last = [...ls.map((l) => l.createdAt), ...vs.map((v) => v.at)].sort().pop() || "";
  return { clicks: vs.length, leads: ls.length, booked: booked.length, value, commission: value * rate / 100, rate, last, leadList: ls };
}

function goalProgress(g, partners, leads, visits) {
  const from = g.start || "", to = g.deadline || "";
  const per = partners.map((p) => statsFor(p, leads, visits, from, to));
  let current = 0;
  switch (g.type) {
    case "partners": current = partners.filter((p) => !p.createdAt || p.createdAt.slice(0, 10) <= (to || "9999")).length; break;
    case "partners_clicks": current = per.filter((s) => s.clicks > 0).length; break;
    case "partners_leads": current = per.filter((s) => s.leads > 0).length; break;
    case "clicks": current = per.reduce((t, s) => t + s.clicks, 0); break;
    case "leads": current = per.reduce((t, s) => t + s.leads, 0); break;
    case "bookings": current = per.reduce((t, s) => t + s.booked, 0); break;
  }
  const target = Number(g.target) || 0;
  const pct = target ? Math.min(100, Math.round(current / target * 100)) : 0;
  const daysLeft = to ? Math.ceil((new Date(to + "T23:59:59Z") - Date.now()) / 86400000) : null;
  return { current, target, pct, daysLeft, done: target > 0 && current >= target };
}

async function allLeads(st) {
  const { blobs } = await st.leads.list();
  return (await Promise.all(blobs.map((b) => st.leads.get(b.key, { type: "json" })))).filter(Boolean);
}

async function allVisits(st) {
  const keys = [];
  let cursor;
  do { const pg = await st.visits.list(cursor ? { cursor } : {}); keys.push(...pg.blobs.map((b) => b.key)); cursor = pg.cursor; } while (cursor);
  return (await Promise.all(keys.map((k) => st.visits.get(k, { type: "json" })))).filter(Boolean);
}

module.exports = { BOOKED, GOAL_TYPES, RESOURCE_TYPES, partnerLink, tagUrl, statsFor, goalProgress, allLeads, allVisits, isPartnerLead };
