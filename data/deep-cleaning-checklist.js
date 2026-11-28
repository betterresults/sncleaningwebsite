// Deep cleaning checklist (public page).
// 15 tasks in 4 sections, published 27 November 2026.
// Wording is the published list only: no invented tasks, no compound hyphens.
// Prices appear in the FAQs only, never in the title, meta description, H1,
// task text, oven note, PDF, or the rest of the body. Oven cleaning is an
// optional add on and is not one of the 15 standard tasks.
// Do not link to /deep-house-cleaning/prices/ (that URL is a 404).

const PUBLISHED = '2026-11-27';
const PUBLISHED_LABEL = '27 November 2026';

const TITLE = 'Deep Cleaning Checklist';
const H1 = 'The room by room deep cleaning checklist';
const META_DESCRIPTION = 'Tick our room by room deep and spring cleaning checklist for London and Essex, or download the printable PDF to work through at your own pace.';

const PATH = '/deep-cleaning-checklist';
const PDF_PATH = '/downloads/sn-cleaning-deep-cleaning-checklist.pdf';
const STORAGE_KEY = 'sn-deep-cleaning-checklist-v1';
const BOOK_TOKEN = '{{book}}';

const OVEN_NOTE = 'Oven cleaning is an optional add on only, not a standalone oven cleaning service, and it is not one of the 15 standard tasks. Any extra cost is shown on your quote.';

const PDF_INTRO = 'A spring or autumn reset for the whole home. A deep clean is a room by room reset of a lived in home. Work through the kitchen, the bathroom, the living areas and bedrooms, then the whole home. Tick Done as you go. Inside the fridge and cupboards is cleaned on request, where they are empty or space is made. Carpets and upholstery are vacuumed thoroughly. Professional steam cleaning for carpets, mattresses or upholstery is an optional booking add on. The clean is done by our own trained, insured, DBS checked team. If the home is empty, the reclean is a free return. For a lived in home it is a 24 hour reclean: report it within 24 hours. This list is for London and Essex.';

const RENDERED_TITLE = TITLE + ' | SN Cleaning Services';
if (RENDERED_TITLE.length !== 46 || RENDERED_TITLE.length > 60) {
  throw new Error('Deep cleaning checklist title renders at ' + RENDERED_TITLE.length + ' characters; it must be 46');
}
if (META_DESCRIPTION.length > 155) {
  throw new Error('Deep cleaning checklist meta description is ' + META_DESCRIPTION.length + ' characters');
}
if (!/room by room/.test(META_DESCRIPTION) || !/deep and spring cleaning checklist/.test(META_DESCRIPTION) || !/London and Essex/.test(META_DESCRIPTION) || !/printable PDF/.test(META_DESCRIPTION)) {
  throw new Error('Meta description must mention the room by room deep and spring cleaning checklist, London and Essex, and a printable PDF');
}

function task(id, text) {
  return { id, text };
}

const sections = [
  {
    key: 'kitchen',
    name: 'Kitchen',
    tasks: [
      task('kitchen-01', 'Hob and extractor degreased'),
      task('kitchen-02', 'Inside the fridge and cupboards (on request)'),
      task('kitchen-03', 'Grout and tiles scrubbed'),
      task('kitchen-04', 'Behind and underneath appliances where accessible')
    ]
  },
  {
    key: 'bathroom',
    name: 'Bathroom',
    tasks: [
      task('bathroom-01', 'Tiles, grout and fittings descaled and deep cleaned'),
      task('bathroom-02', 'Extractor fan cleaned'),
      task('bathroom-03', 'Inside cabinets wiped down'),
      task('bathroom-04', 'Mould treatment where present')
    ]
  },
  {
    key: 'living',
    name: 'Living areas and bedrooms',
    tasks: [
      task('living-01', 'Skirting boards, doors and frames washed'),
      task('living-02', 'Light switches and fittings cleaned'),
      task('living-03', 'Behind and underneath furniture (where accessible)'),
      task('living-04', 'Carpets and upholstery vacuumed thoroughly')
    ]
  },
  {
    key: 'home',
    name: 'Whole home',
    tasks: [
      task('home-01', 'Windowsills and internal glass cleaned'),
      task('home-02', 'Cobwebs removed throughout'),
      task('home-03', 'All bins emptied and cleaned')
    ]
  }
];

