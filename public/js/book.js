// Booking pages: pass postcode/email from this page's URL on to the embedded
// Dilvon form, tell it who is hosting it, and handle its resize/redirect
// messages. Messages are only accepted from the form's own origin, and a
// redirect is only followed to this site or back to the form.
(function () {
  var frame = document.getElementById('booking-frame');
  if (!frame) return;
  var FORM_ORIGIN = frame.getAttribute('data-form-origin');
  var here = new URLSearchParams(window.location.search);

  var base = frame.getAttribute('data-src') || frame.getAttribute('src');
  try {
    var src = new URL(base);
    // Dilvon pre-fills only from the prefill_* names (prefill_email, prefill_postcode).
    ['postcode', 'email'].forEach(function (key) {
      var v = (here.get(key) || '').trim();
      if (!v) return;
      if (key === 'postcode') v = v.toUpperCase();
      src.searchParams.set('prefill_' + key, v);
    });
    src.searchParams.set('embed_origin', window.location.origin);
    frame.setAttribute('src', src.toString());
  } catch (e) { frame.setAttribute('src', base); }

  // "Quoting for RM3 0SH" under the heading when a postcode came with them.
  var pc = (here.get('postcode') || '').trim().toUpperCase();
  var note = document.querySelector('[data-book-for]');
  if (pc && note) {
    note.textContent = 'Quoting for ';
    var b = document.createElement('strong');
    b.textContent = pc;
    note.appendChild(b);
    note.hidden = false;
  }

  window.addEventListener('message', function (e) {
    // dilvon.com forms are served from app.dilvon.com, so accept both.
    var ok = FORM_ORIGIN && (e.origin === FORM_ORIGIN || e.origin === 'https://app.dilvon.com' || e.origin === 'https://dilvon.com');
    if (!ok || !e.data) return;
    if (e.data.type === 'lovable-form-resize' && typeof e.data.height === 'number') {
      // Grow or shrink to exactly the form's height, so the page has no inner scroll.
      frame.style.minHeight = '0';
      frame.style.height = e.data.height + 'px';
      return;
    }
    if (e.data.type === 'lovable-form-redirect' && typeof e.data.url === 'string') {
      try {
        var target = new URL(e.data.url, window.location.href);
        if (target.origin !== window.location.origin && target.origin !== FORM_ORIGIN && target.origin !== e.origin) return;
        // Keep the customer's postcode and email when the landing form sends
        // them on to a service form. A Dilvon form we also host on /book/{slug}
        // opens here; any other form gets them as prefill_* parameters.
        var carry = {};
        ['postcode', 'email'].forEach(function (k) { var v = (here.get(k) || '').trim(); if (v) carry[k] = v; });
        if (target.origin !== window.location.origin) {
          var map = {};
          try { map = JSON.parse(frame.getAttribute('data-form-map') || '{}'); } catch (_) {}
          var local = map[target.pathname.replace(/\/$/, '')];
          if (local) target = new URL(local, window.location.href);
        }
        Object.keys(carry).forEach(function (k) {
          if (target.origin === window.location.origin) target.searchParams.set(k, carry[k]);
          else target.searchParams.set('prefill_' + k, k === 'postcode' ? carry[k].toUpperCase() : carry[k]);
        });
        window.location.href = target.toString();
      } catch (err) { /* ignore a malformed redirect */ }
    }
  });
})();
