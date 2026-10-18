/**
 * Shared admin layout: left sidebar menu used by /dashboard and /applicants.
 * Self-contained CSS (classes start with "adm-") so it sits on top of either page's own styles.
 */

const I = (d) => `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
const ICONS = {
  home: I('<path d="M3 11l9-8 9 8"/><path d="M5 10v10h5v-6h4v6h5V10"/>'),
  leads: I('<path d="M4 4h16v12H14l-2 3-2-3H4z"/><path d="M8 9h8M8 12h5"/>'),
  report: I('<path d="M4 20V11M10 20V5M16 20v-6M21 20H3"/>'),
  partners: I('<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0"/><circle cx="17" cy="9" r="2.5"/><path d="M16 14.2a5 5 0 0 1 6 4.8"/>'),
  goals: I('<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.2"/>'),
  resources: I('<path d="M3 6a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>'),
  settings: I('<path d="M4 6h9M17 6h3M4 12h3M11 12h9M4 18h11M19 18h1"/><circle cx="15" cy="6" r="2"/><circle cx="9" cy="12" r="2"/><circle cx="17" cy="18" r="2"/>'),
  applicants: I('<rect x="5" y="3" width="14" height="18" rx="2"/><circle cx="12" cy="10" r="2.6"/><path d="M8 17a4 4 0 0 1 8 0"/>'),
  portal: I('<path d="M14 4h6v6M20 4l-9 9"/><path d="M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/>'),
  reps: I('<circle cx="12" cy="7" r="3.5"/><path d="M5 21v-1a7 7 0 0 1 14 0v1"/><path d="M16 3.5l2 2 3.5-3.5"/>'),
  applications: I('<path d="M4 4h16v16H4z"/><path d="M4 14h4l2 3h4l2-3h4"/>'),
  logout: I('<path d="M15 4h4a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1h-4"/><path d="M10 16l-4-4 4-4M6 12h10"/>')
};

const MENU = [
  { key: "home", label: "Dashboard", href: "/dashboard" },
  { key: "leads", label: "Leads", href: "/dashboard?view=leads" },
  { key: "report", label: "Report", href: "/dashboard?view=report" },
  { group: "Partners" },
  { key: "partners", label: "Partners", href: "/dashboard?view=partners" },
  { key: "applications", label: "Applications", href: "/dashboard?view=applications" },
  { key: "goals", label: "Goals", href: "/dashboard?view=goals" },
  { key: "resources", label: "Resources", href: "/dashboard?view=resources" },
  { group: "Team" },
  { key: "reps", label: "Reps", href: "/dashboard?view=reps" },
  { group: "Setup" },
  { key: "settings", label: "Meta settings", href: "/dashboard?view=settings" },
  { key: "applicants", label: "Applicants", href: "/applicants" }
];

const CSS = `
.adm{display:flex;min-height:100vh}
.adm-side{width:232px;flex:0 0 232px;background:#123b39;color:#d7e6e3;position:sticky;top:0;height:100vh;display:flex;flex-direction:column;padding:18px 12px;font:14px/1.4 Inter,system-ui,-apple-system,"Segoe UI",sans-serif}
.adm-brand{display:flex;align-items:center;gap:10px;padding:4px 8px 18px;color:#fff;text-decoration:none}
.adm-brand b{display:grid;place-items:center;width:34px;height:34px;border-radius:9px;background:#2a8a82;color:#fff;font-size:14px;letter-spacing:.02em}
.adm-brand span{font-weight:700;font-size:15px;line-height:1.15}.adm-brand small{display:block;font-weight:500;font-size:12px;color:#9fbdb8}
.adm-nav{display:flex;flex-direction:column;gap:2px;flex:1}
.adm-nav .adm-g{font-size:11px;text-transform:uppercase;letter-spacing:.08em;color:#7fa39d;padding:16px 10px 6px}
.adm-nav a,.adm-foot a{display:flex;align-items:center;gap:10px;padding:9px 10px;border-radius:8px;color:#d7e6e3;text-decoration:none;font-weight:500}
.adm-nav a:hover,.adm-foot a:hover{background:rgba(255,255,255,.07);color:#fff}
.adm-nav a.on{background:#fff;color:#123b39;font-weight:700}
.adm-foot{border-top:1px solid rgba(255,255,255,.12);padding-top:10px;display:flex;flex-direction:column;gap:2px}
.adm-main{flex:1;min-width:0;padding:26px 28px 60px}
.adm-main > .adm-inner{max-width:1240px;margin:0 auto}
@media (max-width:900px){
 .adm{display:block}
 .adm-side{position:sticky;top:0;z-index:20;width:auto;height:auto;flex-direction:row;align-items:center;padding:8px 10px;gap:8px;overflow-x:auto;scrollbar-width:none}
 .adm-side::-webkit-scrollbar{display:none}
 .adm-brand{padding:0 4px 0 0}.adm-brand span{display:none}
 .adm-nav{flex-direction:row;flex:0 0 auto;gap:4px}.adm-nav .adm-g{display:none}
 .adm-nav a,.adm-foot a{white-space:nowrap;padding:8px 10px}
 .adm-foot{flex-direction:row;border:0;padding:0;border-left:1px solid rgba(255,255,255,.15);padding-left:6px}
 .adm-foot a span{display:none}
 .adm-main{padding:18px 16px 50px}
}`;

function sidebar(active) {
  const items = MENU.map((m) => m.group
    ? `<div class="adm-g">${m.group}</div>`
    : `<a href="${m.href}" class="${active === m.key ? "on" : ""}"${active === m.key ? ' aria-current="page"' : ""}>${ICONS[m.key]}<span>${m.label}</span></a>`).join("");
  return `<aside class="adm-side"><a class="adm-brand" href="/dashboard"><b>SN</b><span>SN Cleaning<small>Admin</small></span></a>
<nav class="adm-nav" aria-label="Admin menu">${items}</nav>
<div class="adm-foot"><a href="/partner" target="_blank" rel="noopener">${ICONS.portal}<span>Partner portal</span></a><a href="/dashboard?logout=1">${ICONS.logout}<span>Log out</span></a></div></aside>`;
}

// Wraps a page's content in the sidebar layout. Include CSS once in <head> (or inline via style tag).
function layout(active, inner) {
  return `<style>${CSS}</style><div class="adm">${sidebar(active)}<main class="adm-main"><div class="adm-inner">${inner}</div></main></div>`;
}

module.exports = { layout, sidebar, CSS, ICONS };
