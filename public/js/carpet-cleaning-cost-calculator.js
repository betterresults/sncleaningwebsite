/* Carpet, sofa and mattress cost calculator.
   Indicative guide only. Maths lives in estimate(): the server calls it for
   the first paint, and this script calls it again on each change.
   Item prices and the £120 minimum are passed in from
   data/carpet-cleaning-cost-calculator.js. Do not hard-code a price here.
   Visible sentences use spaces, never compound hyphens. */
(function (root, factory) {
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root && root.document) {
    root.document.addEventListener('DOMContentLoaded', function () {
      api.mount(root.document);
    });
  }
})(typeof window !== 'undefined' ? window : globalThis, function () {
  'use strict';

  function pennies(n) {
    return Math.round(Number(n) * 100);
  }

  function formatMoney(n) {
    var p = pennies(n);
    if (!isFinite(p)) return '';
    if (p % 100 === 0) return '£' + String(p / 100);
    return '£' + (p / 100).toFixed(2);
  }

  function clampInt(value, min, max, fallback) {
    var n = parseInt(value, 10);
    if (!isFinite(n)) n = fallback;
    if (n < min) n = min;
    if (n > max) n = max;
    return n;
  }

  function estimate(state, catalogue) {
    state = state || {};
    catalogue = catalogue || {};
    var minimum = Number(catalogue.minimum);
    if (!isFinite(minimum)) minimum = 120;
    var minPennies = pennies(minimum);
    var selected = state.items || {};
    var lines = [];
    var subtotalPennies = 0;
    var groups = catalogue.groups || [];

    groups.forEach(function (group) {
      var counts = selected[group.key] || {};
      var items = group.items || [];
      items.forEach(function (item) {
        var count = clampInt(counts[item.key], 0, 20, 0);
        if (count < 1) return;
        var linePennies = pennies(item.price) * count;
        subtotalPennies += linePennies;
        lines.push({
          label: count + ' × ' + (item.summary || item.label),
          amount: formatMoney(linePennies / 100)
        });
      });
    });

    var payablePennies = subtotalPennies === 0 ? 0 : Math.max(subtotalPennies, minPennies);
    var roomLeftPennies = subtotalPennies > 0 && subtotalPennies < minPennies ? minPennies - subtotalPennies : 0;
    var minimumState = subtotalPennies === 0 ? 'empty' : (subtotalPennies < minPennies ? 'under' : 'met');
    var minimumText;
    if (minimumState === 'under') {
      minimumText = '£' + (minPennies / 100) + ' minimum visit. You have £' + (roomLeftPennies / 100) + ' of room left to combine another item at no extra cost.';
    } else if (minimumState === 'met') {
      minimumText = '£' + (minPennies / 100) + ' minimum visit met.';
    } else {
      minimumText = '£' + (minPennies / 100) + ' minimum visit. Combine carpets, sofas and mattresses in one visit to reach it.';
    }

    var names = lines.map(function (line) {
      return line.label.replace(/^\d+ × /, '');
    });

    return {
      subtotal: subtotalPennies / 100,
      payable: payablePennies / 100,
      roomLeft: roomLeftPennies / 100,
      totalLabel: formatMoney(payablePennies / 100),
      subtotalLabel: formatMoney(subtotalPennies / 100),
      lines: lines,
      minimumText: minimumText,
      minimumState: minimumState,
      summaryMeta: names.length ? names.join(', ') : 'Nothing selected yet',
      worked: names.length ? names.join(', ') + '.' : 'Nothing selected yet.'
    };
  }

  function readState(form) {
    var items = {};
    var inputs = form.querySelectorAll('input[name^="qty-"]');
    for (var i = 0; i < inputs.length; i++) {
      var rest = inputs[i].name.replace(/^qty-/, '');
      var dash = rest.indexOf('-');
      if (dash < 1) continue;
      var group = rest.slice(0, dash);
      var key = rest.slice(dash + 1);
      if (!items[group]) items[group] = {};
      items[group][key] = inputs[i].value;
    }
    return { items: items };
  }

  function clampInputs(form) {
    var inputs = form.querySelectorAll('input[name^="qty-"]');
    for (var i = 0; i < inputs.length; i++) {
      var next = clampInt(inputs[i].value, 0, 20, 0);
      if (inputs[i].value !== String(next)) inputs[i].value = String(next);
    }
  }

  function setHidden(el, hide) {
    if (!el) return;
    if (hide) el.setAttribute('hidden', '');
    else el.removeAttribute('hidden');
  }

  function setLines(el, lines) {
    if (!el) return;
    while (el.firstChild) el.removeChild(el.firstChild);
    lines.forEach(function (line) {
      var li = el.ownerDocument.createElement('li');
      var name = el.ownerDocument.createElement('span');
      var amount = el.ownerDocument.createElement('span');
      name.textContent = line.label;
      amount.textContent = line.amount;
      li.appendChild(name);
      li.appendChild(amount);
      el.appendChild(li);
    });
  }

  function text(doc, id, value) {
    var el = doc.getElementById(id);
    if (el) el.textContent = value || '';
  }

  function paint(doc, result) {
    text(doc, 'ccc-total', result.totalLabel);
    text(doc, 'ccc-summary-total', result.totalLabel);
    text(doc, 'ccc-summary-meta', result.summaryMeta);
    text(doc, 'ccc-items', (result.minimumState === 'under' ? 'Items chosen ' : '') + (result.minimumState === 'under' ? result.subtotalLabel : ''));
    text(doc, 'ccc-minimum', result.minimumText);
    text(doc, 'ccc-worked', result.worked);
    var minimum = doc.getElementById('ccc-minimum');
    if (minimum) minimum.setAttribute('data-state', result.minimumState);
    var summary = doc.getElementById('ccc-summary');
    if (summary) summary.setAttribute('data-empty', result.minimumState === 'empty' ? '1' : '0');
    setHidden(doc.getElementById('ccc-items'), result.minimumState !== 'under');
    setLines(doc.getElementById('ccc-lines'), result.lines);
  }

  function stepInput(button) {
    var wrap = button.parentNode;
    if (!wrap) return;
    var input = wrap.querySelector('input[type="number"]');
    if (!input) return;
    var next = parseInt(input.value, 10);
    if (!isFinite(next)) next = 0;
    next += parseInt(button.getAttribute('data-step'), 10) || 0;
    var min = parseInt(input.getAttribute('min'), 10);
    var max = parseInt(input.getAttribute('max'), 10);
    if (!isFinite(min)) min = 0;
    if (!isFinite(max)) max = 20;
    if (next < min) next = min;
    if (next > max) next = max;
    input.value = String(next);
  }

  function showTab(doc, key) {
    var tabs = doc.querySelectorAll('[data-ccc-tab]');
    var panels = doc.querySelectorAll('[data-ccc-panel]');
    for (var i = 0; i < tabs.length; i++) {
      var on = tabs[i].getAttribute('data-ccc-tab') === key;
      tabs[i].setAttribute('aria-selected', on ? 'true' : 'false');
      tabs[i].tabIndex = on ? 0 : -1;
    }
    for (var j = 0; j < panels.length; j++) {
      var open = panels[j].getAttribute('data-ccc-panel') === key;
      if (open) panels[j].removeAttribute('hidden');
      else panels[j].setAttribute('hidden', '');
    }
  }

  function catalogueFrom(doc) {
    var node = doc.getElementById('ccc-catalogue');
    if (!node) return null;
    try {
      return JSON.parse(node.textContent || '');
    } catch (err) {
      return null;
    }
  }

  function mount(doc) {
    var form = doc.getElementById('ccc-form');
    if (!form || form.getAttribute('data-bound') === '1') return;
    var catalogue = catalogueFrom(doc);
    if (!catalogue) return;
    form.setAttribute('data-bound', '1');

    function update() {
      clampInputs(form);
      paint(doc, estimate(readState(form), catalogue));
    }

    form.addEventListener('input', update);
    form.addEventListener('change', update);
    form.addEventListener('submit', function (event) {
      event.preventDefault();
      update();
    });
    form.addEventListener('click', function (event) {
      var node = event.target;
      while (node && node !== form) {
        if (node.getAttribute && node.hasAttribute('data-step')) {
          stepInput(node);
          update();
          return;
        }
        node = node.parentNode;
      }
    });

    doc.addEventListener('click', function (event) {
      var node = event.target;
      while (node && node !== doc) {
        if (node.getAttribute && node.hasAttribute('data-ccc-tab')) {
          showTab(doc, node.getAttribute('data-ccc-tab'));
          return;
        }
        if (node.id === 'ccc-reset') {
          var inputs = form.querySelectorAll('input[name^="qty-"]');
          for (var i = 0; i < inputs.length; i++) inputs[i].value = '0';
          update();
          return;
        }
        node = node.parentNode;
      }
    });

    update();
  }

  return { estimate: estimate, mount: mount };
});
