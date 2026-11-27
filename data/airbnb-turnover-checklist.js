// Airbnb turnover cleaning checklist (public page).
// Tasks follow the published changeover only: room by room work, then the
// linen, keys and damage photo protocol. Wording is those published facts.
// Do not add tasks, merge rooms, or copy an internal Dilvon price matrix.
// Hourly rates appear in the page body and FAQs only, never in the title,
// meta description, or task text. Oven cleaning is an optional add on.

const PUBLISHED = '2026-11-26';
const PUBLISHED_LABEL = '26 November 2026';

const TITLE = 'Airbnb Turnover Cleaning Checklist';
const H1 = 'The room by room Airbnb turnover cleaning checklist';
const META_DESCRIPTION = 'Tick our room by room Airbnb turnover cleaning checklist for London and Essex short let turnovers, or download the printable PDF.';

const PATH = '/airbnb-turnover-cleaning-checklist';
const PDF_PATH = '/downloads/sn-cleaning-airbnb-turnover-cleaning-checklist.pdf';
const STORAGE_KEY = 'sn-airbnb-turnover-checklist-v1';

const OVEN_NOTE = 'Oven cleaning is an optional add on only, not a standalone oven cleaning service. Any extra cost is shown on your quote.';

const RENDERED_TITLE = TITLE + ' | SN Cleaning Services';
if (RENDERED_TITLE.length !== 57 || RENDERED_TITLE.length > 60) {
  throw new Error('Airbnb checklist title renders at ' + RENDERED_TITLE.length + ' characters; it must be 57');
}
if (META_DESCRIPTION.length > 155) {
  throw new Error('Airbnb checklist meta description is ' + META_DESCRIPTION.length + ' characters');
}
if (/£/.test(TITLE) || /£/.test(META_DESCRIPTION) || /£/.test(H1) || /£/.test(OVEN_NOTE)) {
  throw new Error('Title, heading, meta description and oven note must not contain a price symbol');
}

function task(id, text) {
  return { id, text };
}