function allTasks() {
  const out = [];
  sections.forEach((section) => {
    section.tasks.forEach((item) => out.push({ ...item, section: section.key }));
  });
  return out;
}

const TASKS = allTasks();

const intro = [
  'A deep clean is a one off, room by room reset of a lived in home across London and Essex. A spring or autumn reset for the whole home uses the same list: the kitchen, the bathroom, the living areas and bedrooms, then the whole home.',
  'Tick each task as you go, or download the printable PDF. If you would rather hand the clean to us, book a deep clean. The clean is done by our own trained, insured, DBS checked team. We never send subcontractors. We have been in business for 12 years and are rated 5.0 on Google.'
];

const whenToUse = {
  h: 'When to use this deep clean and how it works',
  lead: 'A spring or autumn reset for the whole home. You can also book a deep clean after a busy spell, before guests arrive, or before regular visits begin.',
  steps: [
    'Tick each task as you clean, or download the printable PDF and print it.',
    'Work through the kitchen, the bathroom, the living areas and bedrooms, then the whole home. Inside the fridge and cupboards is cleaned on request, where they are empty or space is made. Carpets and upholstery are vacuumed thoroughly. Professional steam cleaning for carpets, mattresses or upholstery is an optional booking add on.',
    'If you would rather we did the clean, book a deep clean. The booking form shows the price before you confirm. The clean is done by our own trained, insured, DBS checked team. We never send subcontractors.'
  ],
  close: 'The reclean guarantee is a free return if the home is empty. For a lived in home it is a 24 hour reclean: report it within 24 hours and we come back at no extra cost.'
};

const body = [
  'We cover 32 London boroughs and 7 Essex areas. The clean is done by our own trained, insured, DBS checked team. We have been in business for 12 years and are rated 5.0 on Google. We bring our own limescale remover. We never send subcontractors.',
  'The reclean guarantee is a free return if the home is empty. For a lived in home it is a 24 hour reclean: report it within 24 hours and we come back at no extra cost.',
  'This list is a one off deep or spring clean. A weekly or fortnightly home visit is a different clean: use the /domestic-cleaning-checklist/. If you are handing a rental back, use the /end-of-tenancy-cleaning-checklist/. If the builders have just finished, use the /after-builders-cleaning-checklist/. To see how long a regular, deep or end of tenancy clean may take, try the /house-cleaning-time-calculator/.'
];

