/* Landing funnel engine for /go/<page>/.
 * The page sets window.FUNNEL = { page, start, screens } before loading this file.
 *
 * Tracking rules:
 *  - Where the visitor came from (utm_*, fbclid, referrer) is read from the URL.
 *    It is only remembered across visits if they press Accept.
 *  - The Meta Pixel only loads after Accept. The server only tells Meta anything
 *    for leads who pressed Accept.
 *  - The same event ID is used by the browser Pixel and the server (CAPI), so
 *    Meta counts each Lead once.
 */
(function () {
  var F = window.FUNNEL;
  var root = document.getElementById("app");
  var WA_NUMBER = "442038355033";
  var TEL = "+442038355033";
  var CONSENT_KEY = "sn-consent";

  /* ---------- small helpers ---------- */
  function store(kind) { try { return window[kind]; } catch (e) { return null; } }
  function get(kind, k) { try { var s = store(kind); return s ? s.getItem(k) : null; } catch (e) { return null; } }
  function set(kind, k, v) { try { var s = store(kind); if (s) s.setItem(k, v); } catch (e) {} }
  function rid(p) { return p + Date.now().toString(36) + Math.random().toString(36).slice(2, 8); }
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function normPostcode(v) {
    var p = String(v || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
    return p.length > 3 ? p.slice(0, -3) + " " + p.slice(-3) : p;
  }
  /* Make sure the Meta browser ID (_fbp) exists before a lead is sent. The pixel
     sets it a moment after loading; if it still isn't there, create it in Meta's
     own format (the pixel then keeps using it). Only for visitors who accepted. */
  function ensureFbp() {
    return new Promise(function (resolve) {
      if (consent() !== "accepted" || cookie("_fbp")) return resolve();
      var waited = 0;
      var t = setInterval(function () {
        waited += 100;
        if (cookie("_fbp") || waited >= 1500) {
          clearInterval(t);
          if (!cookie("_fbp")) {
            var host = location.hostname.replace(/^www\./, "");
            document.cookie = "_fbp=fb.1." + Date.now() + "." + Math.floor(1e9 + Math.random() * 9e9) +
              "; path=/; max-age=7776000; SameSite=Lax" + (/sncleaningservices\.co\.uk$/.test(host) ? "; domain=.sncleaningservices.co.uk" : "");
          }
          resolve();
        }
      }, 100);
    });
  }
  function cookie(name) { var m = document.cookie.match(new RegExp("(?:^|; )" + name + "=([^;]*)")); return m ? decodeURIComponent(m[1]) : ""; }
  function consent() { return get("localStorage", CONSENT_KEY) || "unknown"; }
  function api(body) {
    return fetch("/api/funnel", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body), keepalive: true })
      .then(function (r) { return r.json().catch(function () { return {}; }); });
  }

  /* ---------- where they came from ---------- */
  var params = new URLSearchParams(location.search);
  var touch = { at: new Date().toISOString(), landing: location.pathname, referrer: document.referrer || "" };
  ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term", "fbclid", "gclid"].forEach(function (k) {
    var v = params.get(k); if (v) touch[k] = v.slice(0, 300);
  });
  // Within this visit (tab) we always keep it, so a reload doesn't lose the ad.
  var sessTouch = get("sessionStorage", "sn-touch");
  if (!touch.utm_source && !touch.fbclid && !touch.gclid && sessTouch) { try { touch = JSON.parse(sessTouch); } catch (e) {} }
  set("sessionStorage", "sn-touch", JSON.stringify(touch));

  function firstTouch() {
    var f = get("localStorage", "sn-first-touch");
    if (f) { try { return JSON.parse(f); } catch (e) {} }
    return touch;
  }
  function visitorId() {
    var v = get("localStorage", "sn-visitor") || get("sessionStorage", "sn-visitor");
    if (!v) { v = rid("v"); set("sessionStorage", "sn-visitor", v); }
    return v;
  }
  function rememberAcrossVisits() {
    if (!get("localStorage", "sn-first-touch")) set("localStorage", "sn-first-touch", JSON.stringify(touch));
    if (!get("localStorage", "sn-visitor")) set("localStorage", "sn-visitor", visitorId());
  }
  function fbc() {
    var c = cookie("_fbc");
    if (c) return c;
    return touch.fbclid ? "fb.1." + Date.now() + "." + touch.fbclid : "";
  }

  /* ---------- Meta Pixel (only after Accept) ---------- */
  var pixelId = "", pixelReady = false, bookingBase = "https://app.sncleaningservices.co.uk/book/sn-cleaning-services";
  function loadPixel() {
    if (pixelReady || !pixelId || consent() !== "accepted") return;
    /* Standard Meta Pixel loader */
    !function (f, b, e, v, n, t, s) { if (f.fbq) return; n = f.fbq = function () { n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments); }; if (!f._fbq) f._fbq = n; n.push = n; n.loaded = !0; n.version = "2.0"; n.queue = []; t = b.createElement(e); t.async = !0; t.src = v; s = b.getElementsByTagName(e)[0]; s.parentNode.insertBefore(t, s); }(window, document, "script", "https://connect.facebook.net/en_US/fbevents.js");
    window.fbq("init", pixelId);
    window.fbq("track", "PageView");
    pixelReady = true;
  }
  function pixel(kind, name, data, eventId) {
    if (!pixelReady || !window.fbq) return false;
    window.fbq(kind, name, data || {}, eventId ? { eventID: eventId } : undefined);
    return true;
  }

  fetch("/api/funnel?action=config&page=" + encodeURIComponent(F.page))
    .then(function (r) { return r.json(); })
    .then(function (c) { pixelId = c.pixelId || ""; if (c.bookingBase) bookingBase = c.bookingBase; loadPixel(); })
    .catch(function () {});

  /* ---------- cookie banner ---------- */
  var banner = document.getElementById("consent");
  if (consent() === "accepted") rememberAcrossVisits();
  if (banner && consent() !== "accepted" && consent() !== "rejected") {
    banner.hidden = false;
    banner.addEventListener("click", function (e) {
      var v = e.target && e.target.getAttribute("data-consent");
      if (!v) return;
      set("localStorage", CONSENT_KEY, v);
      banner.hidden = true;
      if (v === "accepted") { rememberAcrossVisits(); loadPixel(); }
    });
  }

  /* ---------- state ---------- */
  var answers = {};
  var history = [];
  var leadId = get("sessionStorage", "sn-lead-" + F.page) || "";
  var completed = get("sessionStorage", "sn-done-" + F.page) === "1";
  var details = {};
  var startedSent = false;

  function trackClick(type, detail, metaName, custom) {
    var eventId = rid(type + "-");
    var fired = pixel(custom ? "trackCustom" : "track", metaName, { content_name: detail || type }, eventId);
    if (leadId) api({ action: "event", leadId: leadId, type: type, detail: detail || "", eventId: eventId, consent: consent(), pixelFired: fired });
  }

  /* Booking form link with their details filled in (Dilvon reads prefill_*). */
  function bookingUrl(service) {
    var q = new URLSearchParams();
    if (details.firstName) q.set("prefill_first_name", details.firstName);
    if (details.email) q.set("prefill_email", details.email);
    if (details.phone) q.set("prefill_phone", details.phone);
    if (details.postcode) q.set("prefill_postcode", details.postcode);
    if (leadId) q.set("ref", leadId);
    var qs = q.toString();
    return bookingBase.replace(/\/+$/, "") + "/" + service + (qs ? "?" + qs : "");
  }

  /* ---------- rendering ---------- */
  function backBtn() {
    return history.length > 1 ? '<button type="button" class="back" data-back>&larr; Back</button>' : "";
  }
  function ticks(list) {
    return list && list.length ? '<ul class="ticks">' + list.map(function (t) { return "<li>" + esc(t) + "</li>"; }).join("") + "</ul>" : "";
  }
  function letter(i) { return String.fromCharCode(65 + i); }

  function render(id) {
    var s = F.screens[id];
    if (!s) return;
    var h = "";
    if (s.type === "intro") {
      h = s.html;
    } else if (s.type === "single" || s.type === "links") {
      h = backBtn() + "<h2>" + esc(s.title) + "</h2>" + (s.text ? '<p class="lead">' + esc(s.text) + "</p>" : "") +
        (s.question ? '<p class="q">' + esc(s.question) + "</p>" : "") + '<div class="opts">' +
        s.options.map(function (o, i) {
          var inner = '<span class="key">' + letter(i) + '</span><span class="txt"><span>' + esc(o.label) + "</span>" + (o.sub ? "<small>" + esc(o.sub) + "</small>" : "") + "</span>";
          if (o.service) {
            return '<a class="opt" data-service="' + esc(o.service) + '" data-label="' + esc(o.label) + '" href="' + esc(bookingUrl(o.service)) + '">' + inner + "</a>";
          }
          return '<button type="button" class="opt" data-pick="' + i + '">' + inner + "</button>";
        }).join("") + "</div>";
    } else if (s.type === "multi") {
      var picked = answers[s.key] || [];
      h = backBtn() + "<h2>" + esc(s.title) + "</h2>" + (s.text ? '<p class="lead">' + esc(s.text) + "</p>" : "") + '<div class="opts">' +
        s.options.map(function (o, i) {
          return '<button type="button" class="opt check" aria-pressed="' + (picked.indexOf(o) > -1) + '" data-check="' + i + '"><span class="key">&#10003;</span><span class="txt"><span>' + esc(o) + "</span></span></button>";
        }).join("") + '</div><button type="button" class="btn btn-block" data-next>' + esc(s.button || "Continue") + "</button>";
    } else if (s.type === "info") {
      h = backBtn() + "<h2>" + esc(s.title) + "</h2>" + (s.text ? '<p class="lead">' + esc(s.text) + "</p>" : "") + ticks(s.ticks) +
        '<button type="button" class="btn btn-block" data-next>' + esc(s.button || "Continue") + "</button>";
    } else if (s.type === "details") {
      h = backBtn() + "<h2>" + esc(s.title) + "</h2>" + (s.text ? '<p class="lead">' + esc(s.text) + "</p>" : "") + ticks(s.ticks) +
        '<form id="details" novalidate>' +
        '<div class="field"><label for="fn">First name</label><input id="fn" name="first_name" autocomplete="given-name" required value="' + esc(details.firstName) + '"></div>' +
        '<div class="field"><label for="em">Email</label><input id="em" name="email" type="email" autocomplete="email" inputmode="email" required value="' + esc(details.email) + '"></div>' +
        '<div class="field"><label for="ph">Phone</label><input id="ph" name="phone" type="tel" autocomplete="tel" inputmode="tel" required value="' + esc(details.phone) + '"></div>' +
        '<div class="field"><label for="pc">Postcode</label><input id="pc" name="postcode" autocomplete="postal-code" autocapitalize="characters" required value="' + esc(details.postcode) + '"></div>' +
        '<div class="hp" aria-hidden="true"><label>Website <input name="website" tabindex="-1" autocomplete="off"></label></div>' +
        '<p class="err" id="err" hidden></p>' +
        '<button type="submit" class="btn btn-block">' + esc(s.button || "Next") + "</button></form>" +
        (s.helpTitle ? '<div class="help"><h3>' + esc(s.helpTitle) + "</h3>" + (s.helpText ? "<p>" + esc(s.helpText) + "</p>" : "") + ticks(s.helpTicks) + "</div>" : "");
    } else if (s.type === "whatsapp") {
      h = backBtn() + "<h2>" + esc(s.title) + "</h2><p class=\"lead\">" + esc(s.text) + "</p>" +
        '<a class="btn btn-block" data-wa href="https://wa.me/' + WA_NUMBER + "?text=" + encodeURIComponent(s.waText || "") + '" target="_blank" rel="noopener">' + esc(s.button) + "</a>";
    } else if (s.type === "phone") {
      h = backBtn() + "<h2>" + esc(s.title) + "</h2><p class=\"lead\">" + esc(s.text) + "</p>" +
        '<div class="stack"><a class="btn btn-block" data-call href="tel:' + TEL + '">Call us now</a>' +
        '<button type="button" class="btn btn-block btn-line" data-callback="' + esc(s.callbackNext) + '">Request a call back</button></div>';
    } else if (s.type === "end") {
      h = '<div class="end"><h2>' + esc(s.title) + "</h2>" + (s.text ? '<p class="lead">' + esc(s.text) + "</p>" : "") + "</div>";
    }
    root.innerHTML = '<div class="screen">' + h + "</div>";
    root.setAttribute("data-screen", id);
    window.scrollTo(0, 0);
    var focusEl = root.querySelector("h1, h2");
    if (focusEl && history.length > 1) { focusEl.setAttribute("tabindex", "-1"); focusEl.focus({ preventScroll: true }); }
  }

  function go(id) {
    if (!F.screens[id]) return;
    if (!startedSent && id !== F.start) {
      startedSent = true;
      pixel("track", "ViewContent", { content_name: F.page });
    }
    history.push(id);
    try { window.history.pushState({ s: id, n: history.length }, "", "#" + encodeURIComponent(F.screens[id].name || id)); } catch (e) {}
    render(id);
  }

  window.addEventListener("popstate", function () {
    if (history.length > 1) { history.pop(); render(history[history.length - 1]); }
  });

  function back() {
    if (history.length > 1) { try { window.history.back(); } catch (e) { history.pop(); render(history[history.length - 1]); } }
  }

  /* ---------- clicks ---------- */
  root.addEventListener("click", function (e) {
    var t = e.target.closest ? e.target.closest("button, a") : null;
    if (!t) return;
    var cur = F.screens[history[history.length - 1]];

    if (t.hasAttribute("data-back")) { back(); return; }
    if (t.hasAttribute("data-start")) { go(t.getAttribute("data-start")); return; }

    if (t.hasAttribute("data-pick")) {
      var o = cur.options[+t.getAttribute("data-pick")];
      if (cur.key) answers[cur.key] = o.label;
      go(o.next);
      return;
    }
    if (t.hasAttribute("data-check")) {
      var val = cur.options[+t.getAttribute("data-check")];
      var list = answers[cur.key] || (answers[cur.key] = []);
      var at = list.indexOf(val);
      if (at > -1) list.splice(at, 1); else list.push(val);
      t.setAttribute("aria-pressed", at === -1);
      return;
    }
    if (t.hasAttribute("data-next")) { go(cur.next); return; }

    if (t.hasAttribute("data-service")) {
      e.preventDefault();
      var label = t.getAttribute("data-label");
      answers["Booking service"] = label;
      trackClick("booking_click", label, "BookingClick", true);
      var url = bookingUrl(t.getAttribute("data-service"));
      setTimeout(function () { location.href = url; }, 150);
      return;
    }
    if (t.hasAttribute("data-wa")) { trackClick("whatsapp_click", cur.name || "", "Contact"); return; }
    if (t.hasAttribute("data-call")) { trackClick("phone_click", cur.name || "", "Contact"); return; }
    if (t.hasAttribute("data-callback")) {
      trackClick("callback_request", "", "Contact");
      netlifyForm("Call back requested");
      go(t.getAttribute("data-callback"));
      return;
    }
  });

  /* Copy to Netlify Forms so you get the usual email notification. */
  function netlifyForm(request) {
    var flat = Object.keys(answers).map(function (k) { return k + ": " + (Array.isArray(answers[k]) ? answers[k].join(", ") : answers[k]); }).join("\n");
    var body = new URLSearchParams({
      "form-name": "funnel-lead", page: F.page, first_name: details.firstName || "", email: details.email || "",
      phone: details.phone || "", postcode: details.postcode || "", answers: flat, request: request, lead_id: leadId || ""
    });
    fetch("/", { method: "POST", headers: { "content-type": "application/x-www-form-urlencoded" }, body: body.toString(), keepalive: true }).catch(function () {});
  }

  function payload(action, d, extra) {
    var flat = {};
    Object.keys(answers).forEach(function (k) { flat[k] = answers[k]; });
    var b = {
      action: action, page: F.page, leadId: leadId, firstName: d.firstName, email: d.email, phone: d.phone, postcode: d.postcode,
      answers: flat, first: firstTouch(), last: touch, visitorId: visitorId(), consent: consent(),
      fbc: consent() === "accepted" ? fbc() : "", fbp: consent() === "accepted" ? cookie("_fbp") : "",
      pageUrl: location.origin + location.pathname
    };
    if (extra) Object.keys(extra).forEach(function (k) { b[k] = extra[k]; });
    return b;
  }
  // One request at a time, so the first save creates the lead and later ones update it.
  var queue = Promise.resolve();
  function send(body) {
    var p = queue.then(function () { body.leadId = leadId; return api(body); }).then(function (r) {
      if (r && r.leadId) { leadId = r.leadId; set("sessionStorage", "sn-lead-" + F.page, leadId); }
      return r;
    });
    queue = p.catch(function () {});
    return p;
  }

  /* Save name / email / phone as soon as anything is typed, even if they never press Next. */
  var partialTimer = null, lastPartial = "";
  function readForm() {
    var f = document.getElementById("details");
    if (!f) return null;
    return { firstName: f.first_name.value.trim(), email: f.email.value.trim(), phone: f.phone.value.trim(), postcode: normPostcode(f.postcode.value), website: f.website.value };
  }
  function savePartial() {
    clearTimeout(partialTimer);
    if (completed) return;
    var d = readForm();
    if (!d || d.website || (!d.firstName && !d.email && !d.phone && !d.postcode)) return;
    var key = d.firstName + "|" + d.email + "|" + d.phone + "|" + d.postcode;
    if (key === lastPartial) return;
    lastPartial = key;
    details = d;
    send(payload("partial", d)).catch(function () { lastPartial = ""; });
  }
  root.addEventListener("input", function (e) {
    if (!e.target.form || e.target.form.id !== "details") return;
    clearTimeout(partialTimer);
    partialTimer = setTimeout(savePartial, 800);
  });
  root.addEventListener("focusout", function (e) {
    if (e.target.form && e.target.form.id === "details") savePartial();
  });
  document.addEventListener("visibilitychange", function () { if (document.visibilityState === "hidden") savePartial(); });
  window.addEventListener("pagehide", savePartial);

  root.addEventListener("submit", function (e) {
    if (e.target.id !== "details") return;
    e.preventDefault();
    var f = e.target, err = document.getElementById("err");
    var d = { firstName: f.first_name.value.trim(), email: f.email.value.trim(), phone: f.phone.value.trim(), postcode: normPostcode(f.postcode.value) };
    var problem = !d.firstName ? "Please enter your first name." :
      !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(d.email) ? "Please enter a valid email address." :
      d.phone.replace(/\D/g, "").length < 9 ? "Please enter a valid phone number." :
      !/^[A-Z]{1,2}[0-9][A-Z0-9]? ?[0-9][A-Z]{2}$/.test(d.postcode) ? "Please enter your full postcode, e.g. CM15 8AB." : "";
    if (problem) { err.textContent = problem; err.hidden = false; return; }
    err.hidden = true;
    var btn = f.querySelector("button[type=submit]");
    btn.disabled = true;
    details = d;

    clearTimeout(partialTimer);
    var isNew = !completed;

    ensureFbp().then(function () {
      return send(payload("lead", d, { pixelFired: isNew && pixelReady, website: f.website.value }));
    }).then(function (r) {
      btn.disabled = false;
      if (r && r.ok) {
        if (isNew) {
          // Event ID lead_<ref> matches our server event and Dilvon's, so Meta counts one Lead.
          if (leadId) pixel("track", "Lead", { content_name: F.page }, "lead_" + leadId);
          completed = true; set("sessionStorage", "sn-done-" + F.page, "1"); netlifyForm("New lead");
        }
        go(F.screens[history[history.length - 1]].next);
      } else {
        err.textContent = (r && r.error) || "Sorry, something went wrong. Please try again, or message us on WhatsApp.";
        err.hidden = false;
      }
    }).catch(function () {
      btn.disabled = false;
      err.textContent = "Sorry, something went wrong. Please check your connection and try again.";
      err.hidden = false;
    });
  });

  /* ---------- warm the booking form (browsers without speculation rules) ---------- */
  (function () {
    var spec = window.HTMLScriptElement && HTMLScriptElement.supports && HTMLScriptElement.supports("speculationrules");
    var conn = navigator.connection || {};
    if (spec || conn.saveData || /(^|-)2g$/.test(conn.effectiveType || "")) return;
    var go = function () {
      setTimeout(function () {
        var f = document.createElement("iframe");
        f.src = bookingBase.replace(/\/+$/, "") + "/domestic-cleaning?preload=1";
        f.setAttribute("aria-hidden", "true"); f.tabIndex = -1; f.title = "";
        f.style.cssText = "position:absolute;left:-9999px;top:0;width:400px;height:600px;border:0;opacity:0;pointer-events:none;";
        document.body.appendChild(f);
        setTimeout(function () { f.remove(); }, 15000);
      }, 1500);
    };
    if (document.readyState === "complete") go(); else window.addEventListener("load", go, { once: true });
  })();

  /* ---------- start ---------- */
  history.push(F.start);
  try { window.history.replaceState({ s: F.start, n: 1 }, "", location.pathname + location.search); } catch (e) {}
  render(F.start);
})();