const sections = [
  {
    key: 'kitchen',
    name: 'Kitchen',
    tasks: [
      task('kitchen-01', 'Wash and put away used dishes'),
      task('kitchen-02', 'Wipe surfaces and appliances'),
      task('kitchen-03', 'Empty bins and reline them'),
      task('kitchen-04', 'Check and clear guest leftovers from the fridge (included, not a paid add on)'),
      task('kitchen-05', 'Restock tea, coffee and sugar from the host\'s supply on request')
    ]
  },
  {
    key: 'bathroom',
    name: 'Bathroom',
    tasks: [
      task('bathroom-01', 'Clean and disinfect the toilet, shower or bath, and sink, including limescale'),
      task('bathroom-02', 'Lay out fresh towels'),
      task('bathroom-03', 'Restock toiletries and toilet roll from the host\'s supply on request'),
      task('bathroom-04', 'Mop the floors')
    ]
  },
  {
    key: 'bedrooms',
    name: 'Bedrooms & Living Areas',
    tasks: [
      task('bedrooms-01', 'Strip used bedding'),
      task('bedrooms-02', 'Remake beds hotel style with fresh linen'),
      task('bedrooms-03', 'Vacuum and mop the floors'),
      task('bedrooms-04', 'Dust surfaces and skirting'),
      task('bedrooms-05', 'Clear rubbish and recycling'),
      task('bedrooms-06', 'Check under beds and inside wardrobes for leftover guest items')
    ]
  },
  {
    key: 'final',
    name: 'Final Walkthrough & Guest Reset',
    tasks: [
      task('final-01', 'Reset the thermostat, lights, blinds and welcome guide to the house rules'),
      task('final-02', 'Check windows and locks'),
      task('final-03', 'Complete the optional photo checklist on request')
    ]
  },
  {
    key: 'protocol',
    name: 'Linen, Keys & Damage Photo Protocol',
    tasks: [
      task('protocol-01', 'Linen and towels: strip and remake with fresh linen left by the host, wash and reset existing linen, or arrange a fresh linen supply (any extra fee is confirmed on the quote)'),
      task('protocol-02', 'Keys and access: key safe, smart lock, concierge, neighbour or a nearby shop. Key collection within 1 mile is free; a longer distance is confirmed on the quote'),
      task('protocol-03', 'Restocking: restock from the host\'s supply on request, and send the host a low stock alert'),
      task('protocol-04', 'Damage and photo reporting: on request, send a photo checklist of key areas after the clean, and report damage, stains or maintenance issues to the host before the next guest arrives')
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

sections.forEach((section) => {
  section.tasks.forEach((item) => {
    if (item.text.indexOf('£') !== -1) {
      throw new Error('Checklist task text must not contain a price symbol: ' + item.id);
    }
  });
});

const REQUIRED_SECTIONS = ['kitchen', 'bathroom', 'bedrooms', 'final', 'protocol'];
REQUIRED_SECTIONS.forEach((key) => {
  if (!sections.some((section) => section.key === key && section.tasks.length)) {
    throw new Error('Airbnb turnover checklist is missing section ' + key);
  }
});

const TASK_IDS = new Set(TASKS.map((t) => t.id));
if (TASK_IDS.size !== TASKS.length) {
  throw new Error('Airbnb turnover checklist task ids must be unique');
}

const faqs = [
  {
    q: 'What does an Airbnb turnover clean include?',
    a: 'A check in and check out turnover covers the kitchen, bathroom, bedrooms and living areas, then a final walkthrough. In the kitchen we wash and put away used dishes, wipe surfaces and appliances, empty and reline the bins, check and clear guest leftovers from the fridge (that is included, not a paid add on), and restock tea, coffee and sugar from your supply on request. In the bathroom we clean and disinfect the toilet, shower or bath and sink, including limescale, lay out fresh towels, restock toiletries and toilet roll from your supply on request, and mop the floors. In bedrooms and living areas we strip used bedding, remake the beds hotel style with fresh linen, vacuum and mop, dust surfaces and skirting, clear rubbish and recycling, and check under beds and inside wardrobes for leftover guest items. The walkthrough resets the thermostat, lights, blinds and welcome guide to your house rules, and checks windows and locks. An optional photo checklist can be completed on request.'
  },
  {
    q: 'How much does Airbnb turnover cleaning cost?',
    a: 'You pay by the hour, per cleaner, and cleaning products are included. There is a 2 hour minimum. SN Cleaning Services is not VAT registered, so there is no VAT to add. A check in and check out turnover is from £26 an hour, or £25 an hour for hosts with several properties. A mid stay clean is £24 an hour, a refresh is £23 an hour, and a deep clean after a long stay is £29 an hour. A vacuum and mop are available on request. The booking form shows the exact price before you confirm, and payment is authorised before the clean.'
  },
  {
    q: 'How do linen, keys, restocking and damage photos work?',
    a: 'We strip and remake beds with fresh linen you leave for us, wash and reset the existing linen, or arrange a fresh linen supply for an additional fee. The exact fee is confirmed on your quote. Access can be a key safe, smart lock, concierge, neighbour or a nearby shop. Key collection within 1 mile is free, and a longer distance is confirmed on your quote. Restocking is from your supply on request, and we send you a low stock alert. On request we send a photo checklist of key areas after the clean, and we report damage, stains or maintenance issues before the next guest arrives.'
  },
  {
    q: 'Is oven cleaning included in a turnover?',
    a: 'Oven cleaning is strictly an optional add on. It is not a standalone oven cleaning service, and a turnover does not include a separate oven clean unless you add it. Any extra cost is shown on your quote.'
  },
  {
    q: 'Where do you cover, and what if something is missed?',
    a: 'We cover London inside the M25 and Essex. We do not cover Kent. Same day check out to check in turnovers are available. The clean is done by our own trained, insured, DBS checked cleaners. We never send subcontractors. If something we cleaned is missed, the 24 hour re clean guarantee means we come back at no extra cost. Payment is authorised before the clean.'
  }
];

if (faqs.length !== 5) {
  throw new Error('Airbnb turnover checklist must list 5 FAQs, got ' + faqs.length);
}

const nearYou = [
  ['Airbnb cleaning in London and Essex', '/airbnb-cleaning/'],
  ['Airbnb cleaning in London', '/airbnb-cleaning/london/'],
  ['Airbnb cleaning in Essex', '/airbnb-cleaning/essex/']
];

const howToSections = sections.map((section) => ({
  name: section.name,
  tasks: section.tasks
}));

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
  sections,
  allTasks,
  TASKS,
  TASK_IDS,
  faqs,
  nearYou,
  howToSections
};
