/**
 * Fires automatically the moment someone submits a form on this site.
 * Netlify invokes this by filename - nothing to configure.
 *
 * On a cleaner application it calls Silvia's Claude routine
 * ("Cleaners Form Submission") which does the rating, and records the outcome
 * of that call in the "scored-application" form so there is always a trail.
 *
 * Environment variables to set in Netlify:
 *   CLAUDE_ROUTINE_TOKEN  - the token from the routine page (starts sk-ant-oat01-)
 *   CLAUDE_ROUTINE_URL    - optional, defaults to the routine below
 */

const SOURCE_FORM = "cleaner-application";
const TARGET_FORM = "scored-application";
const ROUTINE_URL =
  process.env.CLAUDE_ROUTINE_URL ||
  "https://api.anthropic.com/v1/claude_code/routines/trig_01J9HNhNVxmx8homMMU2EjfJ/fire";

const SKIP = ["ip", "user_agent", "referrer", "bot-field"];

exports.handler = async (event) => {
  let body;
  try {
    body = JSON.parse(event.body || "{}");
  } catch (err) {
    return { statusCode: 200, body: "unparseable" };
  }

  const payload = body.payload || {};
  // Ignore the contact form, and our own scored posts, so nothing loops.
  if (payload.form_name !== SOURCE_FORM) {
    return { statusCode: 200, body: "ignored" };
  }

  const data = payload.data || {};
  const token = process.env.CLAUDE_ROUTINE_TOKEN;

  const answers = Object.keys(data)
    .filter((k) => !SKIP.includes(k))
    .map((k) => k + ": " + (Array.isArray(data[k]) ? data[k].join(", ") : data[k]))
    .join("\n");

  const message =
    "A new cleaner application has just come in through the website. " +
    "Rate this applicant against the scoring rules and report the result.\n\n" +
    "Submitted: " + (payload.created_at || new Date().toISOString()) + "\n" +
    "Netlify submission id: " + (payload.id || "unknown") + "\n\n" +
    answers;

  let outcome = "";

  if (!token) {
    outcome = "CLAUDE_ROUTINE_TOKEN is not set in Netlify - the routine was not fired.";
  } else {
    try {
      const res = await fetch(ROUTINE_URL, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "authorization": "Bearer " + token,
          "x-api-key": token,
          "anthropic-version": "2023-06-01",
          "anthropic-beta": "oauth-2025-04-20"
        },
        body: JSON.stringify({ text: message })
      });
      const text = await res.text();
      outcome =
        res.ok
          ? "Routine fired OK (" + res.status + "). " + text.slice(0, 300)
          : "Routine call failed with " + res.status + ". " + text.slice(0, 600);
      if (!res.ok) console.error("Routine call failed", res.status, text.slice(0, 1000));
    } catch (err) {
      outcome = "Routine call threw: " + String(err).slice(0, 400);
      console.error(outcome);
    }
  }

  const site = process.env.URL || "https://sncleaningwebsite.netlify.app";
  const fields = {
    "form-name": TARGET_FORM,
    applicant: data.name || "Unknown",
    phone: data.phone || "",
    "based-in": data["based-in"] || "",
    score: "",
    verdict: outcome.startsWith("Routine fired OK") ? "Sent to routine" : "Not sent",
    summary: outcome,
    flags: "",
    honesty: [data["time-taken"], data["typed-or-pasted"], data["left-the-page"]]
      .filter(Boolean)
      .join(" | ")
  };

  try {
    await fetch(site + "/", {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams(fields).toString()
    });
  } catch (err) {
    console.error("Could not record the outcome", err);
  }

  return { statusCode: 200, body: "done" };
};
