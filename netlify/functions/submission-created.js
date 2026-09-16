/**
 * Fires automatically the moment someone submits a form on this site.
 * Netlify invokes this by filename - no webhook or URL to configure.
 *
 * It only acts on the cleaner application form. It sends the answers to Claude
 * with Silvia's hiring rubric, then posts the verdict back into a second Netlify
 * form called "scored-application", so Netlify's own email notification delivers
 * the score. That keeps the whole thing inside Netlify with no email provider.
 *
 * Needs one environment variable in Netlify: ANTHROPIC_API_KEY
 * Optional: ANTHROPIC_MODEL (defaults below)
 */

const SOURCE_FORM = "cleaner-application";
const TARGET_FORM = "scored-application";
const MODEL = process.env.ANTHROPIC_MODEL || "claude-sonnet-4-5";

const RUBRIC = `You are screening applicants for SN Cleaning Services, a domestic cleaning company in Essex (Upminster, Brentwood, Chelmsford and nearby). Silvia, the owner, values attitude far above experience. She actively welcomes people with no cleaning experience and trains them. What she cannot work with is a cleaner who believes they already know everything.

Score the applicant out of 60.

DOUBLE WEIGHT (score each 1-5, then double) - these four detect the "I know better" attitude:
- q2-unhappy-customer: 5 = took responsibility and fixed it without blaming the client. 1 = blames the customer.
- q3-wrong-method: 5 = does it the client's way and raises concerns politely. 1 = "I'd tell them they're doing it wrong".
- q4-learned: 5 = names something specific and real. 1 = "nothing, I've done this for years".
- q8-least-confident: 5 = names an honest gap. 1 = "I'm confident with everything".

SINGLE WEIGHT (1-5 each): q1-enjoy, q5-job-finished, q7-running-late ("I call as soon as I know" = 5, "I just turn up" = 2), q9-would-leave, q6-usual-arrival (early 5, on time 4, varied 3, a few minutes late 2, often late 1), q10-training-reaction ("happy to learn our way" or "do it our way and ask why" = 5, "would try it but say if mine works better" = 3, "prefers to stick with own method" = 1).

q11-products-used is a flag, not a score. Washing-up liquid and water, or a vague non-answer, means they need real training - say so. A real cleaner names actual products. A suspiciously polished textbook answer may be AI-written.

AUTOMATIC REJECT regardless of score: blames a client anywhere; dbs is "Not willing to have a DBS check"; pay-ok is "16 is below what they need".
Note but never reject on: right-to-work "Not sure"; experience-level of none.

HONESTY SIGNALS - mention only if they look off: time-taken (eleven written answers in under three minutes is not credible), typed-or-pasted, left-the-page (a run of page-leaves suggests hopping to an AI and back).

VERDICT: under 35 = "Do not interview". 35-45 = "Phone call". Over 45 = "Trial shift".

Reply with ONLY a JSON object, no markdown fence:
{"score": <number>, "verdict": "<Do not interview|Phone call|Trial shift>", "summary": "<2-3 plain sentences on why, quoting their own words where it matters>", "flags": "<anything Silvia should ask about on the call, or 'None'>"}`;

exports.handler = async (event) => {
  let body;
  try {
    body = JSON.parse(event.body || "{}");
  } catch (err) {
    return { statusCode: 200, body: "unparseable" };
  }

  const payload = body.payload || {};
  // Guard: ignore the contact form, and ignore our own scored posts (no loops).
  if (payload.form_name !== SOURCE_FORM) {
    return { statusCode: 200, body: "ignored" };
  }

  const data = payload.data || {};
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) {
    console.error("ANTHROPIC_API_KEY is not set - cannot score");
    return { statusCode: 200, body: "no key" };
  }

  const answers = Object.keys(data)
    .filter((k) => !["ip", "user_agent", "referrer", "bot-field"].includes(k))
    .map((k) => k + ": " + (Array.isArray(data[k]) ? data[k].join(", ") : data[k]))
    .join("\n");

  let result = { score: "", verdict: "Scoring failed", summary: "", flags: "" };

  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": key,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 1000,
        messages: [{ role: "user", content: RUBRIC + "\n\nAPPLICANT:\n" + answers }]
      })
    });

    if (!res.ok) {
      const detail = await res.text();
      console.error("Anthropic API error", res.status, detail.slice(0, 500));
      result.summary = "Claude returned " + res.status + ". Check ANTHROPIC_API_KEY and the model name in Netlify.";
    } else {
      const json = await res.json();
      const text = ((json.content || []).find((b) => b.type === "text") || {}).text || "";
      const match = text.match(/\{[\s\S]*\}/);
      if (match) {
        const parsed = JSON.parse(match[0]);
        result = {
          score: String(parsed.score != null ? parsed.score : ""),
          verdict: parsed.verdict || "",
          summary: parsed.summary || "",
          flags: parsed.flags || ""
        };
      } else {
        result.summary = text.slice(0, 900);
        result.verdict = "Unparsed";
      }
    }
  } catch (err) {
    console.error("Scoring failed", err);
    result.summary = String(err).slice(0, 500);
  }

  const site = process.env.URL || "https://sncleaningwebsite.netlify.app";
  const fields = {
    "form-name": TARGET_FORM,
    applicant: data.name || "Unknown",
    phone: data.phone || "",
    "based-in": data["based-in"] || "",
    score: result.score === "" ? "" : result.score + " / 60",
    verdict: result.verdict,
    summary: result.summary,
    flags: result.flags,
    honesty: [data["time-taken"], data["typed-or-pasted"], data["left-the-page"]]
      .filter(Boolean)
      .join(" | ")
  };

  try {
    const post = await fetch(site + "/", {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams(fields).toString()
    });
    if (!post.ok) console.error("Posting score back failed", post.status);
  } catch (err) {
    console.error("Posting score back failed", err);
  }

  return { statusCode: 200, body: "scored" };
};
