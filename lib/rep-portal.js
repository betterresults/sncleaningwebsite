/**
 * Rep portal (door-to-door representative) at /partner for partners with role "rep".
 * Clock in / break / clock out at the top, then a quick "Log a visit" form.
 */

const F = require("./funnel");
const R = require("./reps");
const esc = F.esc;

const tm = (iso) => iso ? new Date(iso).toLocaleTimeString("en-GB", { timeZone: "Europe/London", hour: "2-digit", minute: "2-digit" }) : "";
const dayName = (day) => new Date(day + "T12:00:00Z").toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" });
const clean = (v, n) => String(v == null ? "" : v).trim().slice(0, n || 200);
const num = (v) => { const n = parseFloat(v); return isFinite(n) ? Math.round(n * 1e5) / 1e5 : null; };
const loc = (p) => { const lat = num(p.get("lat")), lng = num(p.get("lng")); return lat != null && lng != null ? { lat, lng } : null; };

const CSS = `
.clock{background:#fff;border:1px solid var(--line);border-radius:16px;padding:18px;margin-bottom:16px;display:flex;flex-wrap:wrap;gap:14px;align-items:center;justify-content:space-between}
.clock .state{font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:var(--mut)}
.clock .timer{font:700 34px/1.1 Inter,system-ui,sans-serif;letter-spacing:-.02em;font-variant-numeric:tabular-nums}
.clock.on{border-color:#bfe3cf;background:#f3fbf6}.clock.on .state{color:#17703c}
.clock.brk{border-color:#f3dcae;background:#fffaf0}.clock.brk .state{color:#8a5a00}
.clock .acts{display:flex;gap:8px;flex-wrap:wrap}
.big{font:700 17px Inter,system-ui,sans-serif;padding:15px 26px;border-radius:12px;border:0;cursor:pointer;color:#fff;background:#17703c}
.big.out{background:#a62626}.big.brkb{background:#fff;color:#8a5a00;box-shadow:inset 0 0 0 2px #e5c27a}
.vform label{margin-top:12px}.vform input,.vform textarea,.vform select{width:100%;margin-bottom:0}
.vform textarea{font:inherit;padding:10px 12px;border:1px solid #cfd8d5;border-radius:8px;min-height:70px}
.pills{display:flex;flex-wrap:wrap;gap:8px;margin-top:4px}.pills label{margin:0;font-weight:600}
.pills input{position:absolute;opacity:0;width:1px;height:1px}
.pills span{display:inline-block;padding:10px 14px;border-radius:999px;border:1.5px solid #cfd8d5;background:#fff;cursor:pointer}
.pills input:checked+span{background:var(--g);border-color:var(--g);color:#fff}
.pills input:focus-visible+span{outline:2px solid var(--g);outline-offset:2px}
.row2{display:grid;grid-template-columns:1fr 1fr;gap:10px}@media(max-width:560px){.row2{grid-template-columns:1fr}}
.leadbox{border:1.5px dashed #bfe3cf;border-radius:12px;padding:4px 12px 12px;margin-top:14px;background:#f8fdf9}
.chk{display:flex;gap:8px;align-items:center;font-weight:600;margin-top:14px}.chk input{width:auto;margin:0}
.locbtn{font:600 13px Inter,system-ui,sans-serif;padding:8px 12px;border-radius:8px;border:1px solid #cfd8d5;background:#fff;color:var(--g);cursor:pointer;margin-top:6px}
.locstat{font-size:13px;color:var(--mut);margin:6px 0 0}.locstat.ok{color:#17703c}.locstat.bad{color:#a62626}
.locgate{background:#fff4f2;border:1.5px solid #f2c4bb;border-radius:14px;padding:14px 16px;margin-bottom:14px}
.locgate strong{display:block;color:#8a2a1c;font-size:16px;margin-bottom:4px}.locgate p{margin:0 0 10px;font-size:14px;color:#5b3a33}
.locgate button{font:700 15px Inter,system-ui,sans-serif;padding:12px 18px;border-radius:10px;border:0;background:#a62626;color:#fff;cursor:pointer}
.locgate .how{font-size:13px;color:#5b3a33;margin-top:10px}
.big:disabled{opacity:.45;cursor:not-allowed}
.locwarn{background:#fff7e6;border:1px solid #f3dcae;color:#7a5200;border-radius:12px;padding:12px 14px;margin-bottom:14px;font-size:14px}
.photoprev{max-width:160px;border-radius:8px;margin-top:8px;display:none}
.vlist .v{background:#fff;border:1px solid var(--line);border-radius:12px;padding:12px 14px;margin-bottom:8px}
.vlist .v b{font-size:15px}.tag{display:inline-block;font-size:12px;font-weight:700;padding:2px 9px;border-radius:999px;background:#eef2f1;margin-left:6px}
.tag.Interested,.tag.Call{background:#e3f5ea;color:#17703c}.tag.Not{background:#fdeaea;color:#a62626}
.locked{background:#fff;border:1px dashed var(--line);border-radius:12px;padding:16px;color:var(--mut);text-align:center}
.flash{padding:10px 14px;border-radius:10px;background:#e3f5ea;color:#17703c;font-weight:600;margin-bottom:14px}`;

