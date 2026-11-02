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

// Goals for the sales team (sales representatives)
const REP_GOAL_TYPES = {
  reps: "Sales reps on the team",
  reps_active: "Sales reps who did visits",
  visits: "Total visits",
  leaflets: "Leaflets given",
  leads: "Leads from visits",
  hours: "Hours worked"
};

const RESOURCE_TYPES = { landing: "Landing page", image: "Image", video: "Video", booking: "Booking form", link: "Link", document: "Document" };

const partnerLink = (code) => "https://sncleaningservices.co.uk/go/domestic/?utm_source=partner&utm_campaign=" + encodeURIComponent(code);

// Every landing page we use (Meta settings > landing pages) shows as a resource automatically
function landingResources(s) {
  return Object.keys(s.pages || {}).sort().map((slug) => ({
    key: "auto-" + slug, auto: true, type: "landing",
    title: slug.replace(/-/g, " ").replace(/^./, (c) => c.toUpperCase()) + " landing page",
    url: "https://sncleaningservices.co.uk/go/" + slug + "/", description: ""
  }));
}
const allResources = (s) => [...landingResources(s), ...s.resources];
const isTagged = (type) => type === "booking" || type === "landing";

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
  return finishGoal(g, current);
}
function finishGoal(g, current) {
  const to = g.deadline || "";
  const target = Number(g.target) || 0;
  const pct = target ? Math.min(100, Math.round(current / target * 100)) : 0;
  const daysLeft = to ? Math.ceil((new Date(to + "T23:59:59Z") - Date.now()) / 86400000) : null;
  return { current, target, pct, daysLeft, done: target > 0 && current >= target };
}

// data = [{ rep, shifts, visits }] for every sales representative
function repGoalProgress(g, data) {
  const R = require("./reps");
  const from = g.start || "", to = g.deadline || "9999";
  const inRange = (iso) => { const d = iso ? R.londonDay(iso) : ""; return d >= from && d <= to; };
  const per = data.map((x) => ({ x, vs: x.visits.filter((v) => inRange(v.at)), sh: x.shifts.filter((v) => inRange(v.in)) }));
  let current = 0;
  switch (g.type) {
    case "reps": current = data.filter((x) => !x.rep.createdAt || x.rep.createdAt.slice(0, 10) <= to).length; break;
    case "reps_active": current = per.filter((p) => p.vs.length > 0).length; break;
    case "visits": current = per.reduce((t, p) => t + p.vs.length, 0); break;
    case "leaflets": current = per.reduce((t, p) => t + p.vs.filter((v) => v.leaflet).length, 0); break;
    case "leads": current = per.reduce((t, p) => t + p.vs.filter(R.isLead).length, 0); break;
    case "hours": current = Math.round(per.reduce((t, p) => t + p.sh.reduce((a, sh) => a + R.workedMs(sh), 0), 0) / 3600000 * 10) / 10; break;
  }
  return finishGoal(g, current);
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

// Booking forms every partner gets on their Resources page (tagged with their username)
const BOOKING_FORMS = [
  ["Choose a service", "main-landing"], ["Domestic Cleaning", "domestic-cleaning"], ["Deep Cleaning", "deep-cleaning"],
  ["End Of Tenancy Cleaning", "end-of-tenancy-cleaning"], ["After Builders Cleaning", "after-builders-cleaning"],
  ["Airbnb Cleaning", "airbnb-cleaning"], ["Carpet Cleaning", "carpet-cleaning"], ["Contact Us", "contact-us"]
];
// Adds the booking forms once. Returns true if settings changed (caller saves).
function ensureDefaults(s) {
  if (s.seeded.bookingForms) return false;
  BOOKING_FORMS.forEach(([title, slug], i) => {
    const url = "https://app.sncleaningservices.co.uk/book/sn-cleaning-services/" + slug;
    if (!s.resources.some((r) => r.url.split("?")[0] === url)) {
      s.resources.push({ key: "Rbf" + i + Date.now().toString(36), title, type: "booking", url, description: "", createdAt: new Date().toISOString() });
    }
  });
  s.seeded.bookingForms = new Date().toISOString();
  return true;
}

const PORTAL = "https://sncleaningservices.co.uk/partner";
// The message Silvia copies and sends to a partner
function inviteText(p) {
  if (!p.invite && p.email) {
    return `Hi ${p.name}, here is your SN ${p.role === "rep" ? "Cleaning Services sales representative" : "Cleaning Services partner"} login.\n\nGo to:\n${PORTAL}\n\nEmail: ${p.email}\nPassword: the one I gave you (capital letters matter)` +
      (p.role === "rep" ? "" : `\n\nYour link to share: ${partnerLink(p.code)}`);
  }
  if (p.role === "rep") return `Hi ${p.name}, here is your SN Cleaning Services sales representative account. Use it on your phone to clock in and out and to log every visit.\n\n` +
    (p.invite ? `1. Choose your password (one time only):\n${PORTAL}?invite=${p.invite}\n\n2. After that, log in at:\n${PORTAL}\n\n` : `Log in at:\n${PORTAL}\n\n`) + `Log in with your email: ${p.email || p.code}`;
  return `Hi ${p.name}, here is your SN Cleaning Services partner account.\n\n` +
    (p.invite ? `1. Choose your password (one time only):\n${PORTAL}?invite=${p.invite}\n\n2. After that, log in at:\n${PORTAL}\n\n` : `Log in at:\n${PORTAL}\n\n`) +
    `Log in with your email: ${p.email || p.code}\n\nYour link to share: ${partnerLink(p.code)}`;
}

module.exports = { landingResources, allResources, isTagged, BOOKING_FORMS, ensureDefaults, inviteText, PORTAL, BOOKED, GOAL_TYPES, REP_GOAL_TYPES, repGoalProgress, RESOURCE_TYPES, partnerLink, tagUrl, statsFor, goalProgress, allLeads, allVisits, isPartnerLead };
