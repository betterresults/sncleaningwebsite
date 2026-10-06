/* Runs a Lambda-style handler(event) inside a modern Netlify Function
   (needed so Netlify Blobs can use strong consistency). */
module.exports = (handler) => async (req, context) => {
  const url = new URL(req.url);
  const headers = Object.fromEntries(req.headers);
  if (!headers["x-nf-client-connection-ip"] && context && context.ip) headers["x-nf-client-connection-ip"] = context.ip;
  const event = {
    httpMethod: req.method,
    headers,
    queryStringParameters: Object.fromEntries(url.searchParams),
    body: req.method === "GET" || req.method === "HEAD" ? "" : await req.text()
  };
  const r = await handler(event);
  return new Response(r.body || "", { status: r.statusCode || 200, headers: r.headers || {} });
};