const JS = `<script>
(function(){
  // live timer
  var t=document.querySelector("[data-worked]");
  if(t){var base=+t.getAttribute("data-worked"),since=Date.now(),run=t.getAttribute("data-running")==="1";
    function f(ms){var m=Math.floor(ms/60000);return Math.floor(m/60)+"h "+String(m%60).padStart(2,"0")+"m";}
    function tick(){t.textContent=f(base+(run?Date.now()-since:0));}tick();if(run)setInterval(tick,20000);}
  // Location: asked for as soon as the page opens, then kept up to date and added to every form automatically
  var last=null, stat=document.getElementById("locstat"), warn=document.getElementById("locwarn");
  function show(txt,cls){if(stat){stat.textContent=txt;stat.className="locstat"+(cls?" "+cls:"");}}
  function fill(p){
    last=p;
    document.querySelectorAll("form[data-loc]").forEach(function(f){f.lat.value=p.coords.latitude;f.lng.value=p.coords.longitude;});
    fetch("https://api.postcodes.io/postcodes?lon="+p.coords.longitude+"&lat="+p.coords.latitude+"&limit=1").then(function(r){return r.json()}).then(function(j){
      var r=j.result&&j.result[0], pc=document.getElementById("vp");
      if(r){if(pc)pc.value=r.postcode;show("📍 Location saved automatically · near "+r.postcode,"ok");}else show("📍 Location saved automatically","ok");
    }).catch(function(){show("📍 Location saved automatically","ok");});
  }
  var gate=document.getElementById("locgate"), how=document.getElementById("lochow"), cin=document.getElementById("clockin");
  function lock(on){document.querySelectorAll(".vform button[type=submit]").forEach(function(b){b.disabled=on;});}
  function ok(p){if(gate)gate.hidden=true;if(cin)cin.disabled=false;lock(false);fill(p);}
  function denied(err){
    show("📍 Location is off.","bad");
    if(gate)gate.hidden=false;if(cin)cin.disabled=true;if(!last)lock(true);
    if(how&&err&&err.code===1)how.hidden=false; // blocked: the phone will not ask again, so show how to switch it on
  }
  function ask(){
    if(!navigator.geolocation){denied({code:1});return;}
    navigator.geolocation.getCurrentPosition(ok,denied,{enableHighAccuracy:true,timeout:15000,maximumAge:60000});
  }
  var gb=document.getElementById("locbtn2");if(gb)gb.addEventListener("click",function(){gb.textContent="Checking…";ask();setTimeout(function(){gb.textContent="Allow location";},3000);});
  ask();
  if(navigator.geolocation)navigator.geolocation.watchPosition(ok,function(){},{enableHighAccuracy:true,maximumAge:60000});
  document.querySelectorAll("form[data-loc]").forEach(function(form){
    form.addEventListener("submit",function(e){if(form.dataset.sent)return;e.preventDefault();var b=form.querySelector("button[type=submit],button:not([type])");if(b){b.disabled=true;b.textContent="Please wait…";}
      function go(){form.dataset.sent="1";form.submit();}
      if(!navigator.geolocation){go();return;}
      navigator.geolocation.getCurrentPosition(function(p){form.lat.value=p.coords.latitude;form.lng.value=p.coords.longitude;go();},function(){if(last){form.lat.value=last.coords.latitude;form.lng.value=last.coords.longitude;}go();},{enableHighAccuracy:true,timeout:6000,maximumAge:30000});});
  });
  // lead fields
  var lbx=document.getElementById("leadbox");
  document.querySelectorAll("input[name=outcome]").forEach(function(r){r.addEventListener("change",function(){var v=document.querySelector("input[name=outcome]:checked").value;lbx.hidden=!(v==="Interested"||v==="Call back");});});
  // photo: shrink before upload
  var ph=document.getElementById("photo");
  if(ph){ph.addEventListener("change",function(){var f=ph.files[0];if(!f)return;var img=new Image();img.onload=function(){var s=Math.min(1,1100/Math.max(img.width,img.height)),c=document.createElement("canvas");c.width=img.width*s;c.height=img.height*s;c.getContext("2d").drawImage(img,0,0,c.width,c.height);var d=c.toDataURL("image/jpeg",0.7);document.getElementById("photodata").value=d;var pv=document.getElementById("photoprev");pv.src=d;pv.style.display="block";};img.src=URL.createObjectURL(f);});}
})();
</script>`;

