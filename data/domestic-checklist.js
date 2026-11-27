// Regular domestic cleaning checklist (public page).
// 49 tasks from the domestic Dilvon template "Regular Domestic Cleaning"
// (checklist_id f0af6a36-c336-4ef4-a181-a5a813cf6326, published template,
// read 26 November 2026). 7 sections: 11 + 9 + 5 + 8 + 7 + 5 + 4.
// Wording is the Dilvon task text. Do not merge, split or rename tasks.
// The only oven task is "Wipe oven exterior and control panel", under Kitchen.

const PUBLISHED = '2026-11-26';
const PUBLISHED_LABEL = '26 November 2026';

const TITLE = 'Domestic Cleaning Checklist | London & Essex';
const H1 = 'The room by room domestic cleaning checklist (London & Essex)';
const META_DESCRIPTION = 'Work through a room by room domestic cleaning checklist. Tick each task as you clean, or download a printable PDF, then book a regular clean if you would rather hand it to us.';

const PATH = '/domestic-cleaning-checklist';
const PDF_PATH = '/downloads/sn-cleaning-domestic-cleaning-checklist.pdf';
const STORAGE_KEY = 'sn-domestic-checklist-v1';
const CHECKLIST_ID = 'f0af6a36-c336-4ef4-a181-a5a813cf6326';

const OVEN_NOTE = 'A regular domestic clean includes wiping the oven exterior and control panel. Cleaning inside the oven is an optional add on, not a standalone oven cleaning service.';

function task(id, text) {
  return { id, text };
}

