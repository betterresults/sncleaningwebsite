// Homepage behaviour: coverage map animation + tooltip, quote form a11y.
(function () {
  document.documentElement.classList.add('js');

  // ---------- Coverage map ----------
  const wrap = document.querySelector('[data-cov-map]');
  if (wrap) {
    const svg = wrap.querySelector('.cov-map');
    const tip = wrap.querySelector('.h-cov-tip');
    const areas = [...wrap.querySelectorAll('.cov-area')];

    // Play the west-to-east reveal once the map scrolls into view.
    if ('IntersectionObserver' in window) {
      const io = new IntersectionObserver((entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) { svg.classList.add('is-in'); io.disconnect(); }
        });
      }, { threshold: 0.25 });
      io.observe(svg);
    } else {
      svg.classList.add('is-in');
    }

    const showTip = (a) => {
      areas.forEach((x) => x.classList.toggle('is-active', x === a));
      const hasPage = a.getAttribute('href') !== '#quote';
      tip.innerHTML = '';
      tip.append(a.dataset.name);
      const small = document.createElement('small');
      small.textContent = hasPage ? 'View our local page' : 'Get a quote for this area';
      tip.append(small);
      // Position from the area's centre point in SVG units -> wrapper pixels.
      const vb = svg.viewBox.baseVal;
      const box = svg.getBoundingClientRect();
      const host = wrap.getBoundingClientRect();
      const x = box.left - host.left + (a.dataset.cx / vb.width) * box.width;
      const y = box.top - host.top + (a.dataset.cy / vb.height) * box.height;
      tip.style.left = Math.min(Math.max(x, 80), host.width - 80) + 'px';
      tip.style.top = Math.max(y, 56) + 'px';
      tip.hidden = false;
    };
    const hideTip = () => {
      areas.forEach((x) => x.classList.remove('is-active'));
      tip.hidden = true;
    };

    areas.forEach((a) => {
      a.addEventListener('pointerenter', () => showTip(a));
      a.addEventListener('focus', () => showTip(a));
      a.addEventListener('blur', hideTip);
    });
    svg.addEventListener('pointerleave', hideTip);
  }

  // ---------- Quote form: keep aria-invalid in sync with :user-invalid ----------
  const form = document.querySelector('.h-form');
  if (form) {
    const sync = (el) => {
      if (!el.matches || !el.matches('input, select, textarea')) return;
      let invalid = false;
      try { invalid = el.matches(':user-invalid'); } catch (_) { invalid = !el.checkValidity(); }
      el.setAttribute('aria-invalid', invalid ? 'true' : 'false');
    };
    form.addEventListener('blur', (e) => sync(e.target), true);
    form.addEventListener('input', (e) => { if (e.target.hasAttribute('aria-invalid')) sync(e.target); });
    form.addEventListener('change', (e) => sync(e.target));
  }

  // Quote form -> booking form. Service chosen: /book/{slug}; none: /book
  // (the chooser). Postcode and email travel as URL params, which the booking
  // forms pre-fill. A copy goes to Netlify Forms in the background so the lead
  // is kept even if the booking form is never finished.
  const qf = document.querySelector('[data-quote-form]');
  if (qf) {
    qf.addEventListener('submit', (e) => {
      e.preventDefault();
      if (!qf.reportValidity()) return;
      const service = qf.elements.service.value;
      const postcode = qf.elements.postcode.value.trim().toUpperCase().replace(/\s+/g, ' ');
      const email = qf.elements.email.value.trim();
      if (qf.elements['bot-field'].value) return;

      try {
        const body = new URLSearchParams({ 'form-name': 'quote', service: service || 'Not chosen', postcode, email });
        fetch('/', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: body.toString(), keepalive: true }).catch(() => {});
      } catch (_) { /* never block the redirect */ }

      const params = new URLSearchParams({ postcode, email });
      window.location.href = (service ? '/book/' + encodeURIComponent(service) : '/book') + '?' + params.toString();
    });
  }

  // "Get a quote" buttons further down the page: scroll up and focus the form.
  document.querySelectorAll('a[href="#quote"]').forEach((link) => {
    link.addEventListener('click', () => {
      setTimeout(() => {
        const first = document.getElementById('q-postcode');
        if (first) first.focus({ preventScroll: true });
      }, 450);
    });
  });
})();
