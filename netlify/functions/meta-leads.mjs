import "@netlify/blobs"; // listed here so Netlify ships it with this function
import adapt from "../../lib/adapt.js";
import impl from "../../lib/meta-leads-handler.js";

// Webhook for Facebook instant-form leads. Logic lives in lib/meta-leads-handler.js
export default adapt(impl.handler);
