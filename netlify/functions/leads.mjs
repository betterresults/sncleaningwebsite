import adapt from "../../lib/adapt.js";
import impl from "../../lib/leads-handler.js";

// Leads dashboard at /leads. Logic lives in lib/leads-handler.js
export default adapt(impl.handler);
