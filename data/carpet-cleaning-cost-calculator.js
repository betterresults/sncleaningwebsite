// Carpet, sofa and mattress cost calculator (public page).
// Standalone Dilvon item prices for the calculator and the FAQ body only.
// Title, meta description, H1 and the printable PDF never carry a price.
// Visible words use spaces, never compound hyphens (Silvi, 27 Nov 2026).
// Do not link to /carpet-cleaning-services/prices/ (that URL is a 404).
// Do not mention oven cleaning, a 7 day reclean, or end of tenancy
// congestion charge and parking fee notes on this page.

const PUBLISHED = '2026-11-27';
const PUBLISHED_LABEL = '27 November 2026';

// Layout appends " | SN Cleaning Services" when the result is 60 characters or
// under. Rendered <title> is the 54 character string with no price symbol.
const TITLE = 'Carpet Cleaning Cost Calculator';
const H1 = 'What will a carpet, sofa or mattress clean cost?';
const META_DESCRIPTION = 'Estimate your carpet, sofa and mattress cleaning cost in London and Essex with our free calculator, then confirm the exact price on the booking form.';

const PATH = '/carpet-cleaning-cost-calculator';
const PDF_PATH = '/downloads/sn-cleaning-carpet-cleaning-checklist.pdf';
const PDF_TITLE = 'Carpet, Sofa and Mattress Cleaning Checklist';

const MINIMUM = 120;

const HONESTY_NOTE = 'This is a guide estimate. The booking form confirms the exact price before you book.';
const LEATHER_NOTE = 'Fabric only. For leather, tell us when booking and we will advise.';
const EOT_NOTE = 'Adding carpet cleaning to an end of tenancy clean? The standalone minimum visit does not apply there. Use the /end-of-tenancy-cleaning-cost-calculator/.';
const TEAM_NOTE = 'The clean is done by our own trained, insured, DBS checked team. We cover London and Essex.';
const RECLEAN_NOTE = 'If something from the clean is missed, you have a 24 hour reclean guarantee. Tell us within 24 hours and we come back at no extra cost. Old or previously treated stains may not lift completely. We give an honest assessment first.';

const PDF_INTRO = 'A short guide for a carpet, sofa or mattress clean in London and Essex. You can combine carpets, sofas and mattresses in one visit. The clean is done by our own trained, insured, DBS checked team.';

const intro = [
  'Estimate a carpet, sofa or mattress clean in London and Essex. This is a guide, and the booking form confirms the exact price. Adding carpet to an end of tenancy clean? The standalone minimum does not apply. Use the /end-of-tenancy-cleaning-cost-calculator/.'
];

function gbp(n) {
  const pennies = Math.round(Number(n) * 100);
  if (!isFinite(pennies)) return '';
  return '£' + String(pennies / 100);
}

function item(key, label, price, summary) {
  return {
    key,
    label,
    summary: summary || label,
    price,
    priceLabel: gbp(price)
  };
}

const groups = [
  {
    key: 'carpets',
    label: 'Carpets and rugs',
    note: '',
    items: [
      item('single-bedroom', 'Single bedroom', 49, 'Single bedroom carpet'),
      item('double-bedroom', 'Double bedroom', 59, 'Double bedroom carpet'),
      item('master-bedroom', 'Master bedroom', 69, 'Master bedroom carpet'),
      item('living-room', 'Living room', 89, 'Living room carpet'),
      item('dining-room', 'Dining room', 79, 'Dining room carpet'),
      item('staircase', 'Staircase', 49, 'Staircase'),
      item('hallway', 'Hallway', 22, 'Hallway'),
      item('small-rug', 'Small rug', 29, 'Small rug'),
      item('medium-rug', 'Medium rug', 39, 'Medium rug'),
      item('large-rug', 'Large rug', 59, 'Large rug')
    ]
  },
  {
    key: 'sofas',
    label: 'Sofas and fabric upholstery',
    note: LEATHER_NOTE,
    items: [
      item('2-seater', '2 seater sofa', 69),
      item('3-seater', '3 seater sofa', 89),
      item('corner-sofa', 'Corner sofa', 114),
      item('armchair', 'Armchair', 39),
      item('dining-chair', 'Dining chair', 15),
      item('ottoman', 'Ottoman', 35),
      item('headboard', 'Headboard', 29),
      item('curtains-half', 'Curtains (half)', 35),
      item('curtains-full', 'Curtains (full)', 49)
    ]
  },
  {
    key: 'mattresses',
    label: 'Mattresses',
    note: '',
    items: [
      item('single', 'Single', 39, 'Single mattress'),
      item('double', 'Double', 59, 'Double mattress'),
      item('king', 'King', 69, 'King mattress'),
      item('super-king', 'Super king', 89, 'Super king mattress')
    ]
  }
];

