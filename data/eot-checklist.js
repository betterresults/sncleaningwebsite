// End of tenancy cleaning checklist (public page).
// 58 tasks from the domestic Dilvon template "End of Tenancy Cleaning"
// (checklist_id a66bcc2a-9ef4-492d-995a-33e5dac87c6d, read 25 Nov 2026).
// Originally 8 sections, regrouped into 7 rooms. Oven tasks sit only under Appliances.
// Tips are not official tasks and are not printed on the PDF.

const PUBLISHED = '2026-11-26';
const PUBLISHED_LABEL = '26 November 2026';

const TITLE = 'End of Tenancy Cleaning Checklist | London & Essex';
const H1 = 'The deposit-ready end of tenancy cleaning checklist (London & Essex)';
const META_DESCRIPTION = 'Work through a room-by-room end of tenancy cleaning checklist. Tick each task, add notes and photos, then get a private link to your report.';

const PATH = '/end-of-tenancy-cleaning-checklist';
const PDF_PATH = '/downloads/sn-cleaning-end-of-tenancy-checklist.pdf';
const STORAGE_KEY = 'sn-eot-checklist-v1';

function task(id, text) {
  return { id, text };
}

const rooms = [
  {
    key: 'kitchen',
    name: 'Kitchen',
    tasks: [
      task('kitchen-01', 'Empty and wipe all cupboards inside and out'),
      task('kitchen-02', 'Empty and wipe all drawers'),
      task('kitchen-03', 'Clean tops of cupboards'),
      task('kitchen-04', 'Clean plinths / kickboards'),
      task('kitchen-05', 'Degrease cooker hob, including around burners'),
      task('kitchen-06', 'Clean extractor hood and filter'),
      task('kitchen-07', 'Descale and shine sink, taps, and drain'),
      task('kitchen-08', 'Wipe and disinfect all worktops'),
      task('kitchen-09', 'Wipe splashbacks / tiles'),
      task('kitchen-10', 'Empty bin; wipe bin inside and out'),
      task('kitchen-11', 'Vacuum and mop floor (including corners and under appliances where accessible)')
    ]
  },
  {
    key: 'bathrooms',
    name: 'Bathrooms',
    groups: [
      {
        key: 'bathroom',
        name: 'Bathroom',
        tasks: [
          task('bathroom-01', 'Descale and clean shower / bath'),
          task('bathroom-02', 'Clean shower screen / curtain (remove limescale)'),
          task('bathroom-03', 'Clean and disinfect toilet (bowl, seat, lid, base, behind)'),
          task('bathroom-04', 'Clean sink, taps, and overflow'),
          task('bathroom-05', 'Wipe vanity / cabinets inside and out'),
          task('bathroom-06', 'Clean mirrors smear-free'),
          task('bathroom-07', 'Wipe tiles and grout (remove soap scum)'),
          task('bathroom-08', 'Wipe towel rails, holders, and chrome fixtures'),
          task('bathroom-09', 'Empty bin; wipe bathroom surfaces'),
          task('bathroom-10', 'Vacuum and mop floor (including behind toilet)')
        ]
      },
      {
        key: 'toilet',
        name: 'Toilet / WC',
        tasks: [
          task('toilet-01', 'Clean and disinfect toilet fully'),
          task('toilet-02', 'Clean sink and taps'),
          task('toilet-03', 'Wipe walls / tiles at splash height'),
          task('toilet-04', 'Wipe door, handle, and light switch'),
          task('toilet-05', 'Vacuum and mop floor')
        ]
      }
    ]
  },
  {
    key: 'bedrooms',
    name: 'Bedrooms',
    tasks: [
      task('bedrooms-01', 'Wipe all surfaces, furniture, and skirting'),
      task('bedrooms-02', 'Wipe switches, sockets, and door handles'),
      task('bedrooms-03', 'Clean mirrors / glass'),
      task('bedrooms-04', 'Wipe window sills and frames (internal)'),
      task('bedrooms-05', 'Vacuum mattress base / under bed if accessible'),
      task('bedrooms-06', 'Vacuum carpets or vacuum + mop hard floors'),
      task('bedrooms-07', 'Empty wardrobe / drawers and wipe insides if empty')
    ]
  },
  {
    key: 'living',
    name: 'Living areas',
    tasks: [
      task('living-01', 'Dust and wipe all surfaces, shelves, and TV unit'),
      task('living-02', 'Wipe skirting boards'),
      task('living-03', 'Wipe switches, sockets, and door handles'),
      task('living-04', 'Clean mirrors / glass'),
      task('living-05', 'Wipe window sills and frames (internal)'),
      task('living-06', 'Vacuum sofas / soft furnishings (surface)'),
      task('living-07', 'Vacuum carpets or vacuum + mop hard floors')
    ],
    tips: [
      'Check under and behind sofas, and inside the cushions, where dust settles.',
      'Doors, door frames, light fittings and radiators are easy to miss on the way out.'
    ]
  },
  {
    key: 'hallways',
    name: 'Hallways and stairs',
    groups: [
      {
        key: 'hallway',
        name: 'Hallway / Stairs / Landing',
        tasks: [
          task('hallway-01', 'Wipe banisters, spindles, and stair stringers'),
          task('hallway-02', 'Wipe skirting boards'),
          task('hallway-03', 'Wipe switches, sockets, and door handles'),
          task('hallway-04', 'Wipe front door (internal) and threshold'),
          task('hallway-05', 'Vacuum stairs and landings thoroughly'),
          task('hallway-06', 'Vacuum and mop hard floors')
        ]
      },
      {
        key: 'final',
        name: 'Final checks',
        tasks: [
          task('final-01', 'Remove all rubbish and recycling'),
          task('final-02', 'Check all rooms for missed marks / cobwebs'),
          task('final-03', 'Replace vacuumed rugs / move furniture back where moved'),
          task('final-04', 'Final walkthrough; leave property tidy and fresh')
        ]
      }
    ],
    tips: [
      'Clear belongings out of the loft, garage and garden store if the tenancy includes them.',
      'Keep dated photos and any cleaning receipts with your check-in inventory.'
    ]
  },
  {
    key: 'windows',
    name: 'Windows',
    tasks: [
      task('windows-01', 'Clean all internal windows smear-free'),
      task('windows-02', 'Clean window tracks / ledges'),
      task('windows-03', 'Clean internal glass doors / patio doors')
    ],
    tips: [
      'Outside windows are not part of the standard end of tenancy clean.'
    ]
  },
  {
    key: 'appliances',
    name: 'Appliances',
    tasks: [
      task('appliances-01', 'Clean oven inside (racks, trays, door glass)'),
      task('appliances-02', 'Clean oven outside and control panel'),
      task('appliances-03', 'Clean microwave inside and out'),
      task('appliances-04', 'Clean fridge inside and out (defrost if needed)'),
      task('appliances-05', 'Clean dishwasher inside and out (filter if accessible)')
    ],
    tips: [
      'Wipe the oven door seal, and take a dated photo inside the oven once it is clean.',
      'Freezer shelves, drawers and seals, and the washing machine door seal and detergent drawer, are worth a look if the inventory mentions them.',
      'Oven cleaning on this list is part of handing the property back. It is not a standalone oven-cleaning service. If you book us, the oven is an optional extra.'
    ]
  }
];

