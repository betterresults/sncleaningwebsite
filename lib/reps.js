/**
 * Door-to-door reps: shifts (clock in / out, breaks) and visits.
 * A rep is a partner record with role "rep" (same login at /partner).
 *
 * Store "rep-data" (strong consistency), keys:
 *   shift/<repKey>/<shiftId>   { id, rep, in, out, inLoc, outLoc, breaks:[{start,end}], auto, edited }
 *   visit/<repKey>/<visitId>   { id, rep, shift, at, company, address, postcode, spokeTo, outcome, notes, loc, hasPhoto, lead }
 *   photo/<visitId>            data URL (jpeg), only when a photo was taken
 */

const crypto = require("crypto");

const OUTCOMES = ["Leaflet left", "Interested", "Call back", "Not interested", "No one available"];
const isLead = (v) => v.outcome === "Interested" || v.outcome === "Call back";
const newId = (p) => p + Date.now().toString(36) + crypto.randomBytes(3).toString("hex");
const londonDay = (iso) => new Date(iso).toLocaleDateString("en-CA", { timeZone: "Europe/London" });
const today = () => londonDay(new Date().toISOString());

async function listJson(store, prefix) {
  const keys = [];
  let cursor;
  do {
    const pg = await store.list(Object.assign({ prefix }, cursor ? { cursor } : {}));
    keys.push(...pg.blobs.map((b) => b.key));
    cursor = pg.cursor;
  } while (cursor);
  return (await Promise.all(keys.map((k) => store.get(k, { type: "json" })))).filter(Boolean);
}

// Midnight London time at the end of a given day, as ISO (approx: 23:59:59 local)
function endOfDayIso(day) {
  for (const off of ["+00:00", "+01:00"]) {
    const d = new Date(day + "T23:59:59" + off);
    if (londonDay(d.toISOString()) === day) return d.toISOString();
  }
  return new Date(day + "T23:59:59Z").toISOString();
}

// A shift left open from an earlier day is closed at the end of that day and flagged
async function closeForgotten(store, shifts) {
  for (const sh of shifts) {
    if (!sh.out && londonDay(sh.in) < today()) {
      sh.out = endOfDayIso(londonDay(sh.in));
      sh.auto = true;
      (sh.breaks || []).forEach((b) => { if (!b.end) b.end = sh.out; });
      await store.setJSON("shift/" + sh.rep + "/" + sh.id, sh);
    }
  }
  return shifts;
}

async function shiftsFor(store, repKey) {
  const all = await listJson(store, "shift/" + repKey + "/");
  await closeForgotten(store, all);
  return all.sort((a, b) => (b.in || "").localeCompare(a.in || ""));
}
async function visitsFor(store, repKey) {
  return (await listJson(store, "visit/" + repKey + "/")).sort((a, b) => (b.at || "").localeCompare(a.at || ""));
}

// Milliseconds worked (breaks taken off). Open shift/break counts up to now.
function workedMs(sh, now) {
  const end = sh.out ? Date.parse(sh.out) : (now || Date.now());
  let ms = end - Date.parse(sh.in);
  (sh.breaks || []).forEach((b) => { ms -= (b.end ? Date.parse(b.end) : end) - Date.parse(b.start); });
  return Math.max(0, ms);
}
const hrs = (ms) => { const m = Math.round(ms / 60000); return Math.floor(m / 60) + "h " + String(m % 60).padStart(2, "0") + "m"; };
const onBreak = (sh) => !!(sh && !sh.out && (sh.breaks || []).some((b) => !b.end));
const openShift = (shifts) => shifts.find((s) => !s.out) || null;

// Monday of the week containing day (YYYY-MM-DD)
function weekStart(day) {
  const d = new Date(day + "T12:00:00Z");
  const dow = (d.getUTCDay() + 6) % 7;
  d.setUTCDate(d.getUTCDate() - dow);
  return d.toISOString().slice(0, 10);
}

module.exports = { OUTCOMES, isLead, newId, londonDay, today, shiftsFor, visitsFor, workedMs, hrs, onBreak, openShift, weekStart, endOfDayIso };

// "2026-10-19" + "09:30" (London time) -> ISO
function londonIso(day, hhmm) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day) || !/^\d{1,2}:\d{2}$/.test(hhmm)) return "";
  const [h, m] = hhmm.split(":").map(Number);
  for (const off of ["+00:00", "+01:00"]) {
    const d = new Date(day + "T" + String(h).padStart(2, "0") + ":" + String(m).padStart(2, "0") + ":00" + off);
    const t = d.toLocaleTimeString("en-GB", { timeZone: "Europe/London", hour: "2-digit", minute: "2-digit" });
    if (t === String(h).padStart(2, "0") + ":" + String(m).padStart(2, "0")) return d.toISOString();
  }
  return "";
}
module.exports.londonIso = londonIso;