const CARPET_STEPS = [
  'Pre inspection of type and condition',
  'Pre treatment of visible stains',
  'Vacuum loose dirt',
  'Hot water extraction or dry clean as appropriate',
  'Full fibre clean',
  'Odour treatment',
  'Fast dry',
  'Pile grooming',
  'Furniture pads on request'
];

const SOFA_STEPS = [
  'Fabric identification',
  'Hidden area spot test',
  'Pre treat stains',
  'Fabric safe deep clean',
  'Odour treatment',
  'Seams, piping and crevices',
  'Fast dry',
  'Groom pile where applicable'
];

const MATTRESS_STEPS = [
  'Material check',
  'Spot treatment',
  'Dust mite treatment',
  'Sanitising clean on both sides where it can be turned (one sided memory foam: accessible side only)',
  'Odour treatment',
  'Fast dry',
  'Final check'
];

const work = [
  { key: 'carpets', name: 'Carpets', note: '', items: CARPET_STEPS },
  { key: 'sofas', name: 'Sofas and fabric furniture', note: LEATHER_NOTE, items: SOFA_STEPS },
  { key: 'mattresses', name: 'Mattresses', note: '', items: MATTRESS_STEPS }
];

const beforeVisit = {
  name: 'Before the visit',
  lead: 'Tell us before we arrive so we can plan the clean.',
  items: [
    'Tell us about stains',
    'Tell us about pets',
    'Tell us about parking',
    'Tell us about stairs',
    'Tell us if a mattress cannot be turned'
  ]
};

const afterVisit = {
  name: 'After the visit',
  lead: 'Most homes are comfortable again the same day. Give the fibres time to dry fully.',
  items: [
    'Most carpets can be walked on within a few hours',
    'Most sofas can be sat on within a few hours',
    'Full dry can take up to 24 hours',
    'Keep pets and young children off until dry',
    'Most mattresses dry within a few hours',
    'Use a mattress protector, or wait until fully dry, before making the bed',
    'Products are safe for pets and children once dry'
  ]
};

function catalogue() {
  return {
    minimum: MINIMUM,
    groups: groups.map((group) => ({
      key: group.key,
      label: group.label,
      note: group.note,
      items: group.items.map((entry) => ({
        key: entry.key,
        label: entry.label,
        summary: entry.summary,
        price: entry.price,
        priceLabel: entry.priceLabel
      }))
    }))
  };
}

const DEFAULT_STATE = { items: {} };

function groupSentence(group) {
  return group.label + ': ' + group.items.map((entry) => entry.label + ' ' + entry.priceLabel).join('; ') + '.';
}

const priceAnswer = [
  'These are the standalone prices.',
  groupSentence(groups[0]),
  groupSentence(groups[1]),
  LEATHER_NOTE,
  groupSentence(groups[2]),
  'A standalone visit has a minimum charge of £' + MINIMUM + '. Combine carpets, sofas and mattresses in one visit to reach it.'
].join(' ');

