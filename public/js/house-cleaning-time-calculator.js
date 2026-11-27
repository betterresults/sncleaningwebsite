/* House cleaning time calculator.
   Indicative guide only. Maths lives in estimate() — the server calls it for
   the first paint, and this script calls it again on each input or change.
   Hourly rates and "from" labels are passed in from data/prices.js.
   Do not hard-code a £ rate, an add on price, or an end of tenancy hourly rate.
   Add ons change time only. Inside fridge and interior windows add no time
   on an end of tenancy clean (they are part of a typical visit). */
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

  var BASE = {
    studio: { regular: 3, deep: 3.5, eot: 3.5 },
    '1': { regular: 3, deep: 4, eot: 3.5 },
    '2': { regular: 3.5, deep: 5, eot: 4.5 },
    '3': { regular: 4.5, deep: 6.5, eot: 5.5 },
    '4': { regular: 5.5, deep: 8, eot: 6.5 },
    '5': { regular: 6.5, deep: 10, eot: 7.5 }
  };

  var CONDITION = {
    well: { regular: 0, deep: 0, eot: 0 },
    average: { regular: 0.5, deep: 1, eot: 0.5 },
    extra: { regular: 1, deep: 1.5, eot: 1 }
  };

  var LIMITS = {
    regular: { min: 3, max: 10 },
    deep: { min: 3, max: 24 },
    eot: { min: 3, max: 10 }
  };

  var SERVICE_NAME = {
    regular: 'Regular domestic clean',
    deep: 'One off deep clean',
    eot: 'End of tenancy clean'
  };

  var SUMMARY_NAME = {
    regular: 'Regular domestic',
    deep: 'Deep clean',
    eot: 'End of tenancy'
  };

  var CTA_NOTE = {
    regular: 'Opens the regular domestic cleaning booking form.',
    deep: 'Opens the one off deep cleaning booking form.',
    eot: 'Opens the end of tenancy cleaning booking form.'
  };

  function toQuarter(n) {
    return Math.round(n * 4) / 4;
  }

  function toHalf(n) {
    return Math.round(n * 2) / 2;
  }

  function formatBound(n) {
    var rounded = toHalf(n);
    if (Math.abs(rounded - Math.round(rounded)) < 1e-9) return String(Math.round(rounded));
    return rounded.toFixed(1);
  }

  function formatMid(n) {
    var rounded = Math.round(n * 100) / 100;
    if (Math.abs(rounded - Math.round(rounded)) < 1e-9) return String(Math.round(rounded));
    return String(rounded);
  }

  function formatMoney(hourly, hours) {
    var pennies = Math.round(Number(hourly) * Number(hours) * 100);
    if (!isFinite(pennies)) return '';
    if (pennies % 100 === 0) return '£' + String(pennies / 100);
    return '£' + (pennies / 100).toFixed(2);
  }

  function joinAnd(items) {
    if (!items.length) return '';
    if (items.length === 1) return items[0];
    if (items.length === 2) return items[0] + ' and ' + items[1];
    return items.slice(0, -1).join(', ') + ' and ' + items[items.length - 1];
  }

  function displayRange(mid, minH, maxH) {
    var clamped = Math.min(maxH, Math.max(minH, mid));
    var low = toHalf(clamped - 0.5);
    var high = toHalf(clamped + 0.5);
    if (low < minH) low = minH;
    if (high > maxH) high = maxH;
    if (high - low < 0.5) {
      if (low + 0.5 <= maxH) high = low + 0.5;
      else low = Math.max(minH, high - 0.5);
    }
    if (high < low) high = low;
    return { low: low, high: high, mid: clamped };
  }

  function bathCountOf(value) {
    var n = parseInt(value, 10);
    if (!isFinite(n) || n < 1) n = 1;
    if (n > 4) n = 4;
    return n;
  }

  function teamCopy(service, beds, baths, mid) {
    if (service === 'eot') {
      var small = beds === 'studio' || beds === '1';
      if (small && baths === 1) {
        return 'On an end of tenancy clean, often one cleaner for an empty 1 bed, or at least two if the home is still furnished.';
      }
      if (beds === '2' || beds === '3') {
        return 'On an end of tenancy clean, usually two cleaners, sometimes three for a larger home.';
      }
      if (beds === '4' || beds === '5') {
        return 'On an end of tenancy clean, usually three cleaners.';
      }
      return 'On an end of tenancy clean, a furnished home always gets at least two cleaners, because furniture has to be moved. An empty one or two bedroom flat with one bathroom can be done by one cleaner working a longer day.';
    }
    var text = 'You choose the total hours on the booking form (3 hour minimum). One cleaner is typical for a regular visit; a longer deep clean can be arranged as a longer visit or a small team — confirm this when you book.';
    if (mid >= 6) {
      text += ' A two cleaner team can finish a long visit in less elapsed time, if you would like to ask for that when you book.';
    }
    return text;
  }

  function frequencyCopy(service, state) {
    if (service === 'deep') {
      return {
        name: 'One off',
        reason: 'A deep clean is a one off reset. After that, a regular domestic visit (weekly or fortnightly) is how most homes stay on top.'
      };
    }
    if (service === 'eot') {
      return {
        name: 'One off',
        reason: 'An end of tenancy clean is a one off move out clean, priced by the size of the property rather than by the hour.'
      };
    }
    var large = state.bedrooms === '4' || state.bedrooms === '5';
    var weekly = state.condition === 'extra' || state.pets === 'pets' || large;
    if (!weekly) {
      var cond = state.condition === 'well' ? 'well maintained' : 'average lived in';
      var bed = state.bedrooms === 'studio' ? 'studio' : state.bedrooms + ' bed';
      var article = cond.charAt(0) === 'a' ? 'an' : 'a';
      return {
        name: 'Fortnightly',
        reason: 'A fortnightly visit is usually enough to keep ' + article + ' ' + cond + ' ' + bed + ' on top.'
      };
    }
    if (large && state.pets !== 'pets' && state.condition !== 'extra') {
      return {
        name: 'Weekly',
        reason: 'Weekly is a better fit for a home with four or more bedrooms.'
      };
    }
    var parts = [];
    if (state.pets === 'pets') parts.push('there are pets');
    if (state.condition === 'extra') parts.push('the home needs extra attention');
    if (large) parts.push('the home has four or more bedrooms');
    var reason = 'Weekly is a better fit when ' + parts[0];
    if (parts.length === 2) reason += ', or when ' + parts[1];
    if (parts.length > 2) reason += ', when ' + parts[1] + ', or when ' + parts[2];
    return { name: 'Weekly', reason: reason + '.' };
  }

  function workedCopy(service, beds, baths, condition, pets, picked) {
    var bedPhrase = {
      studio: 'a studio',
      '1': 'a 1 bedroom home',
      '2': 'a 2 bedroom home',
      '3': 'a 3 bedroom home',
      '4': 'a 4 bedroom home',
      '5': 'a 5 bedroom or larger home'
    }[beds] || 'a home';
    var bathPhrase = baths === 1 ? '1 bathroom' : baths + ' bathrooms';
    var condBit = {
      well: 'in well maintained condition',
      average: 'in average lived in condition',
      extra: 'where the home needs extra attention'
    }[condition] || 'in average lived in condition';
    var petPhrase = pets === 'pets' ? 'pets' : 'no pets';
    var line = SERVICE_NAME[service] + ' for ' + bedPhrase + ' with ' + bathPhrase + ', ' + condBit + ', with ' + petPhrase;
    if (picked.length) {
      line += ' and ' + joinAnd(picked) + (picked.length > 1 ? ' as optional add ons' : ' as an optional add on');
    } else {
      line += ' and no optional add ons';
    }
    return line + '.';
  }

  function noteCopy(service, state) {
    var notes = [];
    if (state.pets === 'pets') {
      notes.push('Homes with pets often need a little extra time for hair and floors; there is no separate pet fee on the booking form.');
    }
    if (state.oven) {
      notes.push('Cleaning inside the oven is an optional add on, not a standalone oven cleaning service. It is priced on the booking form by oven type, and shown before you confirm.');
    }
    if (state.fridge) {
      if (service === 'eot') {
        notes.push('Inside the fridge and freezer is already included in a typical end of tenancy clean when the appliance is empty and has been switched off to defrost. It is not charged as an extra.');
      } else if (service === 'deep') {
        notes.push('Inside the fridge and freezer is included in this time guide. On a deep clean it is done if the appliance is empty or you can make room. The booking form shows the exact total before you confirm.');
      } else {
        notes.push('Inside the fridge and freezer adds time on top of a regular visit, which otherwise includes the fridge exterior. The booking form shows the exact total before you confirm.');
      }
    }
    if (state.windows) {
      if (service === 'eot') {
        notes.push('Interior windows and other internal glass are already included in a typical end of tenancy clean. Outside windows are not included. This is not charged as an extra.');
      } else {
        notes.push('Interior windows are included in this time guide. Outside windows are not included. The booking form shows the exact total before you confirm.');
      }
    }
    return notes;
  }

  function estimate(state, rates) {
    state = state || {};
    rates = rates || {};
    var labels = rates.labels || {};
    var service = state.service === 'deep' || state.service === 'eot' ? state.service : 'regular';
    var beds = Object.prototype.hasOwnProperty.call(BASE, state.bedrooms) ? state.bedrooms : '2';
    var baths = bathCountOf(state.bathrooms);
    var condition = CONDITION[state.condition] ? state.condition : 'average';
    var pets = state.pets === 'pets' ? 'pets' : 'none';
    var oven = !!state.oven;
    var fridge = !!state.fridge;
    var windows = !!state.windows;
    var normalised = {
      service: service,
      bedrooms: beds,
      bathrooms: String(baths),
      condition: condition,
      pets: pets,
      oven: oven,
      fridge: fridge,
      windows: windows
    };

    var extraBaths = baths - 1;
    var bathAdd = service === 'deep' ? extraBaths * 0.75 : extraBaths * 0.5;
    var addon = 0;
    if (oven) addon += 0.5;
    if (fridge && service !== 'eot') addon += 0.5;
    if (windows && service !== 'eot') addon += 0.5;
    var raw = toQuarter(
      BASE[beds][service] +
      bathAdd +
      CONDITION[condition][service] +
      (pets === 'pets' ? 0.5 : 0) +
      addon
    );
    var limits = LIMITS[service];
    var range = displayRange(raw, limits.min, limits.max);
    var priceLabel = labels[service] || '';
    var frequency = frequencyCopy(service, normalised);
    var picked = [];
    if (oven) picked.push('inside the oven');
    if (fridge) picked.push('inside the fridge/freezer');
    if (windows) picked.push('interior windows');

    var hoursNote = '';
    if (service === 'eot' && raw > 6) {
      hoursNote = 'Often at the longer end, and sometimes longer than the typical 3–6 hours.';
    }
    if (raw > limits.max) {
      var cap = service === 'deep'
        ? 'The booking form allows up to 24 hours for a deep clean, so this guide stops there.'
        : service === 'eot'
          ? 'This guide stops at 10 hours on screen. A large end of tenancy clean can take longer.'
          : 'The booking form allows up to 10 hours for a regular visit, so this guide stops there.';
      hoursNote = hoursNote ? hoursNote + ' ' + cap : cap;
    }

    var example = '';
    var showHourlyExample = service !== 'eot';
    if (showHourlyExample) {
      var hourly = service === 'deep' ? rates.deepHourly : rates.regularHourly;
      example = hourly
        ? 'Guide only. A ' + formatMid(range.mid) + ' hour visit would start from ' + formatMoney(hourly, range.mid) + ' at the published from rate, before any add ons.'
        : 'Guide only. The booking form shows the exact total before you confirm.';
    }

    return {
      service: service,
      serviceName: SERVICE_NAME[service],
      hoursValue: formatBound(range.low) + '–' + formatBound(range.high),
      hoursNote: hoursNote,
      team: teamCopy(service, beds, baths, range.mid),
      frequency: frequency.name,
      frequencyReason: frequency.reason,
      priceLabel: priceLabel,
      example: example,
      showHourlyExample: showHourlyExample,
      worked: workedCopy(service, beds, baths, condition, pets, picked),
      notes: noteCopy(service, normalised),
      summaryMeta: SUMMARY_NAME[service] + ' · ' + frequency.name + ' · ' + priceLabel,
      ctaNote: CTA_NOTE[service],
      rawMid: raw,
      mid: range.mid
    };
  }

  function readState(form) {
    function chosen(name) {
      var el = form.querySelector('input[name="' + name + '"]:checked');
      return el ? el.value : '';
    }
    function ticked(name) {
      var el = form.querySelector('input[name="' + name + '"]');
      return !!(el && el.checked);
    }
    return {
      service: chosen('service'),
      bedrooms: chosen('bedrooms'),
      bathrooms: chosen('bathrooms'),
      condition: chosen('condition'),
      pets: chosen('pets'),
      oven: ticked('addon-oven'),
      fridge: ticked('addon-fridge'),
      windows: ticked('addon-windows')
    };
  }

  function ratesFrom(form) {
    return {
      regularHourly: Number(form.getAttribute('data-rate-regular')),
      deepHourly: Number(form.getAttribute('data-rate-deep')),
      labels: {
        regular: form.getAttribute('data-label-regular') || '',
        deep: form.getAttribute('data-label-deep') || '',
        eot: form.getAttribute('data-label-eot') || ''
      }
    };
  }

  function setHidden(el, hide) {
    if (!el) return;
    if (hide) el.setAttribute('hidden', '');
    else el.removeAttribute('hidden');
  }

  function setNotes(el, notes) {
    if (!el) return;
    while (el.firstChild) el.removeChild(el.firstChild);
    notes.forEach(function (text) {
      var p = el.ownerDocument.createElement('p');
      p.textContent = text;
      el.appendChild(p);
    });
  }

  function paint(doc, result, urls) {
    function text(id, value) {
      var el = doc.getElementById(id);
      if (el) el.textContent = value;
    }
    text('htc-service', result.serviceName);
    text('htc-hours-value', result.hoursValue);
    text('htc-team', result.team);
    text('htc-frequency', result.frequency);
    text('htc-frequency-reason', result.frequencyReason);
    text('htc-price', result.priceLabel);
    text('htc-example', result.example);
    text('htc-worked', result.worked);
    text('htc-cta-note', result.ctaNote);
    text('htc-summary-hours', result.hoursValue + ' hours');
    text('htc-summary-meta', result.summaryMeta);
    var hoursNote = doc.getElementById('htc-hours-note');
    if (hoursNote) hoursNote.textContent = result.hoursNote || '';
    setHidden(hoursNote, !result.hoursNote);
    setHidden(doc.getElementById('htc-example'), !result.showHourlyExample);
    setHidden(doc.getElementById('htc-eot-example'), result.showHourlyExample);
    setNotes(doc.getElementById('htc-notes'), result.notes);
    var cta = doc.getElementById('htc-cta');
    if (cta && urls && urls[result.service]) cta.setAttribute('href', urls[result.service]);
  }

  function mount(doc) {
    var form = doc.getElementById('htc-form');
    if (!form || form.getAttribute('data-bound') === '1') return;
    form.setAttribute('data-bound', '1');
    var urls = {
      regular: form.getAttribute('data-url-regular'),
      deep: form.getAttribute('data-url-deep'),
      eot: form.getAttribute('data-url-eot')
    };
    var rates = ratesFrom(form);
    function update() {
      paint(doc, estimate(readState(form), rates), urls);
    }
    form.addEventListener('input', update);
    form.addEventListener('change', update);
    form.addEventListener('submit', function (event) {
      event.preventDefault();
      update();
    });
    update();
  }

  return { estimate: estimate, mount: mount };
});
