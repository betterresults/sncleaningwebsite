// After builders cleaning checklist (public page).
// 25 tasks in 5 sections, from the Dilvon domestic after builders checklist
// (27 November 2026). Wording keeps that meaning, with no compound hyphens.
// Prices appear in the FAQs only, never in the title, meta description, H1,
// task text, oven note or PDF. Oven cleaning is an optional add on and is
// not one of the 25 standard tasks.

const PUBLISHED = '2026-11-27';
const PUBLISHED_LABEL = '27 November 2026';

const TITLE = 'After Builders Cleaning Checklist';
const H1 = 'The room by room after builders cleaning checklist';
const META_DESCRIPTION = 'Tick our after builders cleaning checklist for London and Essex renovations, or download the printable PDF.';

const PATH = '/after-builders-cleaning-checklist';
const PDF_PATH = '/downloads/sn-cleaning-after-builders-cleaning-checklist.pdf';
const STORAGE_KEY = 'sn-after-builders-checklist-v1';

const OVEN_NOTE = 'Oven cleaning is an optional add on only, not a standalone oven cleaning service, and it is not one of the 25 standard tasks. Any extra cost is shown on your quote.';

const PDF_INTRO = 'An after builders clean removes fine dust once the trades have finished. Work through the whole property, the kitchen, the bathrooms, the rooms and woodwork, then the hallway, stairs and handover. Tick Done as you go. Book once the dust has settled. Many customers book the day after the last tradesperson leaves. We use HEPA filtered vacuums. General debris and packaging are cleared with the clean. Large skips and bulky building materials are arranged separately. If something we cleaned is missed, the free reclean is 7 days for an empty home and 24 hours if you already live in the property. This list is for London, inside the M25, and Essex.';

const RENDERED_TITLE = TITLE + ' | SN Cleaning Services';
if (RENDERED_TITLE.length !== 56 || RENDERED_TITLE.length > 60) {
  throw new Error('After builders checklist title renders at ' + RENDERED_TITLE.length + ' characters; it must be 56');
}
if (META_DESCRIPTION.length > 155) {
  throw new Error('After builders checklist meta description is ' + META_DESCRIPTION.length + ' characters');
}
if (/£/.test(TITLE) || /£/.test(META_DESCRIPTION) || /£/.test(H1) || /£/.test(OVEN_NOTE) || /£/.test(PDF_INTRO)) {
  throw new Error('Title, heading, meta description, oven note and PDF intro must not contain a price symbol');
}

function task(id, text) {
  return { id, text };
}

