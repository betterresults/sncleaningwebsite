document.addEventListener('DOMContentLoaded', () => {
  // Cookie notice: shown until the visitor clicks OK (remembered in this browser).
  const note = document.getElementById('cookie-note');
  if (note && window.self === window.top) {
    let seen = false;
    try { seen = localStorage.getItem('cookie-note-ok') === '1'; } catch (_) {}
    if (!seen) {
      note.hidden = false;
      document.getElementById('cookie-note-ok').addEventListener('click', () => {
        note.hidden = true;
        try { localStorage.setItem('cookie-note-ok', '1'); } catch (_) {}
      });
    }
  }

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

  // Forms load in advance. The quote/booking forms (Dilvon) sit inside our
  // /book pages and the contact page. As soon as a page has finished loading,
  // every form page it links to is opened once in a hidden frame, one after
  // another, so the form's files are already in the browser cache when the
  // customer clicks and the form appears almost instantly. Skipped on
  // data-saver and very slow connections.
  const isFormPage = (path) => /^\/(book|contact)(\/|$)/.test(path) && !/^\/contact\/success/.test(path);
  const warmed = new Set();
  const queue = [];
  let busy = false;
  const next = () => {
    if (busy || !queue.length) return;
    busy = true;
    const key = queue.shift();
    const f = document.createElement('iframe');
    f.src = key;
    f.setAttribute('aria-hidden', 'true');
    f.tabIndex = -1;
    f.title = '';
    f.style.cssText = 'position:absolute;left:-9999px;top:0;width:400px;height:600px;border:0;opacity:0;pointer-events:none;';
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      try { sessionStorage.setItem('warm:' + key, '1'); } catch (_) {}
      // Give the form inside a few seconds to fetch its files, then move on.
      setTimeout(() => { f.remove(); busy = false; next(); }, 5000);
    };
    f.addEventListener('load', finish);
    setTimeout(finish, 10000); // never get stuck on one page
    document.body.appendChild(f);
  };
  const warmForm = (href) => {
    try {
      const url = new URL(href, location.href);
      if (url.origin !== location.origin || !isFormPage(url.pathname)) return;
      const key = url.pathname.replace(/\/?$/, '/');
      if (key === location.pathname.replace(/\/?$/, '/') || warmed.has(key)) return;
      warmed.add(key);
      try { if (sessionStorage.getItem('warm:' + key)) return; } catch (_) {}
      queue.push(key);
      next();
    } catch (_) { /* never block the page */ }
  };
  const conn = navigator.connection || {};
  const slow = conn.saveData || /(^|-)2g$/.test(conn.effectiveType || '');
  if (!slow && window.self === window.top) {
    const warmAll = () => {
      const hrefs = [];
      const form = document.querySelector('form[data-quote-form]');
      if (form) {
        const svc = form.elements.service && form.elements.service.value;
        hrefs.push(svc ? '/book/' + svc : form.getAttribute('action'));
      }
      document.querySelectorAll('a[href^="/book"], a[href^="/contact"]').forEach((a) => hrefs.push(a.getAttribute('href')));
      hrefs.filter(Boolean).slice(0, 12).forEach(warmForm);
    };
    const idle = window.requestIdleCallback || ((cb) => setTimeout(cb, 300));
    const start = () => idle(warmAll, { timeout: 2000 });
    if (document.readyState === 'complete') start();
    else window.addEventListener('load', start, { once: true });
    // A service picked in the homepage form: get that form ready first.
    document.addEventListener('change', (e) => {
      if (e.target.matches && e.target.matches('form[data-quote-form] select[name="service"]') && e.target.value) {
        const key = '/book/' + e.target.value + '/';
        if (!warmed.has(key)) { warmForm(key); const i = queue.indexOf(key); if (i > 0) { queue.splice(i, 1); queue.unshift(key); } }
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
        const open = link.parentElement.classList.toggle('open');
        link.setAttribute('aria-expanded', open ? 'true' : 'false');
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
