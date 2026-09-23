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
    // Dilvon pre-fills from prefill_email / prefill_postcode; the plain names
    // are passed too in case a form reads those.
    ['postcode', 'email'].forEach(function (key) {
      var v = (here.get(key) || '').trim();
      if (!v) return;
      if (key === 'postcode') v = v.toUpperCase();
      src.searchParams.set('prefill_' + key, v);
      src.searchParams.set(key, v);
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
    if (!FORM_ORIGIN || e.origin !== FORM_ORIGIN || !e.data) return;
    if (e.data.type === 'lovable-form-resize' && typeof e.data.height === 'number') {
      frame.style.height = e.data.height + 'px';
      return;
    }
    if (e.data.type === 'lovable-form-redirect' && typeof e.data.url === 'string') {
      try {
        var target = new URL(e.data.url, window.location.href);
        if (target.origin !== window.location.origin && target.origin !== FORM_ORIGIN) return;
        window.location.href = target.toString();
      } catch (err) { /* ignore a malformed redirect */ }
    }
  });
})();