function groupsOf(room) {
  if (room.groups && room.groups.length) return room.groups;
  return [{ key: room.key, name: room.name, tasks: room.tasks || [] }];
}

function allTasks() {
  const out = [];
  rooms.forEach((room) => {
    groupsOf(room).forEach((group) => {
      group.tasks.forEach((item) => out.push({ ...item, room: room.key, group: group.key }));
    });
  });
  return out;
}

const TASKS = allTasks();
if (TASKS.length !== 58) {
  throw new Error('End of tenancy checklist must list 58 tasks, got ' + TASKS.length);
}

const TASK_IDS = new Set(TASKS.map((t) => t.id));
const ROOM_KEYS = new Set(rooms.map((r) => r.key));

const faqs = [
  {
    q: 'Do I legally have to pay for a professional end of tenancy clean?',
    a: "No. Since the Tenant Fees Act 2019, a landlord in England can't make you pay for a professional clean. You do have to hand the property back as clean as it was when you moved in, allowing for fair wear and tear.",
    source: { name: 'GOV.UK: Tenant Fees Act 2019 guidance', url: 'https://www.gov.uk/government/publications/tenant-fees-act-2019-guidance' }
  },
  {
    q: 'What does an end of tenancy clean include?',
    a: 'Every room from top to bottom: inside all kitchen cupboards and drawers, the fridge and freezer, hob, extractor and microwave, bathrooms descaled, internal glass, skirting boards, doors, switches and radiators, carpets vacuumed and hard floors washed. We follow a checklist for every room.'
  },
  {
    q: 'Is oven cleaning included?',
    a: "No, it's an optional extra. Professional internal kitchen appliance cleaning, including the oven, can be added when you book, and it's priced by the size of the oven. You see the price before you confirm."
  },
  {
    q: 'Do you clean windows, inside and outside?',
    a: 'We clean the inside of the windows and all internal glass. Outside windows are not included.'
  },
  {
    q: 'What happens if the agent says something was missed?',
    a: 'Tell us within 7 days, through the customer app or WhatsApp, and we come back and put it right free of charge. We aim to return within 1 to 2 working days.'
  }
];