const faqs = [
  {
    q: 'What does a deep clean include?',
    a: 'The checklist has 15 tasks in four parts. Kitchen: hob and extractor degreased; inside the fridge and cupboards (on request); grout and tiles scrubbed; and behind and underneath appliances where accessible. Bathroom: tiles, grout and fittings descaled and deep cleaned; extractor fan cleaned; inside cabinets wiped down; and mould treatment where present. Living areas and bedrooms: skirting boards, doors and frames washed; light switches and fittings cleaned; behind and underneath furniture (where accessible); and carpets and upholstery vacuumed thoroughly. Whole home: windowsills and internal glass cleaned; cobwebs removed throughout; and all bins emptied and cleaned. Oven cleaning is not one of these tasks. Professional steam cleaning for carpets, mattresses or upholstery is an optional booking add on, not one of the 15 tasks.'
  },
  {
    q: 'How much does deep cleaning cost?',
    a: 'Deep cleaning starts from £27 per hour, with a 3 hour minimum on the booking form, booked in half hour steps. SN Cleaning Services is not VAT registered, so no VAT is added. Book a deep clean on our ' + BOOK_TOKEN + '. The /house-cleaning-time-calculator/ shows how long a visit may take. Optional add ons are priced on the booking form when you book.'
  },
  {
    q: 'When should you book a deep or spring clean?',
    a: 'A spring or autumn reset for the whole home. You can also book after a busy spell, before guests arrive, or as a fresh start before regular visits. A weekly or fortnightly visit is a different clean and follows a shorter list.'
  },
  {
    q: 'Is oven cleaning, the fridge or steam cleaning included?',
    a: 'Oven cleaning is strictly an optional add on. It is not a standalone oven cleaning service, and it is not one of the 15 standard tasks. Any extra cost is shown on your quote. Inside the fridge and cupboards is cleaned on request, where they are empty or space is made. Carpets and upholstery are vacuumed thoroughly as part of the clean. Professional steam cleaning for carpets, mattresses or upholstery is an optional booking add on.'
  },
  {
    q: 'Who does the clean, and what if something is missed?',
    a: 'The clean is done by our own trained, insured, DBS checked cleaners. We never send subcontractors. We bring our own limescale remover. SN Cleaning Services has been in business for 12 years and is rated 5.0 on Google. We cover London and Essex: 32 London boroughs and 7 Essex areas. The reclean guarantee is a free return if the home is empty. For a lived in home it is a 24 hour reclean: report it within 24 hours and we come back at no extra cost.'
  }
];

if (faqs.length !== 5) {
  throw new Error('Deep cleaning checklist must list 5 FAQs, got ' + faqs.length);
}

const nearYou = [
  ['Deep house cleaning in London and Essex', '/deep-house-cleaning/'],
  ['House cleaning time calculator', '/house-cleaning-time-calculator/'],
  ['Domestic cleaning checklist', '/domestic-cleaning-checklist/'],
  ['End of tenancy cleaning checklist', '/end-of-tenancy-cleaning-checklist/'],
  ['After builders cleaning checklist', '/after-builders-cleaning-checklist/']
];

const LINK_LABELS = {
  '/domestic-cleaning-checklist/': 'domestic cleaning checklist',
  '/end-of-tenancy-cleaning-checklist/': 'end of tenancy cleaning checklist',
  '/after-builders-cleaning-checklist/': 'after builders cleaning checklist',
  '/house-cleaning-time-calculator/': 'house cleaning time calculator',
  '/deep-house-cleaning/': 'deep house cleaning in London and Essex'
};

const copy = {
  bookCta: 'Book a deep clean',
  downloadCta: 'Download printable PDF',
  startCta: 'Start the checklist',
  printCta: 'Print',
  resetCta: 'Reset',
  checklistHeading: 'The room by room checklist',
  checklistLead: 'Tick as you go. Your ticks and notes stay in this browser if you refresh the page. There are 15 tasks. Oven cleaning is not one of them.',
  tasksWord: 'tasks',
  doneWord: 'Done',
  notesFor: 'Notes for',
  notesPlaceholder: 'Anything to flag in this part of the clean',
  handTitle: 'Hand the clean to us',
  handBody: 'Tell us the postcode and we will open the deep cleaning booking form. You see the price there before you confirm.',
  postcode: 'Postcode',
  email: 'Email',
  teamHeading: 'The team, the oven add on, and the visit',
  nearHeading: 'Deep cleaning near you',
  nearLead: 'See /deep-house-cleaning/ for what is included when we do the clean.',
  faqHeading: 'Frequently asked questions'
};

const howToSections = sections.map((section) => ({
  name: section.name,
  tasks: section.tasks
}));