const faqs = [
  {
    q: 'Is this a confirmed price?',
    a: 'No. This is a guide estimate for a standalone carpet, sofa or mattress visit in London and Essex. The booking form confirms the exact price before you book. SN Cleaning Services is not VAT registered, so no VAT is added.'
  },
  {
    q: 'What is the minimum visit charge?',
    a: 'A standalone carpet, sofa or mattress visit has a minimum charge of £' + MINIMUM + '. You can combine carpets, sofas and mattresses in the same visit. If the items you choose add up to less than £' + MINIMUM + ', the visit is still £' + MINIMUM + ', and you can add further items up to that £' + MINIMUM + ' at no extra cost. The £' + MINIMUM + ' minimum does not apply when carpet cleaning is added to an end of tenancy clean. Use the /end-of-tenancy-cleaning-cost-calculator/ for that.'
  },
  {
    q: 'How much does each carpet, sofa and mattress cost?',
    a: priceAnswer
  },
  {
    q: 'How long do carpets, sofas and mattresses take to dry?',
    a: 'Most carpets can be walked on, and most sofas sat on, within a few hours. Full dry can take up to 24 hours. Most mattresses dry within a few hours: use a protector, or wait until fully dry, before making the bed. Products are safe for pets and children once dry. Keep pets and young children off until dry. Old or previously treated stains may not lift completely. We give an honest assessment first.'
  },
  {
    q: 'Who does the clean, and what if something is missed?',
    a: 'The clean is done by our own trained, insured, DBS checked team across London and Essex. Carpets have a pre inspection of type and condition, pre treatment of visible stains, a vacuum of loose dirt, hot water extraction or a dry clean as appropriate, a full fibre clean, odour treatment, a fast dry and pile grooming, with furniture pads on request. Sofas and fabric furniture are fabric only. For leather, tell us when booking and we will advise. The fabric clean includes fabric identification, a hidden area spot test, a fabric safe deep clean, and seams, piping and crevices. Mattresses have a material check, spot treatment, dust mite treatment and a sanitising clean on both sides where the mattress can be turned. A one sided memory foam mattress is cleaned on the accessible side only. If something from the clean is missed, you have a 24 hour reclean guarantee: tell us within 24 hours and we come back at no extra cost.'
  }
];

const nearYou = [
  ['Carpet cleaning in London', '/carpet-cleaning-services/london/'],
  ['Carpet cleaning in Essex', '/carpet-cleaning-services/essex/'],
  ['Upholstery cleaning', '/upholstery-cleaning/'],
  ['Mattress cleaning', '/mattress-cleaning/'],
  ['End of tenancy cleaning cost calculator', '/end-of-tenancy-cleaning-cost-calculator/']
];

const LINK_LABELS = {
  '/end-of-tenancy-cleaning-cost-calculator/': 'end of tenancy cleaning cost calculator'
};

const copy = {
  bookCta: 'Book carpet cleaning',
  downloadCta: 'Download printable checklist PDF',
  resetCta: 'Reset',
  estimateHeading: 'Estimate the cost',
  estimateLead: 'Combine carpets, sofas and mattresses in one visit.',
  resultHeading: 'Your guide price',
  kicker: 'Estimated guide total',
  itemsChosen: 'Items chosen',
  workedLabel: 'How we worked this out.',
  beforeHeading: 'Before the visit',
  workHeading: 'What we do',
  workLead: 'The same steps are on the printable checklist.',
  dryHeading: 'Drying and safety',
  faqHeading: 'Frequently asked questions',
  nearHeading: 'Carpet, sofa and mattress cleaning near you',
  nearLead: 'We clean homes across London and Essex.'
};

function withoutUrls(text) {
  return String(text)
    .replace(/https?:\/\/\S+/g, ' ')
    .replace(/\/[a-z0-9][a-z0-9\-/]*/gi, ' ');
}

function assertNoCompoundHyphen(label, text) {
  if (/[A-Za-z0-9]-[A-Za-z0-9]/.test(withoutUrls(text))) {
    throw new Error('Compound hyphen in ' + label + ': ' + text);
  }
}

function assertClean(label, text, allowPrice) {
  assertNoCompoundHyphen(label, text);
  if (!allowPrice && String(text).indexOf('£') !== -1) {
    throw new Error(label + ' must not contain a price symbol');
  }
  if (/\boven\b/i.test(text)) throw new Error(label + ' must not mention oven cleaning');
  if (/7\s*-?\s*day/i.test(text) || /seven day/i.test(text)) {
    throw new Error(label + ' must not claim a 7 day reclean');
  }
  if (/congestion/i.test(text) || /parking fee/i.test(text)) {
    throw new Error(label + ' must not copy the congestion or parking fee note');
  }
  if (/carpet-cleaning-services\/prices/i.test(text)) {
    throw new Error(label + ' must not link to the carpet prices URL');
  }
}

