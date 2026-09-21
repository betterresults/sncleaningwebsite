document.addEventListener('DOMContentLoaded', () => {
  const toggle = document.getElementById('nav-toggle');
  const nav = document.getElementById('main-nav');

  if (toggle && nav) {
    toggle.addEventListener('click', () => {
      nav.classList.toggle('nav-open');
      toggle.classList.toggle('active');
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

  // "What Cleaning Consists Of" tab switcher
  const tabs = document.querySelectorAll('.checklist-tab');
  const panels = document.querySelectorAll('.checklist-panel-wrap');
  tabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      const target = tab.getAttribute('data-target');
      tabs.forEach((t) => {
        t.classList.remove('active');
        t.setAttribute('aria-selected', 'false');
      });
      tab.classList.add('active');
      tab.setAttribute('aria-selected', 'true');
      panels.forEach((p) => {
        p.classList.toggle('hidden', p.getAttribute('data-panel') !== target);
      });
    });
  });

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