const sections = [
  {
    key: 'kitchen',
    name: 'Kitchen',
    tasks: [
      task('kitchen-01', 'Clear and wipe worktops'),
      task('kitchen-02', 'Wipe cupboard fronts and fridge exterior'),
      task('kitchen-03', 'Clean hob surface (including around burners)'),
      task('kitchen-04', 'Wipe oven exterior and control panel'),
      task('kitchen-05', 'Clean microwave interior and exterior (quick wipe)'),
      task('kitchen-06', 'Clean sink, taps, and draining board'),
      task('kitchen-07', 'Wipe splashback / tiles'),
      task('kitchen-08', 'Empty bin and replace liner; wipe bin exterior'),
      task('kitchen-09', 'Wipe switches and door handles'),
      task('kitchen-10', 'Sweep / vacuum floor including corners'),
      task('kitchen-11', 'Mop floor')
    ]
  },
  {
    key: 'bathroom',
    name: 'Bathroom',
    tasks: [
      task('bathroom-01', 'Clean shower / bath; remove hair and soap scum'),
      task('bathroom-02', 'Clean toilet (bowl, seat, lid, exterior, base)'),
      task('bathroom-03', 'Clean sink, taps, and overflow'),
      task('bathroom-04', 'Wipe mirrors smear free'),
      task('bathroom-05', 'Wipe accessible surfaces, shelves, and chrome'),
      task('bathroom-06', 'Wipe door handle and light switch'),
      task('bathroom-07', 'Empty bin and replace liner'),
      task('bathroom-08', 'Sweep / vacuum floor'),
      task('bathroom-09', 'Mop floor')
    ]
  },
  {
    key: 'toilet',
    name: 'Toilet / WC',
    tasks: [
      task('toilet-01', 'Clean and disinfect toilet fully'),
      task('toilet-02', 'Clean sink and taps if present'),
      task('toilet-03', 'Wipe surfaces, door handle, and light switch'),
      task('toilet-04', 'Empty bin if present'),
      task('toilet-05', 'Mop floor')
    ]
  },
  {
    key: 'bedrooms',
    name: 'Bedrooms',
    tasks: [
      task('bedrooms-01', 'Make beds / tidy surfaces (as agreed with client)'),
      task('bedrooms-02', 'Dust furniture, surfaces, and picture frames'),
      task('bedrooms-03', 'Wipe skirting (quick pass on visible runs)'),
      task('bedrooms-04', 'Wipe switches, sockets, and door handles'),
      task('bedrooms-05', 'Clean mirrors if present'),
      task('bedrooms-06', 'Empty bins'),
      task('bedrooms-07', 'Vacuum floors including under bed edge if accessible'),
      task('bedrooms-08', 'Mop hard floors if present')
    ]
  },
  {
    key: 'living',
    name: 'Living Room',
    tasks: [
      task('living-01', 'Dust surfaces, shelves, and TV / media unit (exterior)'),
      task('living-02', 'Wipe skirting (quick pass)'),
      task('living-03', 'Wipe switches, sockets, and door handles'),
      task('living-04', 'Fluff cushions / tidy as needed'),
      task('living-05', 'Empty bins'),
      task('living-06', 'Vacuum floors, rugs, and sofa edges'),
      task('living-07', 'Mop hard floors if present')
    ]
  },
  {
    key: 'hallway',
    name: 'Hallway / Stairs / Landing',
    tasks: [
      task('hallway-01', 'Wipe banisters and handrails'),
      task('hallway-02', 'Wipe door handles and light switches'),
      task('hallway-03', 'Wipe front door (internal) and threshold if dirty'),
      task('hallway-04', 'Vacuum hallway and stairs thoroughly'),
      task('hallway-05', 'Mop hard floors if present')
    ]
  },
  {
    key: 'final',
    name: 'Final Touches',
    tasks: [
      task('final-01', 'Wipe fingerprints from glass / doors if needed'),
      task('final-02', 'Empty all household bins collected for the visit'),
      task('final-03', 'Quick visual check of main rooms'),
      task('final-04', 'Leave property tidy; report any issues noticed')
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
if (TASKS.length !== 49) {
  throw new Error('Domestic cleaning checklist must list 49 tasks, got ' + TASKS.length);
}

const SECTION_COUNTS = { kitchen: 11, bathroom: 9, toilet: 5, bedrooms: 8, living: 7, hallway: 5, final: 4 };
sections.forEach((section) => {
  const expected = SECTION_COUNTS[section.key];
  if (section.tasks.length !== expected) {
    throw new Error(section.name + ' must list ' + expected + ' tasks, got ' + section.tasks.length);
  }
});

const TASK_IDS = new Set(TASKS.map((t) => t.id));

const faqs = [
  {
    q: 'Do I need to be home during the clean?',
    a: "No, many of our customers give us safe access instructions (a key, code, or keysafe) and go about their day. We'll always follow the access notes you provide and lock up securely when we leave."
  },
  {
    q: 'Do you bring your own cleaning products and equipment?',
    a: "Yes, our cleaners bring professional grade products and equipment as standard. If you'd prefer we use your own supplies instead, just let us know when you book."
  },
  {
    q: 'Will I get the same cleaner every time?',
    a: "For recurring bookings, we always try to send the same trusted cleaner so they get to know your home and preferences. If they're ever unavailable, we'll send an equally vetted replacement."
  },
  {
    q: "What if I'm not happy with a clean?",
    a: "Just let us know within 24 hours and we'll send a cleaner back to put it right, free of charge, that's our 100% clean guarantee."
  },
  {
    q: 'Is oven cleaning included in a regular domestic clean?',
    a: 'A regular visit includes wiping the oven exterior and control panel. Cleaning inside the oven is an optional add on, not a standalone oven cleaning service. You can add it when you book, and the booking form shows the price before you confirm.'
  }
];

const nearYou = [
  ['Domestic cleaning in London and Essex', '/domestic-cleaning/'],
  ['Domestic cleaners in West Horndon', '/domestic-cleaning/west-horndon/'],
  ['Domestic cleaners in Shenfield', '/domestic-cleaning/shenfield/'],
  ['Domestic cleaners in Hutton', '/domestic-cleaning/hutton/'],
  ['Domestic cleaning in Brentwood', '/domestic-cleaning/essex/brentwood/']
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
  CHECKLIST_ID,
  OVEN_NOTE,
  sections,
  allTasks,
  TASKS,
  TASK_IDS,
  faqs,
  nearYou,
  howToSections
};
