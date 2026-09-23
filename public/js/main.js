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

  // Booking forms load in advance. The forms are hosted by Dilvon inside our
  // /book pages; loading the booking page once in a hidden frame puts the
  // form's files in the browser cache, so when the customer clicks
  // "Get a quote" the form opens almost instantly. Skipped on data-saver and
  // very slow connections, and on the booking pages themselves.
  const warmed = new Set();
  const warmBooking = (href) => {
    try {
      const url = new URL(href, location.href);
      if (url.origin !== location.origin || !/^\/book(\/|$)/.test(url.pathname)) return;
      const key = url.pathname.replace(/\/?$/, '/');
      if (warmed.has(key)) return;
      warmed.add(key);
      try { if (sessionStorage.getItem('warm:' + key)) return; } catch (_) {}
      const f = document.createElement('iframe');
      f.src = key;
      f.setAttribute('aria-hidden', 'true');
      f.tabIndex = -1;
      f.title = '';
      f.style.cssText = 'position:absolute;left:-9999px;top:0;width:400px;height:600px;border:0;opacity:0;pointer-events:none;';
      f.addEventListener('load', () => {
        try { sessionStorage.setItem('warm:' + key, '1'); } catch (_) {}
        setTimeout(() => f.remove(), 8000); // let the form finish loading its files
      });
      document.body.appendChild(f);
    } catch (_) { /* never block the page */ }
  };
  const conn = navigator.connection || {};
  const slow = conn.saveData || /(^|-)2g$/.test(conn.effectiveType || '');
  if (!slow && !/^\/book(\/|$)/.test(location.pathname)) {
    const primaryBookingHref = () => {
      const form = document.querySelector('form[data-quote-form]');
      if (form) {
        const svc = form.elements.service && form.elements.service.value;
        return svc ? '/book/' + svc : form.getAttribute('action');
      }
      const link = document.querySelector('a[href^="/book"]');
      return link && link.getAttribute('href');
    };
    const start = () => { const h = primaryBookingHref(); if (h) warmBooking(h); };
    const idle = window.requestIdleCallback || ((cb) => setTimeout(cb, 1500));
    if (document.readyState === 'complete') idle(start, { timeout: 3000 });
    else window.addEventListener('load', () => idle(start, { timeout: 3000 }));
    // A service picked in the homepage form: get that form ready too.
    document.addEventListener('change', (e) => {
      if (e.target.matches && e.target.matches('form[data-quote-form] select[name="service"]') && e.target.value) {
        warmBooking('/book/' + e.target.value);
      }
    });
  }

  // Card click feedback: a soft ripple from the tap point (CSS does the press).
  if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    document.addEventListener('pointerdown', (e) => {
      const card = e.target.closest('a.h-svc, a.service-card');
      if (!card || e.button > 0) return;
      const r = card.getBoundingClientRect();
      const dot = document.createElement('span');
      dot.className = 'tap-ripple';
      dot.style.left = (e.clientX - r.left) + 'px';
      dot.style.top = (e.clientY - r.top) + 'px';
      card.appendChild(dot);
      dot.addEventListener('animationend', () => dot.remove());
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