const RENDERED_TITLE = TITLE + ' | SN Cleaning Services';
if (RENDERED_TITLE.length !== 54) {
  throw new Error('Calculator title renders at ' + RENDERED_TITLE.length + ' characters; it must be 54');
}
if (META_DESCRIPTION.length !== 149) {
  throw new Error('Meta description is ' + META_DESCRIPTION.length + ' characters; it must be 149');
}
if (TITLE !== 'Carpet Cleaning Cost Calculator') throw new Error('Title changed');
if (H1 !== 'What will a carpet, sofa or mattress clean cost?') throw new Error('H1 changed');
if (PATH !== '/carpet-cleaning-cost-calculator') throw new Error('Path changed');
if (PDF_PATH !== '/downloads/sn-cleaning-carpet-cleaning-checklist.pdf') throw new Error('PDF path changed');
if (PDF_TITLE !== 'Carpet, Sofa and Mattress Cleaning Checklist') throw new Error('PDF title changed');
if (MINIMUM !== 120) throw new Error('Minimum visit charge must be 120');
if (faqs.length !== 5) throw new Error('Calculator page needs exactly 5 FAQs');

const EXPECTED_PRICES = {
  'Single bedroom': 49,
  'Double bedroom': 59,
  'Master bedroom': 69,
  'Living room': 89,
  'Dining room': 79,
  'Staircase': 49,
  'Hallway': 22,
  'Small rug': 29,
  'Medium rug': 39,
  'Large rug': 59,
  '2 seater sofa': 69,
  '3 seater sofa': 89,
  'Corner sofa': 114,
  'Armchair': 39,
  'Dining chair': 15,
  'Ottoman': 35,
  'Headboard': 29,
  'Curtains (half)': 35,
  'Curtains (full)': 49,
  'Single': 39,
  'Double': 59,
  'King': 69,
  'Super king': 89
};

const seen = {};
groups.forEach((group) => {
  group.items.forEach((entry) => {
    if (EXPECTED_PRICES[entry.label] !== entry.price) {
      throw new Error('Unexpected price for ' + entry.label);
    }
    seen[entry.label] = true;
  });
});
Object.keys(EXPECTED_PRICES).forEach((label) => {
  if (!seen[label]) throw new Error('Missing price item: ' + label);
});

if (CARPET_STEPS.join(' | ') !== [
  'Pre inspection of type and condition',
  'Pre treatment of visible stains',
  'Vacuum loose dirt',
  'Hot water extraction or dry clean as appropriate',
  'Full fibre clean',
  'Odour treatment',
  'Fast dry',
  'Pile grooming',
  'Furniture pads on request'
].join(' | ')) throw new Error('Carpet steps changed');

if (SOFA_STEPS.join(' | ') !== [
  'Fabric identification',
  'Hidden area spot test',
  'Pre treat stains',
  'Fabric safe deep clean',
  'Odour treatment',
  'Seams, piping and crevices',
  'Fast dry',
  'Groom pile where applicable'
].join(' | ')) throw new Error('Sofa steps changed');

if (MATTRESS_STEPS.join(' | ') !== [
  'Material check',
  'Spot treatment',
  'Dust mite treatment',
  'Sanitising clean on both sides where it can be turned (one sided memory foam: accessible side only)',
  'Odour treatment',
  'Fast dry',
  'Final check'
].join(' | ')) throw new Error('Mattress steps changed');

[
  ['title', TITLE],
  ['h1', H1],
  ['meta', META_DESCRIPTION],
  ['pdf title', PDF_TITLE],
  ['pdf intro', PDF_INTRO],
  ['honesty', HONESTY_NOTE],
  ['leather', LEATHER_NOTE],
  ['eot', EOT_NOTE],
  ['team', TEAM_NOTE],
  ['reclean', RECLEAN_NOTE],
  ['published', PUBLISHED_LABEL]
].forEach(([label, text]) => assertClean(label, text, false));

