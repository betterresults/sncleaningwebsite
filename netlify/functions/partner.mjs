import "@netlify/blobs"; // listed here so Netlify ships it with this function
import adapt from "../../lib/adapt.js";
import impl from "../../lib/partner-handler.js";

// Partner dashboard at /partner. Logic lives in lib/partner-handler.js
export default adapt(impl.handler);
