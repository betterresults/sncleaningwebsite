import "@netlify/blobs"; // listed here so Netlify ships it with this function
import adapt from "../../lib/adapt.js";
import impl from "../../lib/funnel-api-handler.js";

// Public API for the /go/ landing funnels. Logic lives in lib/funnel-api-handler.js
export default adapt(impl.handler);