const citations = [
  'https://www.depositprotection.com/news-insights/cleaning-main-cause-of-tenancy-deposit-deductions-for-a-fifth-year-running',
  'https://custodial.tenancydepositscheme.com/news/blog/asktds-what-is-the-difference-between-professional-and-domestic/',
  'https://www.mydeposits.co.uk/wp-content/uploads/2024/08/Get-your-deposit-back-Keeping-your-property-clean-updated.pdf',
  'https://www.gov.uk/government/publications/tenant-fees-act-2019-guidance',
  'https://www.gov.uk/tenancy-deposit-protection'
];

const londonBoroughs = [
  ['Barking and Dagenham', '/end-of-tenancy-cleaning/barking-and-dagenham/'],
  ['Barnet', '/end-of-tenancy-cleaning/barnet/'],
  ['Bexley', '/end-of-tenancy-cleaning/bexley/'],
  ['Brent', '/end-of-tenancy-cleaning/brent/'],
  ['Bromley', '/end-of-tenancy-cleaning/bromley/'],
  ['Camden', '/end-of-tenancy-cleaning/camden/'],
  ['Croydon', '/end-of-tenancy-cleaning/croydon/'],
  ['Ealing', '/end-of-tenancy-cleaning/ealing/'],
  ['Enfield', '/end-of-tenancy-cleaning/enfield/'],
  ['Greenwich', '/end-of-tenancy-cleaning/greenwich/'],
  ['Haringey', '/end-of-tenancy-cleaning/haringey/'],
  ['Harrow', '/end-of-tenancy-cleaning/harrow/'],
  ['Havering', '/end-of-tenancy-cleaning/havering/'],
  ['Hillingdon', '/end-of-tenancy-cleaning/hillingdon/'],
  ['Hounslow', '/end-of-tenancy-cleaning/hounslow/'],
  ['Islington', '/end-of-tenancy-cleaning/islington/'],
  ['Kensington and Chelsea', '/end-of-tenancy-cleaning/kensington-and-chelsea/'],
  ['Lambeth', '/end-of-tenancy-cleaning/lambeth/'],
  ['Lewisham', '/end-of-tenancy-cleaning/lewisham/'],
  ['Merton', '/end-of-tenancy-cleaning/merton/'],
  ['Newham', '/end-of-tenancy-cleaning/newham/'],
  ['Redbridge and Ilford', '/end-of-tenancy-cleaning/redbridge/'],
  ['Richmond upon Thames', '/end-of-tenancy-cleaning/richmond/'],
  ['Southwark', '/end-of-tenancy-cleaning/southwark/'],
  ['Sutton', '/end-of-tenancy-cleaning/sutton/'],
  ['Tower Hamlets', '/end-of-tenancy-cleaning/tower-hamlets/'],
  ['Waltham Forest', '/end-of-tenancy-cleaning/waltham-forest/'],
  ['Wandsworth', '/end-of-tenancy-cleaning/wandsworth/'],
  ['Westminster', '/end-of-tenancy-cleaning/westminster/']
];

const essexPlaces = [
  ['Brentwood', '/end-of-tenancy-cleaning/essex/brentwood/'],
  ['Romford', '/end-of-tenancy-cleaning/romford/'],
  ['Chelmsford', '/end-of-tenancy-cleaning/chelmsford/'],
  ['Basildon', '/end-of-tenancy-cleaning/basildon/'],
  ['Billericay', '/end-of-tenancy-cleaning/billericay/'],
  ['Southend-on-Sea', '/end-of-tenancy-cleaning/southend-on-sea/'],
  ['Wickford', '/end-of-tenancy-cleaning/wickford/'],
  ['Rayleigh', '/end-of-tenancy-cleaning/rayleigh/'],
  ['Laindon', '/end-of-tenancy-cleaning/laindon/'],
  ['Pitsea', '/end-of-tenancy-cleaning/pitsea/']
];

const howToSections = rooms.map((room) => ({
  name: room.name,
  tasks: groupsOf(room).reduce((list, group) => list.concat(group.tasks), [])
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
  rooms,
  groupsOf,
  allTasks,
  TASKS,
  TASK_IDS,
  ROOM_KEYS,
  faqs,
  citations,
  londonBoroughs,
  essexPlaces,
  howToSections
};
