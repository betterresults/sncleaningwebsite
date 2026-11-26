/* End of tenancy cleaning cost calculator.
   Indicative guide only. Maths lives in estimate() — the server calls it for
   the first paint, and this script calls it again on each input or change.
   Prices, add-on rates and Silvia's team and time guide are passed in from
   data/eot-prices.js. Do not hard-code a base price, an oven price, a carpet
   rate or an extra-bathroom rate in this file. */
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

  function find(list, pred) {
    if (!list) return null;
    for (var i = 0; i < list.length; i++) {
      if (pred(list[i])) return list[i];
    }
    return null;
  }

  function clampInt(value, min, max, fallback) {
    var n = parseInt(value, 10);
    if (!isFinite(n)) n = fallback;
    if (n < min) n = min;
    if (n > max) n = max;
    return n;
  }

  function guideRow(timeGuide, home) {
    return find(timeGuide, function (row) { return row.home === home; });
  }

  function sentence(value) {
    var text = value || '';
    if (!text) return '';
    return text.charAt(0).toUpperCase() + text.slice(1);
  }

  function schedule(property, beds, baths, furn, timeGuide) {
    var n = beds === 'studio' ? 0 : parseInt(beds, 10);
    var home = n >= 4 ? '4 bedrooms and more' : (n === 0 ? 'Studio flat' : n + ' bedroom flat');
    var row = guideRow(timeGuide, home);
    var houseRow = guideRow(timeGuide, 'Houses');
    var note = '';
    if (furn > 0 && n < 4) {
      note = furn === 2
        ? 'A furnished home always has at least two cleaners, because furniture has to be moved.'
        : 'A part furnished home is not empty, so plan on at least two cleaners.';
    }
    var house = '';
    if (property === 'house' && houseRow) {
      house = 'A house takes ' + houseRow.hours + ', with the same team.';
    }
    return {
      home: row ? row.home : home,
      team: sentence(row ? row.team : ''),
      hours: sentence(row ? row.hours : ''),
      note: note,
      house: house
    };
  }

  function estimate(state, catalogue) {
    state = state || {};
    catalogue = catalogue || {};
    var property = state.property === 'house' ? 'house' : 'flat';
    var beds = String(state.bedrooms || '2');
    if (property === 'house' && beds === 'studio') beds = '1';
    var allowed = property === 'house'
      ? { '1': 1, '2': 1, '3': 1, '4': 1, '5': 1, '6': 1 }
      : { studio: 1, '1': 1, '2': 1, '3': 1, '4': 1, '5': 1, '6': 1 };
    if (!allowed[beds]) beds = '2';
    var baths = clampInt(state.bathrooms, 1, 4, 1);
    var furn = clampInt(state.furnishing, 0, 2, 0);
    var furnishing = catalogue.furnishing || ['Unfurnished', 'Part furnished', 'Furnished'];
    var list = property === 'house' ? catalogue.houses : catalogue.flats;
    var bedsNum = beds === 'studio' ? 0 : parseInt(beds, 10);
    var row = find(list, function (item) { return item.beds === bedsNum; });
    var oven = find(catalogue.ovens, function (item) { return item.key === state.oven; }) || (catalogue.ovens && catalogue.ovens[0]) || { key: 'none', label: 'No oven to clean', price: 0 };
    var bathRates = catalogue.extraBathroom || [];
    var bathRate = bathRates[furn];
    var extraBaths = baths - 1;

    var lines = [];
    var total = 0;
    if (row && row.prices && row.prices.length > furn && bathRate != null) {
      var base = pennies(row.prices[furn]);
      total += base;
      lines.push({ label: row.label + ', ' + String(furnishing[furn] || '').toLowerCase(), amount: formatMoney(base / 100) });
      if (extraBaths > 0) {
        var bathPennies = pennies(bathRate) * extraBaths;
        total += bathPennies;
        lines.push({
          label: extraBaths + ' extra bathroom' + (extraBaths > 1 ? 's' : ''),
          amount: formatMoney(bathPennies / 100)
        });
      }
      var ovenPennies = pennies(oven.price || 0);
      total += ovenPennies;
      lines.push({ label: oven.label || 'Oven', amount: formatMoney(ovenPennies / 100) });

      var selected = state.carpets || {};
      var carpets = catalogue.carpets || [];
      carpets.forEach(function (item) {
        var count = clampInt(selected[item.key], 0, 12, 0);
        if (count < 1) return;
        var linePennies = pennies(item.price) * count;
        total += linePennies;
        lines.push({
          label: count + ' × ' + item.label + ' carpet',
          amount: formatMoney(linePennies / 100)
        });
      });
    }

    var team = schedule(property, beds, baths, furn, catalogue.timeGuide || []);
    var place = row ? row.label : 'Home';
    var furnName = String(furnishing[furn] || '').toLowerCase();
    var carpetBits = [];
    lines.forEach(function (line) {
      if (/carpet$/.test(line.label)) carpetBits.push(line.label.replace(/ carpet$/, ''));
    });
    var worked = place + ', ' + furnName + ', ' + baths + (baths === 1 ? ' bathroom' : ' bathrooms');
    worked += oven.price ? ', ' + String(oven.label || 'oven').toLowerCase() : ', no oven';
    worked += carpetBits.length ? ', carpet cleaning: ' + carpetBits.join(', ') : ', no carpet cleaning';
    worked += '.';

    var article = /^[aeiou]/i.test(furnName) ? 'an' : 'a';
    var bathHint = bathRate == null
      ? 'One bathroom is included in the price.'
      : 'One bathroom is included. Each extra bathroom is ' + formatMoney(bathRate) + ' for ' + article + ' ' + furnName + ' home.';

    return {
      totalLabel: formatMoney(total / 100),
      lines: lines,
      summaryMeta: place + ', ' + furnName,
      bathHint: bathHint,
      teamHome: team.home,
      team: team.team,
      hours: team.hours,
      teamNote: team.note,
      house: team.house,
      worked: worked
    };
  }

  function readState(form) {
    function chosen(name) {
      var el = form.querySelector('input[name="' + name + '"]:checked');
      return el ? el.value : '';
    }
    var carpets = {};
    var inputs = form.querySelectorAll('input[name^="carpet-"]');
    for (var i = 0; i < inputs.length; i++) {
      carpets[inputs[i].name.replace(/^carpet-/, '')] = inputs[i].value;
    }
    return {
      property: chosen('property'),
      bedrooms: chosen('bedrooms'),
      bathrooms: chosen('bathrooms'),
      furnishing: chosen('furnishing'),
      oven: chosen('oven'),
      carpets: carpets
    };
  }

  function normaliseForm(form) {
    var property = form.querySelector('input[name="property"]:checked');
    var house = property && property.value === 'house';
    form.setAttribute('data-property', house ? 'house' : 'flat');
    var studio = form.querySelector('input[name="bedrooms"][value="studio"]');
    if (!studio) return;
    studio.disabled = !!house;
    if (house && studio.checked) {
      var one = form.querySelector('input[name="bedrooms"][value="1"]');
      if (one) one.checked = true;
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
    text(doc, 'ecc-total', result.totalLabel);
    text(doc, 'ecc-summary-total', result.totalLabel);
    text(doc, 'ecc-summary-meta', result.summaryMeta);
    text(doc, 'ecc-bath-hint', result.bathHint);
    text(doc, 'ecc-team-home', 'Published guide: ' + (result.teamHome || '') + '.');
    text(doc, 'ecc-team', result.team);
    text(doc, 'ecc-hours', result.hours);
    text(doc, 'ecc-team-note', result.teamNote);
    text(doc, 'ecc-house', result.house);
    text(doc, 'ecc-worked', result.worked);
    setHidden(doc.getElementById('ecc-team-note'), !result.teamNote);
    setHidden(doc.getElementById('ecc-house'), !result.house);
    setLines(doc.getElementById('ecc-lines'), result.lines);
  }

  function stepCarpet(button) {
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
    if (!isFinite(max)) max = 12;
    if (next < min) next = min;
    if (next > max) next = max;
    input.value = String(next);
  }

  function catalogueFrom(doc) {
    var node = doc.getElementById('ecc-catalogue');
    if (!node) return null;
    try {
      return JSON.parse(node.textContent || '');
    } catch (err) {
      return null;
    }
  }

  function mount(doc) {
    var form = doc.getElementById('ecc-form');
    if (!form || form.getAttribute('data-bound') === '1') return;
    var catalogue = catalogueFrom(doc);
    if (!catalogue) return;
    form.setAttribute('data-bound', '1');
    function update() {
      normaliseForm(form);
      paint(doc, estimate(readState(form), catalogue));
    }
    form.addEventListener('input', update);
    form.addEventListener('change', update);
    form.addEventListener('click', function (event) {
      var node = event.target;
      while (node && node !== form) {
        if (node.getAttribute && node.hasAttribute('data-step')) {
          stepCarpet(node);
          update();
          return;
        }
        node = node.parentNode;
      }
    });
    form.addEventListener('submit', function (event) {
      event.preventDefault();
      update();
    });
    update();
  }

  return { estimate: estimate, mount: mount };
});