const EXPECTED = [
  ['kitchen', 'Kitchen', [
    'Hob and extractor degreased',
    'Inside the fridge and cupboards (on request)',
    'Grout and tiles scrubbed',
    'Behind and underneath appliances where accessible'
  ]],
  ['bathroom', 'Bathroom', [
    'Tiles, grout and fittings descaled and deep cleaned',
    'Extractor fan cleaned',
    'Inside cabinets wiped down',
    'Mould treatment where present'
  ]],
  ['living', 'Living areas and bedrooms', [
    'Skirting boards, doors and frames washed',
    'Light switches and fittings cleaned',
    'Behind and underneath furniture (where accessible)',
    'Carpets and upholstery vacuumed thoroughly'
  ]],
  ['home', 'Whole home', [
    'Windowsills and internal glass cleaned',
    'Cobwebs removed throughout',
    'All bins emptied and cleaned'
  ]]
];

EXPECTED.forEach(([key, name, texts]) => {
  const section = sections.find((item) => item.key === key);
  if (!section || section.name !== name || section.tasks.length !== texts.length) {
    throw new Error('Deep cleaning checklist section ' + key + ' does not match the published list');
  }
  texts.forEach((text, index) => {
    if (section.tasks[index].text !== text) {
      throw new Error('Published task changed in ' + key + ': ' + section.tasks[index].text);
    }
  });
});

if (TASKS.length !== 15) {
  throw new Error('Deep cleaning checklist must have 15 tasks, got ' + TASKS.length);
}

const TASK_IDS = new Set(TASKS.map((t) => t.id));
if (TASK_IDS.size !== TASKS.length) {
  throw new Error('Deep cleaning checklist task ids must be unique');
}

function withoutUrls(text) {
  return String(text)
    .replace(/https?:\/\/\S+/g, ' ')
    .replace(/\{\{book\}\}/g, ' ')
    .replace(/\/[a-z0-9][a-z0-9\-/]*\.?[a-z0-9]*/gi, ' ');
}

function assertNoCompoundHyphen(label, text) {
  const stripped = withoutUrls(text);
  if (/[A-Za-z0-9]-[A-Za-z0-9]/.test(stripped)) {
    throw new Error('Compound hyphen in ' + label + ': ' + text);
  }
}

function assertNoPrice(label, text) {
  if (String(text).indexOf('£') !== -1) {
    throw new Error(label + ' must not contain a price symbol');
  }
}

function assertNoSevenDay(label, text) {
  if (/7\s*-?\s*day/i.test(String(text))) {
    throw new Error(label + ' must not claim a 7 day reclean');
  }
}

[
  ['title', TITLE],
  ['h1', H1],
  ['meta', META_DESCRIPTION],
  ['oven', OVEN_NOTE],
  ['pdf intro', PDF_INTRO],
  ['published label', PUBLISHED_LABEL]
].forEach(([label, text]) => {
  assertNoCompoundHyphen(label, text);
  assertNoPrice(label, text);
  assertNoSevenDay(label, text);
});

intro.forEach((text, index) => {
  assertNoCompoundHyphen('intro ' + index, text);
  assertNoPrice('intro ' + index, text);
  assertNoSevenDay('intro ' + index, text);
});

assertNoCompoundHyphen('when heading', whenToUse.h);
assertNoCompoundHyphen('when lead', whenToUse.lead);
assertNoPrice('when lead', whenToUse.lead);
assertNoSevenDay('when lead', whenToUse.lead);
if (whenToUse.lead.indexOf('A spring or autumn reset for the whole home.') !== 0) {
  throw new Error('The when to use section must open with the published spring or autumn sentence');
}
whenToUse.steps.forEach((text, index) => {
  assertNoCompoundHyphen('when step ' + index, text);
  assertNoPrice('when step ' + index, text);
  assertNoSevenDay('when step ' + index, text);
});
assertNoCompoundHyphen('when close', whenToUse.close);
assertNoPrice('when close', whenToUse.close);
assertNoSevenDay('when close', whenToUse.close);
if (whenToUse.steps.join(' ').indexOf('on request') === -1 || whenToUse.steps.join(' ').indexOf('vacuumed thoroughly') === -1 || whenToUse.steps.join(' ').indexOf('optional booking add on') === -1) {
  throw new Error('The when to use section must cover the fridge on request and carpets versus the steam cleaning add on');
}
if (whenToUse.steps.join(' ').indexOf('own trained, insured, DBS checked team') === -1) {
  throw new Error('The when to use section must name our own trained, insured, DBS checked team');
}
if (whenToUse.close.indexOf('free return') === -1 || whenToUse.close.indexOf('24 hour') === -1 || whenToUse.close.indexOf('lived in') === -1) {
  throw new Error('The when to use section must explain the free return and the 24 hour reclean');
}

