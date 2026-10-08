/**
 * Facebook instant-form (Lead Ads) webhook at /api/meta-leads.
 *
 *   GET   Meta checks the address once: hub.verify_token must match the verify
 *         token shown in /dashboard?view=settings, then we echo hub.challenge.
 *   POST  Meta says "new lead <leadgen_id>". We read the lead with the Page
 *         access token, save it in the dashboard (source "Facebook form", with
 *         its Meta Lead ID and campaign / ad set / ad) and send it to Dilvon.
 *
 * Lead record id = "Lfb" + Meta Lead ID, so the same lead is never saved twice.
 * If the lead can't be read yet (no token, Meta error) we answer 500 so Meta
 * tries again later (it keeps retrying for up to 36 hours).
 */

const crypto = require("crypto");
const F = require("./funnel");

const text = (statusCode, body) => ({ statusCode, headers: { "content-type": "text/plain" }, body: String(body) });

function signatureOk(event, secret) {
  if (!secret) return true; // app secret not added yet
  const got = (event.headers || {})["x-hub-signature-256"] || "";
  const want = "sha256=" + crypto.createHmac("sha256", secret).update(event.body || "", "utf8").digest("hex");
  return got.length === want.length && crypto.timingSafeEqual(Buffer.from(got), Buffer.from(want));
}

// field_data: [{ name: "email", values: ["a@b.com"] }, ...] -> contact + other answers
function readFields(fieldData) {
  const out = { firstName: "", lastName: "", email: "", phone: "", postcode: "", answers: {} };
  (fieldData || []).forEach((f) => {
    const name = String(f.name || "");
    const v = (f.values || []).join(", ").trim();
    const k = name.toLowerCase();
    if (k === "first_name") out.firstName = v;
    else if (k === "last_name") out.lastName = v;
    else if (k === "full_name") {
      const parts = v.split(/\s+/);
      if (!out.firstName) out.firstName = parts.shift() || "";
      if (!out.lastName) out.lastName = parts.join(" ");
    } else if (k === "email") out.email = v;
    else if (k === "phone_number" || k === "phone") out.phone = v;
    else if (k === "post_code" || k === "zip_code" || k === "zip" || k === "postcode") out.postcode = v.toUpperCase();
    else out.answers[name.replace(/_/g, " ").replace(/\?$/, "") + "?"] = v;
  });
  return out;
}

async function fetchLead(leadgenId, token) {
  const fields = "created_time,field_data,campaign_id,campaign_name,adset_id,adset_name,ad_id,ad_name,form_id,platform,is_organic";
  const res = await fetch("https://graph.facebook.com/" + F.GRAPH_VERSION + "/" + encodeURIComponent(leadgenId) +
    "?fields=" + fields + "&access_token=" + encodeURIComponent(token));
  const body = await res.json().catch(() => ({}));
  if (!res.ok || body.error) throw new Error((body.error && body.error.message) || "HTTP " + res.status);
  return body;
}

async function handleOne(st, settings, v) {
  const metaLeadId = String(v.leadgen_id || "").replace(/\D/g, "");
  if (!metaLeadId) return true;
  const id = "Lfb" + metaLeadId;
  const now = new Date().toISOString();
  let lead = await st.leads.get(id, { type: "json" });
  if (lead && lead.fetched && lead.dilvon && lead.dilvon.ok) return true; // already done

  if (!lead) {
    lead = {
      id, page: "facebook-form", source: "facebook_form", metaLeadId,
      createdAt: v.created_time ? new Date(Number(v.created_time) * 1000).toISOString() : now,
      status: "New", firstName: "", lastName: "", email: "", phone: "", postcode: "", answers: {},
      first: { utm_source: "facebook", utm_medium: "instant_form", form_id: String(v.form_id || ""),
        ad_id: String(v.ad_id || ""), adset_id: String(v.adgroup_id || ""), at: now },
      journey: [{ at: now, type: "lead", detail: "Filled in the Facebook form" }], meta: []
    };
  }

  if (!lead.fetched) {
    if (!settings.leadAds.pageToken) {
      lead.fetchError = "No Page access token in Meta settings yet";
      await st.leads.setJSON(id, lead);
      return false;
    }
    try {
      const d = await fetchLead(metaLeadId, settings.leadAds.pageToken);
      const c = readFields(d.field_data);
      Object.assign(lead, { firstName: c.firstName, lastName: c.lastName, email: c.email, phone: c.phone, postcode: c.postcode, answers: c.answers });
      Object.assign(lead.first, {
        utm_campaign: d.campaign_name || "", campaign_name: d.campaign_name || "", campaign_id: d.campaign_id || lead.first.campaign_id || "",
        adset_name: d.adset_name || "", adset_id: d.adset_id || lead.first.adset_id,
        ad_name: d.ad_name || "", utm_content: d.ad_name || "", ad_id: d.ad_id || lead.first.ad_id,
        form_id: d.form_id || lead.first.form_id, platform: d.platform || ""
      });
      if (d.is_organic) lead.first.utm_medium = "instant_form_organic";
      lead.last = lead.first;
      lead.fetched = true;
      delete lead.fetchError;
    } catch (err) {
      lead.fetchError = String(err.message || err).slice(0, 300);
      await st.leads.setJSON(id, lead);
      return false;
    }
  }

  if (!(lead.dilvon && lead.dilvon.ok) && (lead.email || lead.phone)) {
    lead.dilvon = await F.sendToDilvon(lead);
  }
  lead.updatedAt = now;
  await st.leads.setJSON(id, lead);
  return true;
}

exports.handler = async (event) => {
  const st = F.stores(event);
  const settings = await F.getSettings(st);

  if (event.httpMethod === "GET") {
    const q = event.queryStringParameters || {};
    if (q["hub.mode"] === "subscribe" && settings.leadAds.verifyToken && q["hub.verify_token"] === settings.leadAds.verifyToken) {
      return text(200, q["hub.challenge"] || "");
    }
    return text(403, "Verify token does not match");
  }
  if (event.httpMethod !== "POST") return text(405, "Method not allowed");
  if (!signatureOk(event, settings.leadAds.appSecret)) return text(401, "Bad signature");

  let body;
  try { body = JSON.parse(event.body || "{}"); } catch (e) { return text(400, "Bad JSON"); }
  let allOk = true;
  for (const entry of body.entry || []) {
    for (const ch of entry.changes || []) {
      if (ch.field !== "leadgen" || !ch.value) continue;
      if (!(await handleOne(st, settings, ch.value))) allOk = false;
    }
  }
  return allOk ? text(200, "OK") : text(500, "Saved, but could not read the lead yet; please retry");
};

exports.readFields = readFields;
