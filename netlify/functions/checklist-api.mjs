import "@netlify/blobs"; // listed here so Netlify ships it with this function
import impl from "../../lib/checklist-api-handler.js";

// POST/GET /api/checklist and private /checklist/report/:id.
// The path is passed through because a Netlify rewrite does not add the
// ?report= query this function used to expect. Missing Dilvon, SMTP, Blobs
// or Supabase must not 500. No live send unless DILVON_SEND_ENABLED is true
// and DILVON_DOMESTIC_API_KEY is set.
export default async (req, context) => {
  const url = new URL(req.url);
  const headers = Object.fromEntries(req.headers);
  if (!headers["x-nf-client-connection-ip"] && context && context.ip) headers["x-nf-client-connection-ip"] = context.ip;
  const event = {
    httpMethod: req.method,
    headers,
    queryStringParameters: Object.fromEntries(url.searchParams),
    path: url.pathname,
    rawUrl: req.url,
    body: req.method === "GET" || req.method === "HEAD" ? "" : await req.text()
  };
  const result = await impl.handler(event);
  return new Response(result.body || "", { status: result.statusCode || 200, headers: result.headers || {} });
};
