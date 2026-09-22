document.addEventListener('DOMContentLoaded', () => {
  const toggle = document.getElementById('nav-toggle');
  const nav = document.getElementById('main-nav');

  if (toggle && nav) {
    const setOpen = (open) => {
      nav.classList.toggle('nav-open', open);
      toggle.classList.toggle('active', open);
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      document.body.classList.toggle('nav-open', open);
    };
    toggle.setAttribute('aria-expanded', 'false');
    toggle.addEventListener('click', () => setOpen(!nav.classList.contains('nav-open')));
    nav.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', () => {
        if (window.innerWidth > 1040) return;
        if (link.parentElement.classList.contains('nav-dropdown')) return;
        setOpen(false);
      });
    });
  }

  // Services dropdown: tap-to-open on mobile/tablet (hover doesn't work on touch).
  // 1040px matches the .main-nav collapse breakpoint in style.css — must stay in sync.
  document.querySelectorAll('.nav-dropdown > a').forEach((link) => {
    link.addEventListener('click', (e) => {
      if (window.innerWidth <= 1040) {
        e.preventDefault();
        link.parentElement.classList.toggle('open');
      }
    });
  });

  // Room photo carousel — tabs, arrows, dots and swipe all share one scroll position
  const track = document.getElementById('checklist-track');
  if (track) {
    const slides = [...track.querySelectorAll('.checklist-slide')];
    const tabs = [...document.querySelectorAll('.checklist-tab')];
    const pagers = [...document.querySelectorAll('.checklist-pager')];
    const prevBtn = document.querySelector('.checklist-nav-btn[data-dir="-1"]');
    const nextBtn = document.querySelector('.checklist-nav-btn[data-dir="1"]');
    let activeIndex = 0;

    const goTo = (index) => {
      const next = Math.max(0, Math.min(slides.length - 1, index));
      const origin = slides[0].offsetLeft;
      track.scrollTo({ left: slides[next].offsetLeft - origin, behavior: 'auto' });
      setActive(next);
    };

    const setActive = (index) => {
      activeIndex = index;
      tabs.forEach((tab, i) => {
        const on = i === index;
        tab.classList.toggle('active', on);
        tab.setAttribute('aria-selected', on ? 'true' : 'false');
        if (on && tab.parentElement) {
          const scroller = tab.parentElement;
          const left = tab.offsetLeft - (scroller.clientWidth - tab.offsetWidth) / 2;
          scroller.scrollTo({ left: Math.max(0, left), behavior: 'auto' });
        }
      });
      pagers.forEach((pager, i) => {
        const on = i === index;
        pager.classList.toggle('active', on);
        if (on) pager.setAttribute('aria-current', 'true');
        else pager.removeAttribute('aria-current');
      });
      if (prevBtn) prevBtn.disabled = index === 0;
      if (nextBtn) nextBtn.disabled = index === slides.length - 1;
    };

    tabs.forEach((tab) => {
      tab.addEventListener('click', () => goTo(Number(tab.dataset.index)));
    });
    pagers.forEach((pager) => {
      pager.addEventListener('click', () => goTo(Number(pager.dataset.index)));
    });
    if (prevBtn) prevBtn.addEventListener('click', () => goTo(activeIndex - 1));
    if (nextBtn) nextBtn.addEventListener('click', () => goTo(activeIndex + 1));
    if (prevBtn) prevBtn.disabled = true;

    track.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight') { e.preventDefault(); goTo(activeIndex + 1); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); goTo(activeIndex - 1); }
    });

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible) setActive(Number(visible.target.dataset.index));
      },
      { root: track, threshold: [0.45, 0.7, 0.9] }
    );
    slides.forEach((slide) => observer.observe(slide));

    let resizeTimer;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => goTo(activeIndex), 80);
    });
  }

  // Prefill contact form from sticky/hero quote links (?postcode= or legacy ?zip=)
  const params = new URLSearchParams(window.location.search);
  const serviceParam = params.get('service');
  const serviceSelect = document.getElementById('service');
  if (serviceParam && serviceSelect) {
    [...serviceSelect.options].forEach((opt) => {
      if (opt.value === serviceParam) opt.selected = true;
    });
  }
  const postcodeParam = params.get('postcode') || params.get('zip');
  const postcodeInput = document.getElementById('postcode');
  if (postcodeParam && postcodeInput) {
    postcodeInput.value = postcodeParam;
  }
});

// ---------------------------------------------------------------------------
// Postcode forms (the sticky quote bar, the homepage hero).
// Stops a malformed postcode being carried through to a booking form, and says
// why. Whether we actually COVER a postcode is checked on the service page,
// where the per-service coverage list is known.
// ---------------------------------------------------------------------------
document.addEventListener('DOMContentLoaded', function () {
  var FULL = /^[A-Z]{1,2}[0-9][A-Z0-9]?[0-9][A-Z]{2}$/;
  var OUTWARD = /^[A-Z]{1,2}[0-9][A-Z0-9]?$/;

  function looksLikePostcode(value) {
    var v = String(value || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
    return v === '' || FULL.test(v) || OUTWARD.test(v);
  }

  document.querySelectorAll('.js-postcode-form').forEach(function (form) {
    var input = form.querySelector('.js-postcode');
    if (!input) return;

    var msg = form.parentNode.querySelector('.js-postcode-msg');

    form.addEventListener('submit', function (e) {
      if (looksLikePostcode(input.value)) return;
      e.preventDefault();
      if (msg) {
        msg.textContent = 'That does not look like a UK postcode.';
        msg.hidden = false;
      }
      input.setAttribute('aria-invalid', 'true');
      input.focus();
    });

    input.addEventListener('input', function () {
      input.removeAttribute('aria-invalid');
      if (msg) msg.hidden = true;
    });
  });
});