intro.forEach((text, index) => assertClean('intro ' + index, text, false));
Object.keys(copy).forEach((key) => assertClean('copy ' + key, copy[key], false));
Object.keys(LINK_LABELS).forEach((href) => assertClean('link ' + href, LINK_LABELS[href], false));

groups.forEach((group) => {
  assertClean('group ' + group.key, group.label, false);
  assertClean('group note ' + group.key, group.note, false);
  group.items.forEach((entry) => {
    assertClean('item ' + entry.key, entry.label, false);
    assertClean('summary ' + entry.key, entry.summary, false);
    assertNoCompoundHyphen('price label ' + entry.key, entry.priceLabel);
  });
});

work.forEach((section) => {
  assertClean('work ' + section.key, section.name, false);
  assertClean('work note ' + section.key, section.note, false);
  section.items.forEach((text) => assertClean('step ' + section.key, text, false));
});
assertClean('before heading', beforeVisit.name, false);
assertClean('before lead', beforeVisit.lead, false);
beforeVisit.items.forEach((text) => assertClean('before', text, false));
assertClean('after heading', afterVisit.name, false);
assertClean('after lead', afterVisit.lead, false);
afterVisit.items.forEach((text) => assertClean('after', text, false));

faqs.forEach((item) => {
  assertClean('faq q', item.q, false);
  assertClean('faq a', item.a, true);
});
if (!faqs.some((item) => item.a.indexOf('not VAT registered') !== -1)) {
  throw new Error('A FAQ must note that SN Cleaning Services is not VAT registered');
}
const costFaq = faqs.find((item) => item.q.indexOf('cost') !== -1);
if (!costFaq) throw new Error('Missing cost FAQ');
Object.keys(EXPECTED_PRICES).forEach((label) => {
  const phrase = label + ' £' + EXPECTED_PRICES[label];
  if (costFaq.a.indexOf(phrase) === -1) throw new Error('Cost FAQ is missing ' + phrase);
});
nearYou.forEach((row) => {
  assertClean('near ' + row[1], row[0], false);
  if (row[1].indexOf('/prices') !== -1) throw new Error('Near you must not link to a prices URL');
});

const engine = require('../public/js/carpet-cleaning-cost-calculator');
const priced = catalogue();
const both = engine.estimate({
  items: { carpets: { 'living-room': 1 }, mattresses: { double: 1 } }
}, priced);
if (both.payable !== 148 || both.subtotal !== 148 || both.minimumState !== 'met' || both.totalLabel !== '£148') {
  throw new Error('Living room carpet plus a double mattress should total £148');
}
const under = engine.estimate({ items: { carpets: { 'living-room': 1 } } }, priced);
if (under.payable !== 120 || under.subtotal !== 89 || under.roomLeft !== 31 || under.minimumState !== 'under') {
  throw new Error('A living room carpet alone should bill the £120 minimum with £31 of room');
}
if (under.minimumText.indexOf('£120 minimum visit') === -1 || under.minimumText.indexOf('£31 of room left to combine another item at no extra cost') === -1) {
  throw new Error('Under minimum copy must name the minimum and the room left');
}
const none = engine.estimate({ items: {} }, priced);
if (none.payable !== 0 || none.minimumState !== 'empty' || none.totalLabel !== '£0') {
  throw new Error('An empty selection must not charge the minimum');
}
[both, under, none].forEach((result) => {
  assertClean('minimum text', result.minimumText, true);
  assertClean('worked', result.worked, false);
  assertClean('summary', result.summaryMeta, false);
  result.lines.forEach((line) => {
    assertClean('line', line.label, false);
    assertNoCompoundHyphen('line amount', line.amount);
  });
});

module.exports = {
  PUBLISHED,
  PUBLISHED_LABEL,
  TITLE,
  H1,
  META_DESCRIPTION,
  PATH,
  PDF_PATH,
  PDF_TITLE,
  PDF_INTRO,
  MINIMUM,
  HONESTY_NOTE,
  LEATHER_NOTE,
  EOT_NOTE,
  TEAM_NOTE,
  RECLEAN_NOTE,
  intro,
  groups,
  work,
  beforeVisit,
  afterVisit,
  gbp,
  catalogue,
  DEFAULT_STATE,
  faqs,
  nearYou,
  LINK_LABELS,
  copy
};
