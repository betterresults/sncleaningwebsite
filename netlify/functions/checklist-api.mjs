import "@netlify/blobs"; // listed here so Netlify ships it with this function
import adapt from "../../lib/adapt.js";
import impl from "../../lib/checklist-api-handler.js";

// POST/GET /api/checklist and private /checklist/report/:id (query report=id).
// Missing Dilvon, SMTP, Blobs or Supabase must not 500. No live send unless
// DILVON_SEND_ENABLED is true and DILVON_DOMESTIC_API_KEY is set.
export default adapt(impl.handler);