function clockCard(open) {
  if (!open) {
    return `<div class="clock"><div><div class="state">Not clocked in</div><div class="timer">0h 00m</div></div>
<form method="post" data-loc><input type="hidden" name="do" value="clockin"><input type="hidden" name="lat"><input type="hidden" name="lng"><button class="big" type="submit" id="clockin" disabled>Clock in</button></form></div>`;
  }
  const brk = R.onBreak(open);
  return `<div class="clock ${brk ? "brk" : "on"}"><div><div class="state">${brk ? "On break" : "On shift"} · since ${esc(tm(open.in))}</div>
<div class="timer" data-worked="${R.workedMs(open)}" data-running="${brk ? "0" : "1"}">${R.hrs(R.workedMs(open))}</div></div>
<div class="acts">${brk
    ? `<form method="post"><input type="hidden" name="do" value="resume"><button class="big" type="submit">End break</button></form>`
    : `<form method="post"><input type="hidden" name="do" value="break"><button class="big brkb" type="submit">Break</button></form>`}
<form method="post" data-loc onsubmit="return confirm('Clock out and finish your shift?')"><input type="hidden" name="do" value="clockout"><input type="hidden" name="lat"><input type="hidden" name="lng"><button class="big out" type="submit">Clock out</button></form></div></div>`;
}

function visitForm() {
  return `<div class="card"><h2 style="margin-top:0">Log a visit</h2>
<form method="post" class="vform" data-loc><input type="hidden" name="do" value="visit"><input type="hidden" name="lat"><input type="hidden" name="lng"><input type="hidden" name="photo" id="photodata">
<label for="vc">Company name</label><input id="vc" name="company" required autocomplete="off">
<input type="hidden" name="postcode" id="vp">
<label for="va">Street / area name</label><input id="va" name="address" autocomplete="off" placeholder="e.g. Station Road, Upminster">
<p class="locstat" id="locstat">📍 Getting your location…</p>
<label for="vs">Who did you speak to? (name or role)</label><input id="vs" name="spokeTo" autocomplete="off" placeholder="e.g. Sarah, office manager">
<label>What happened?</label><div class="pills">${R.OUTCOMES.map((o, i) => `<label><input type="radio" name="outcome" value="${esc(o)}"${i === 0 ? " checked" : ""} required><span>${esc(o)}</span></label>`).join("")}</div>
<label class="chk"><input type="checkbox" name="leaflet" value="1" checked> I gave a leaflet</label>
<div class="leadbox" id="leadbox" hidden><label for="ln">Contact name</label><input id="ln" name="leadName" autocomplete="off">
<div class="row2"><div><label for="lp">Phone</label><input id="lp" name="leadPhone" type="tel" autocomplete="off"></div><div><label for="le">Email</label><input id="le" name="leadEmail" type="email" autocomplete="off"></div></div>
<label for="lw">What do they need cleaned? / best time to call</label><textarea id="lw" name="leadNeeds"></textarea></div>
<label for="vn">Notes (optional)</label><textarea id="vn" name="notes"></textarea>
<label for="photo">Photo of the front (optional)</label><input id="photo" type="file" accept="image/*" capture="environment"><img id="photoprev" class="photoprev" alt="Photo preview">
<button type="submit" style="width:100%;margin-top:16px;padding:15px">Save visit</button></form></div>`;
}

