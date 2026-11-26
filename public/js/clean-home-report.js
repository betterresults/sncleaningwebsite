(function () {
  var explorer = document.querySelector('[data-chr-explorer]');
  if (explorer) {
    var buttons = explorer.querySelectorAll('[data-theme]');
    var cards = explorer.querySelectorAll('[data-theme-card]');
    var status = explorer.querySelector('[data-chr-status]');
    var labels = {
      all: 'all themes',
      mood: 'mood and stress',
      sleep: 'sleep',
      focus: 'focus and motivation',
      relationships: 'relationships and family life'
    };

    function apply(theme) {
      var shown = 0;
      cards.forEach(function (card) {
        var match = theme === 'all' || card.getAttribute('data-theme-card') === theme;
        card.hidden = !match;
        if (match) shown += 1;
      });
      buttons.forEach(function (button) {
        button.setAttribute('aria-pressed', button.getAttribute('data-theme') === theme ? 'true' : 'false');
      });
      if (status) {
        status.textContent = 'Showing ' + shown + (shown === 1 ? ' finding' : ' findings') + ' for ' + (labels[theme] || 'this theme') + '.';
      }
    }

    buttons.forEach(function (button) {
      button.addEventListener('click', function () {
        apply(button.getAttribute('data-theme'));
      });
    });
  }

  var years = document.querySelector('[data-chr-years]');
  if (years) {
    var yearButtons = years.querySelectorAll('[data-year]');
    var panels = years.querySelectorAll('[data-year-panel]');
    var yearStatus = years.querySelector('[data-year-live]');
    var names = { '2026': 'March 2026', '2015': '2015' };

    function showYear(year) {
      panels.forEach(function (panel) {
        panel.classList.toggle('is-shown', panel.getAttribute('data-year-panel') === year);
      });
      yearButtons.forEach(function (button) {
        button.setAttribute('aria-pressed', button.getAttribute('data-year') === year ? 'true' : 'false');
      });
      if (yearStatus) {
        yearStatus.textContent = 'Showing the ' + (names[year] || year) + ' snapshot.';
      }
    }

    years.classList.add('is-ready');
    showYear('2026');
    yearButtons.forEach(function (button) {
      button.addEventListener('click', function () {
        showYear(button.getAttribute('data-year'));
      });
    });
  }

  var tocLinks = document.querySelectorAll('.chr-toc a[href^="#"]');
  if (tocLinks.length && 'IntersectionObserver' in window) {
    var byId = {};
    tocLinks.forEach(function (link) {
      byId[link.getAttribute('href').slice(1)] = link;
    });
    var current = null;
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var link = byId[entry.target.id];
        if (!link || link === current) return;
        if (current) current.removeAttribute('aria-current');
        link.setAttribute('aria-current', 'location');
        current = link;
      });
    }, { rootMargin: '-30% 0px -60% 0px', threshold: 0 });
    Object.keys(byId).forEach(function (id) {
      var section = document.getElementById(id);
      if (section) observer.observe(section);
    });
  }
})();