body.forEach((text, index) => {
  assertNoCompoundHyphen('body ' + index, text);
  assertNoPrice('body ' + index, text);
  assertNoSevenDay('body ' + index, text);
});

sections.forEach((section) => {
  assertNoCompoundHyphen('section ' + section.key, section.name);
  assertNoPrice('section ' + section.key, section.name);
  section.tasks.forEach((item) => {
    assertNoCompoundHyphen(item.id, item.text);
    assertNoPrice(item.id, item.text);
  });
});

faqs.forEach((item) => {
  assertNoCompoundHyphen('faq ' + item.q, item.q);
  assertNoCompoundHyphen('faq answer ' + item.q, item.a);
  assertNoSevenDay('faq ' + item.q, item.q + ' ' + item.a);
  if (item.a.indexOf('/deep-house-cleaning/prices') !== -1) {
    throw new Error('FAQs must not link to the deep cleaning prices URL');
  }
});

const priceFaq = faqs.find((item) => item.q.indexOf('cost') !== -1);
if (!priceFaq || priceFaq.a.indexOf('£27') === -1 || priceFaq.a.indexOf('3 hour') === -1 || priceFaq.a.indexOf('half hour') === -1 || priceFaq.a.indexOf('not VAT registered') === -1 || priceFaq.a.indexOf(BOOK_TOKEN) === -1 || priceFaq.a.indexOf('/house-cleaning-time-calculator/') === -1) {
  throw new Error('The pricing FAQ must give the hourly rate, the 3 hour minimum, half hour steps, VAT, the booking form and the time calculator');
}
faqs.forEach((item) => {
  if (item !== priceFaq && item.a.indexOf('£') !== -1) {
    throw new Error('Only the pricing FAQ may contain a price symbol');
  }
});
if (!faqs.some((item) => item.a.indexOf('A spring or autumn reset for the whole home.') !== -1)) {
  throw new Error('A FAQ must include the published spring or autumn sentence');
}

nearYou.forEach((item) => {
  assertNoCompoundHyphen('near you ' + item[1], item[0]);
  if (item[1].indexOf('/deep-house-cleaning/prices') !== -1) {
    throw new Error('Near you links must not include the deep cleaning prices URL');
  }
});
Object.keys(LINK_LABELS).forEach((href) => {
  assertNoCompoundHyphen('link label ' + href, LINK_LABELS[href]);
});
Object.keys(copy).forEach((key) => {
  assertNoCompoundHyphen('copy ' + key, copy[key]);
  assertNoPrice('copy ' + key, copy[key]);
  assertNoSevenDay('copy ' + key, copy[key]);
});

if (copy.checklistLead.indexOf(String(TASKS.length) + ' tasks') === -1) {
  throw new Error('Checklist lead must state the published task count');
}

module.exports = {
  PUBLISHED,
  PUBLISHED_LABEL,
  TITLE,
  H1,
  META_DESCRIPTION,
  PATH,
  PDF_PATH,
  STORAGE_KEY,
  BOOK_TOKEN,
  OVEN_NOTE,
  PDF_INTRO,
  sections,
  allTasks,
  TASKS,
  TASK_IDS,
  intro,
  whenToUse,
  body,
  faqs,
  nearYou,
  LINK_LABELS,
  copy,
  howToSections
};