function visitItem(v) {
  const lead = v.lead && (v.lead.name || v.lead.phone || v.lead.email);
  return `<div class="v"><b>${esc(v.company)}</b><span class="tag ${esc(String(v.outcome).split(" ")[0])}">${esc(v.outcome)}</span>
<div class="mut">${esc(tm(v.at))}${v.postcode ? " · " + esc(v.postcode) : ""}${v.spokeTo ? " · spoke to " + esc(v.spokeTo) : ""}${v.leaflet ? " · leaflet given" : ""}</div>
${lead ? `<div style="margin-top:4px">Lead: ${esc([v.lead.name, v.lead.phone, v.lead.email].filter(Boolean).join(" · "))}</div>` : ""}${v.notes ? `<div class="mut">${esc(v.notes)}</div>` : ""}</div>`;
}

function daySummary(shifts, visits, day) {
  const sh = shifts.filter((s) => R.londonDay(s.in) === day);
  const vs = visits.filter((v) => R.londonDay(v.at) === day);
  const ms = sh.reduce((t, s) => t + R.workedMs(s), 0);
  return { hours: R.hrs(ms), ms, visits: vs.length, leaflets: vs.filter((v) => v.leaflet).length, leads: vs.filter(R.isLead).length, vs, sh };
}

async function page(st, pr, q, side, shell) {
  const [shifts, visits] = await Promise.all([R.shiftsFor(st.reps, pr.key), R.visitsFor(st.reps, pr.key)]);
  const open = R.openShift(shifts);
  if (q.view === "history") {
    const days = [];
    for (let i = 0; i < 21; i++) days.push(R.londonDay(new Date(Date.now() - i * 86400000).toISOString()));
    const rows = days.map((d) => ({ d, s: daySummary(shifts, visits, d) })).filter((x) => x.s.sh.length || x.s.visits).map(({ d, s }) =>
      `<tr><td>${esc(dayName(d))}</td><td>${s.sh.map((x) => esc(tm(x.in)) + "–" + (x.out ? esc(tm(x.out)) : "now")).join("<br>")}</td><td>${esc(s.hours)}</td><td>${s.visits}</td><td>${s.leaflets}</td><td>${s.leads}</td></tr>`).join("");
    const wk = R.weekStart(R.today());
    const wms = shifts.filter((s) => R.londonDay(s.in) >= wk).reduce((t, s) => t + R.workedMs(s), 0);
    return shell("History – Rep", side("hist", pr, `<style>${CSS}</style><h1>My history</h1><p class="lede">This week so far: <strong>${esc(R.hrs(wms))}</strong></p>
<div class="scroll"><table><thead><tr><th>Day</th><th>Shift</th><th>Hours</th><th>Visits</th><th>Leaflets</th><th>Leads</th></tr></thead><tbody>${rows || `<tr><td colspan="6" class="mut">Nothing yet.</td></tr>`}</tbody></table></div>`));
  }
  const td = daySummary(shifts, visits, R.today());
  const errs = { loc: "Location is needed to clock in. Tap Allow location, then try again." };
  return shell("Today – Rep", side("dash", pr, `<style>${CSS}</style><h1>Hi ${esc(pr.name)}</h1>
${errs[q.err] ? `<div class="flash" style="background:#fdeaea;color:#a62626">${esc(errs[q.err])}</div>` : ""}
<div class="locgate" id="locgate" hidden><strong>Turn on location to start work</strong><p>You can't clock in or log visits until location is on. We use it to record where you start and each visit.</p>
<button type="button" id="locbtn2">Allow location</button>
<div class="how" id="lochow" hidden>Location is blocked for this website, so your phone won't ask again. To switch it on:<br><b>iPhone:</b> Settings → Privacy &amp; Security → Location Services → Safari Websites → While Using the App. Then reload this page.<br><b>Android (Chrome):</b> tap the icon to the left of the web address → Permissions → Location → Allow. Then reload this page.</div></div>
${clockCard(open)}
<div class="stats"><div class="stat"><b>${esc(td.hours)}</b><span>Worked today</span></div><div class="stat"><b>${td.visits}</b><span>Visits</span></div><div class="stat"><b>${td.leaflets}</b><span>Leaflets</span></div><div class="stat"><b>${td.leads}</b><span>Leads</span></div></div>
${open && !R.onBreak(open) ? visitForm() : ""}
${td.vs.length ? `<h2>Today's visits</h2><div class="vlist">${td.vs.map(visitItem).join("")}</div>` : ""}${JS}`));
}

// POST from a logged-in rep. Returns a redirect target (with ?msg=) or null.
async function action(st, pr, p) {
  const act = p.get("do");
  const shifts = await R.shiftsFor(st.reps, pr.key);
  const open = R.openShift(shifts);
  const now = new Date().toISOString();
  const save = (sh) => st.reps.setJSON("shift/" + pr.key + "/" + sh.id, sh);
  if (act === "clockin") {
    if (open) return "/partner";
    if (!loc(p)) return "/partner?err=loc";
    const sh = { id: R.newId("S"), rep: pr.key, in: now, out: "", inLoc: loc(p), outLoc: null, breaks: [] };
    await save(sh);
    return "/partner";
  }
  if (!open) return act === "visit" || act === "clockout" || act === "break" || act === "resume" ? "/partner" : null;
  if (act === "break") { if (!R.onBreak(open)) { open.breaks.push({ start: now, end: "" }); await save(open); } return "/partner"; }
  if (act === "resume") { open.breaks.forEach((b) => { if (!b.end) b.end = now; }); await save(open); return "/partner"; }
  if (act === "clockout") {
    open.breaks.forEach((b) => { if (!b.end) b.end = now; });
    open.out = now; open.outLoc = loc(p); await save(open);
    return "/partner";
  }
  if (act === "visit") {
    const company = clean(p.get("company"), 120);
    if (!company) return "/partner";
    const outcome = R.OUTCOMES.includes(p.get("outcome")) ? p.get("outcome") : R.OUTCOMES[0];
    const v = { id: R.newId("V"), rep: pr.key, shift: open.id, at: now, company,
      postcode: clean(p.get("postcode"), 10).toUpperCase(), address: clean(p.get("address"), 160), spokeTo: clean(p.get("spokeTo"), 100),
      outcome, leaflet: p.get("leaflet") === "1", notes: clean(p.get("notes"), 1000), loc: loc(p), hasPhoto: false, lead: null };
    if (R.isLead(v)) v.lead = { name: clean(p.get("leadName"), 100), phone: clean(p.get("leadPhone"), 40), email: clean(p.get("leadEmail"), 120), needs: clean(p.get("leadNeeds"), 1000) };
    const photo = p.get("photo") || "";
    if (/^data:image\/jpeg;base64,[A-Za-z0-9+/=]+$/.test(photo) && photo.length < 2500000) {
      await st.reps.set("photo/" + v.id, photo);
      v.hasPhoto = true;
    }
    await st.reps.setJSON("visit/" + pr.key + "/" + v.id, v);
    return "/partner";
  }
  return null;
}

module.exports = { page, action, daySummary, tm, dayName };