const sections = [
  {
    key: 'property',
    name: 'Whole property, debris and dust',
    tasks: [
      task('property-01', 'Remove remaining packaging, tape, stickers, and loose debris'),
      task('property-02', 'HEPA fine dust vacuum of all rooms including floors, sills, and frames'),
      task('property-03', 'Wipe dust from all surfaces, skirting, and fittings'),
      task('property-04', 'Clean inside cupboards and drawers where empty and in scope'),
      task('property-05', 'Remove dust from light fittings and switches where reachable and safe'),
      task('property-06', 'Vacuum and wipe window tracks thoroughly')
    ]
  },
  {
    key: 'kitchen',
    name: 'Kitchen',
    tasks: [
      task('kitchen-01', 'Clean worktops, splashbacks, and cupboard fronts'),
      task('kitchen-02', 'Clean sink, taps, and drains and remove installer residue'),
      task('kitchen-03', 'Clean appliance exteriors and interiors where unused or agreed'),
      task('kitchen-04', 'Wipe plinths and kickboards'),
      task('kitchen-05', 'Vacuum and mop floor including under units where accessible')
    ]
  },
  {
    key: 'bathrooms',
    name: 'Bathrooms',
    tasks: [
      task('bathrooms-01', 'Clean sanitaryware and remove silicone smears and residue'),
      task('bathrooms-02', 'Clean shower screens, taps, and mirrors'),
      task('bathrooms-03', 'Wipe tiles and remove plaster and paint dust'),
      task('bathrooms-04', 'Clean floors including behind toilet and vanity')
    ]
  },
  {
    key: 'rooms',
    name: 'Rooms, doors and woodwork',
    tasks: [
      task('rooms-01', 'Wipe doors, frames, handles, and architraves'),
      task('rooms-02', 'Wipe switches, sockets, and faceplates carefully'),
      task('rooms-03', 'Remove paint and plaster splashes using safe methods only'),
      task('rooms-04', 'Clean internal windows, tracks, and frames'),
      task('rooms-05', 'Vacuum carpets or vacuum and mop hard floors room by room')
    ]
  },
  {
    key: 'handover',
    name: 'Hallway, stairs and handover',
    tasks: [
      task('handover-01', 'Clean stairs, banisters, and landings'),
      task('handover-02', 'Final dust pass on skirting and ledges'),
      task('handover-03', 'Clear general debris and rubbish from site'),
      task('handover-04', 'Handover walkthrough and photographs where required'),
      task('handover-05', 'Note snags or incomplete works for the client')
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

const beforeYouBook = [
  {
    h: 'Timing',
    p: 'Book once the trades have finished and the dust has settled. Many customers book the day after the last tradesperson leaves. If you have a handover, move in or completion date, tell us when you book and we will plan the clean around it.'
  },
  {
    h: 'HEPA dust removal',
    p: 'We use HEPA filtered vacuums and specialist fine dust methods, and we bring our own limescale remover. The first pass is a HEPA fine dust vacuum of floors, sills and frames, then a wipe of surfaces, skirting and fittings.'
  },
  {
    h: 'Waste',
    p: 'General debris and packaging are cleared as part of the clean. Large skips or bulky building materials are arranged separately. Optional household or van waste removal add ons are on our',
    prices: true
  },
  {
    h: 'Reclean window',
    p: 'If something we cleaned is missed, the free reclean guarantee is 7 days for an empty home and 24 hours if you already live in the property. Tell us and we come back at no extra cost.'
  }
];

const faqs = [
  {
    q: 'What does an after builders clean include?',
    a: 'The checklist has 25 tasks in five parts. Whole property, debris and dust: remove remaining packaging, tape, stickers and loose debris; a HEPA fine dust vacuum of all rooms including floors, sills and frames; wipe dust from all surfaces, skirting and fittings; clean inside cupboards and drawers where they are empty and in scope; remove dust from light fittings and switches where reachable and safe; and vacuum and wipe window tracks thoroughly. Kitchen: clean worktops, splashbacks and cupboard fronts; clean the sink, taps and drains and remove installer residue; clean appliance exteriors and interiors where unused or agreed; wipe plinths and kickboards; and vacuum and mop the floor including under units where accessible. Bathrooms: clean sanitaryware and remove silicone smears and residue; clean shower screens, taps and mirrors; wipe tiles and remove plaster and paint dust; and clean floors including behind the toilet and vanity. Rooms, doors and woodwork: wipe doors, frames, handles and architraves; wipe switches, sockets and faceplates carefully; remove paint and plaster splashes using safe methods only; clean internal windows, tracks and frames; and vacuum carpets or vacuum and mop hard floors room by room. Hallway, stairs and handover: clean stairs, banisters and landings; a final dust pass on skirting and ledges; clear general debris and rubbish from site; a handover walkthrough and photographs where required; and note snags or incomplete works for the client. Oven cleaning is not one of these tasks.'
  },
  {
    q: 'How much does after builders cleaning cost?',
    a: 'Empty homes are from £179 by property size. A single room or lived in area is £29 per cleaner per hour. Builders and developers are £232 per cleaner per day (8 hours). SN Cleaning Services is not VAT registered, so no VAT is added. The same base prices apply in London and Essex. In London the Congestion Charge and parking are added where they apply. See /after-builders-cleaning/prices/ for the full list.'
  },
  {
    q: 'When should you book an after builders clean?',
    a: 'Book once the trades have finished and the dust has settled. Many customers book the day after the last tradesperson leaves. If you have a handover, move in or completion date, tell us when you book and we will plan the clean around it. The team uses HEPA filtered vacuums, specialist fine dust methods, and our own limescale remover.'
  },
  {
    q: 'Is oven cleaning or waste removal included?',
    a: 'Oven cleaning is strictly an optional add on. It is not a standalone oven cleaning service, and it is not one of the 25 standard tasks. Any extra cost is shown on your quote. General debris and packaging are cleared as part of the clean. Large skips or bulky building materials are arranged separately. Optional household or van waste removal add ons are listed at /after-builders-cleaning/prices/.'
  },
  {
    q: 'Where do you cover, and what if something is missed?',
    a: 'We cover London inside the M25 and Essex. The clean is done by our own trained, insured, DBS checked cleaners. We never send subcontractors. SN Cleaning Services has been in business for 12 years. If something we cleaned is missed, the free reclean guarantee is 7 days for an empty home and 24 hours if you already live in the property.'
  }
];

if (faqs.length !== 5) {
  throw new Error('After builders checklist must list 5 FAQs, got ' + faqs.length);
}

const nearYou = [
  ['After builders cleaning in London and Essex', '/after-builders-cleaning/'],
  ['After builders cleaning prices', '/after-builders-cleaning/prices/'],
  ['After builders cleaning in London', '/after-builders-cleaning/london/'],
  ['After builders cleaning in Essex', '/after-builders-cleaning/essex/']
];

const howToSections = sections.map((section) => ({
  name: section.name,
  tasks: section.tasks
}));

sections.forEach((section) => {
  section.tasks.forEach((item) => {
    if (item.text.indexOf('£') !== -1) {
      throw new Error('Checklist task text must not contain a price symbol: ' + item.id);
    }
  });
});

const REQUIRED = [
  ['property', 6],
  ['kitchen', 5],
  ['bathrooms', 4],
  ['rooms', 5],
  ['handover', 5]
];
REQUIRED.forEach(([key, count]) => {
  const section = sections.find((item) => item.key === key);
  if (!section || section.tasks.length !== count) {
    throw new Error('After builders checklist section ' + key + ' must have ' + count + ' tasks');
  }
});

if (TASKS.length !== 25) {
  throw new Error('After builders checklist must have 25 tasks, got ' + TASKS.length);
}

const TASK_IDS = new Set(TASKS.map((t) => t.id));
if (TASK_IDS.size !== TASKS.length) {
  throw new Error('After builders checklist task ids must be unique');
}

function withoutUrls(text) {
  return String(text)
    .replace(/https?:\/\/\S+/g, ' ')
    .replace(/\/[a-z0-9][a-z0-9\-/]*/gi, ' ');
}

function assertNoCompoundHyphen(label, text) {
  const stripped = withoutUrls(text);
  if (/[A-Za-z0-9]-[A-Za-z0-9]/.test(stripped)) {
    throw new Error('Compound hyphen in ' + label + ': ' + text);
  }
}

[
  ['title', TITLE],
  ['h1', H1],
  ['meta', META_DESCRIPTION],
  ['oven', OVEN_NOTE],
  ['pdf intro', PDF_INTRO],
  ['published label', PUBLISHED_LABEL]
].forEach(([label, text]) => assertNoCompoundHyphen(label, text));
sections.forEach((section) => {
  assertNoCompoundHyphen('section ' + section.key, section.name);
  section.tasks.forEach((item) => assertNoCompoundHyphen(item.id, item.text));
});
beforeYouBook.forEach((block) => {
  assertNoCompoundHyphen('before ' + block.h, block.h);
  assertNoCompoundHyphen('before ' + block.h, block.p);
});
faqs.forEach((item) => {
  assertNoCompoundHyphen('faq ' + item.q, item.q);
  assertNoCompoundHyphen('faq answer ' + item.q, item.a);
  if (item.q.indexOf('cost') !== -1 && item.a.indexOf('/after-builders-cleaning/prices/') === -1) {
    throw new Error('The pricing FAQ must link to the after builders prices page');
  }
});
nearYou.forEach((item) => assertNoCompoundHyphen('near you ' + item[1], item[0]));

module.exports = {
  PUBLISHED,
  PUBLISHED_LABEL,
  TITLE,
  H1,
  META_DESCRIPTION,
  PATH,
  PDF_PATH,
  STORAGE_KEY,
  OVEN_NOTE,
  PDF_INTRO,
  sections,
  allTasks,
  TASKS,
  TASK_IDS,
  beforeYouBook,
  faqs,
  nearYou,
  howToSections
};
