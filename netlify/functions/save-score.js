/**
 * POST /save-score  - where the scoring routine sends its result.
 *
 * Accepts JSON or form-encoded, any of the field names below, and writes the
 * result into the Netlify "scored-application" form. Built to be forgiving so
 * the routine cannot get the format wrong.
 */

const TARGET_FORM = "scored-application";

function pick(o, names) {
  for (const n of names) {
    if (o[n] !== undefined && o[n] !== null && String(o[n]).trim() !== "") return String(o[n]).trim();
  }
  return "";
}

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, headers: { "content-type": "application/json" },
      body: JSON.stringify({ ok: false, error: "Use POST." }) };
  }

  let data = {};
  const raw = event.body || "";
  const ct = (event.headers["content-type"] || "").toLowerCase();

  try {
    if (ct.includes("json") || raw.trim().startsWith("{")) {
      data = JSON.parse(raw);
    } else {
      new URLSearchParams(raw).forEach((v, k) => { data[k] = v; });
    }
  } catch (err) {
    return { statusCode: 400, headers: { "content-type": "application/json" },
      body: JSON.stringify({ ok: false, error: "Could not read the body. Send JSON or form-encoded." }) };
  }

  const fields = {
    "form-name": TARGET_FORM,
    "source-id": pick(data, ["source-id", "source_id", "sourceId", "submission_id", "submissionId"]),
    applicant: pick(data, ["applicant", "name", "applicant_name", "applicantName"]),
    phone: pick(data, ["phone", "telephone", "mobile"]),
    "based-in": pick(data, ["based-in", "based_in", "basedIn", "area", "town", "postcode"]),
    score: pick(data, ["score", "points", "rating"]),
    verdict: pick(data, ["verdict", "fit", "decision", "recommendation"]),
    summary: pick(data, ["summary", "notes", "reason", "reasoning", "note"]),
    flags: pick(data, ["flags", "ask", "ask_about", "concerns"]),
    honesty: pick(data, ["honesty", "signals"]),
    authenticity: pick(data, ["authenticity", "own_words", "ownWords", "ai_check", "aiCheck"])
  };

  if (!fields.applicant) {
    return { statusCode: 400, headers: { "content-type": "application/json" },
      body: JSON.stringify({ ok: false, error: "applicant is required - it must match the name on their application exactly." }) };
  }

  const site = process.env.URL || "https://sncleaningwebsite.netlify.app";
  try {
    const res = await fetch(site + "/", {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams(fields).toString()
    });
    if (!res.ok) {
      console.error("Netlify form write failed", res.status);
      return { statusCode: 502, headers: { "content-type": "application/json" },
        body: JSON.stringify({ ok: false, error: "Netlify rejected the write (" + res.status + ")." }) };
    }
  } catch (err) {
    console.error("Save failed", err);
    return { statusCode: 502, headers: { "content-type": "application/json" },
      body: JSON.stringify({ ok: false, error: String(err).slice(0, 300) }) };
  }

  return { statusCode: 200, headers: { "content-type": "application/json" },
    body: JSON.stringify({ ok: true, saved: fields.applicant, verdict: fields.verdict, score: fields.score }) };
};
