import "@netlify/blobs"; // listed here so Netlify ships it with this function
import adapt from "../../lib/adapt.js";
import impl from "../../lib/leads-handler.js";

// Leads dashboard at /dashboard. Logic lives in lib/leads-handler.js
export default adapt(impl.handler);
