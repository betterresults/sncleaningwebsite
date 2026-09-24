// SEO content for each service page: meta tags, long-form guide sections,
// price tables and extra FAQs. Merged into data/service-content.js.
// Prices are from the SN Cleaning Services price list. Keep every claim true.

const LONDON_ESSEX = 'across London and Essex';

module.exports = {
  'domestic-cleaning': {
    metaTitle: 'Domestic Cleaning London & Essex | From £23/hour',
    metaDescription:
      'Weekly, fortnightly, monthly or one-off domestic cleaning in London & Essex by our own insured, DBS-checked cleaners. From £23 an hour. Book online.',
    prices: [
      {
        title: 'Domestic cleaning prices (per hour)',
        note: 'Hourly rate per cleaner. The rate depends on how often we visit and whether we bring the products and equipment.',
        columns: ['How often', 'We bring cleaning products', 'We bring products & equipment'],
        rows: [
          ['Weekly', '£23', '£26'],
          ['Fortnightly', '£24', '£27'],
          ['Monthly', '£27', '£30'],
          ['One-off', '£29', '£35']
        ]
      }
    ],
    guide: [
      {
        h: 'What is domestic cleaning?',
        p: [
          'Domestic cleaning is regular, general cleaning of your home: kitchens, bathrooms, living areas and bedrooms kept clean and tidy on a schedule that suits you. It is the clean that keeps a home on top, week after week, rather than a one-time deep reset.',
          `SN Cleaning Services has provided domestic cleaning ${LONDON_ESSEX} for 12 years. Every clean is done by our own trained, insured and DBS-checked cleaners, never subcontractors, and we send the same cleaner wherever we can so they get to know your home.`
        ]
      },
      {
        h: 'How much does domestic cleaning cost in London and Essex?',
        p: [
          'Our domestic cleaning starts from £23 an hour for a weekly clean where we bring the cleaning products. Regular visits cost less per hour than a one-off, and the rate goes up slightly if you would like us to bring our own equipment as well. The full price table is above, and the booking form shows your exact price before you confirm.'
        ]
      },
      {
        h: 'Weekly, fortnightly or monthly: how often should you book?',
        p: [
          'Weekly suits busy households, families and homes with pets, where the house needs regular attention to stay on top. Fortnightly is a good balance for couples and smaller homes. Monthly works as a regular reset, and a one-off clean is there when you need a hand before guests arrive or after a busy few weeks.'
        ]
      },
      {
        h: 'Do you bring your own cleaning products?',
        p: [
          'Yes. We use professional products chosen for each surface, and we even make our own limescale remover. You can also choose for us to bring the equipment too, such as the vacuum and mop, which is useful if you would rather not keep your own.'
        ]
      }
    ],
    extraFaqs: [
      {
        question: 'How much is a cleaner per hour in London and Essex?',
        answer: 'Our domestic cleaning starts from £23 an hour for a weekly clean with our cleaning products. Fortnightly is £24, monthly £27 and a one-off clean £29 an hour. Add £3 to £6 an hour if you would like us to bring our own equipment as well.'
      },
      {
        question: 'Which areas do you cover for domestic cleaning?',
        answer: 'We cover London and Essex, including Romford, Upminster, Brentwood, Chelmsford and the surrounding areas. Enter your postcode in the quote form to check your address.'
      }
    ]
  },

  'end-of-tenancy-cleaning': {
    metaTitle: 'End of Tenancy Cleaning London & Essex | From £179',
    metaDescription:
      'End of tenancy cleaning in London & Essex to the checklist letting agents inspect against. Fixed prices from £179 for a studio. 72-hour re-clean if the agent flags anything.',
    prices: [
      {
        title: 'End of tenancy cleaning prices',
        note: 'Fixed price by property size and how furnished it is.',
        columns: ['Property', 'Unfurnished', 'Part furnished', 'Furnished'],
        rows: [
          ['Studio flat', '£179', '£199', '£215'],
          ['1 bed flat', '£205', '£225', '£245'],
          ['2 bed flat', '£229', '£249', '£275'],
          ['3 bed flat', '£275', '£299', '£329'],
          ['4 bed flat', '£319', '£349', '£385'],
          ['1 bed house', '£229', '£249', '£275'],
          ['2 bed house', '£259', '£285', '£309'],
          ['3 bed house', '£305', '£335', '£365'],
          ['4 bed house', '£349', '£385', '£439'],
          ['5 bed house', '£385', '£425', '£489']
        ]
      },
      {
        title: 'Oven cleaning add-on',
        columns: ['Oven', 'Price'],
        rows: [
          ['Single oven', '£49'],
          ['Double oven', '£79'],
          ['Single & convection oven', '£79'],
          ['Range oven', '£98'],
          ['AGA oven', '£129']
        ]
      },
      {
        title: 'Extra rooms',
        columns: ['Room', 'Unfurnished', 'Part furnished', 'Furnished'],
        rows: [
          ['Extra bathroom', '£35', '£38.50', '£42'],
          ['Extra toilet', '£18', '£19.80', '£21.60'],
          ['Living or dining room', '£35', '£38.50', '£42'],
          ['Utility or study room', '£26', '£28.60', '£31.20'],
          ['Conservatory', '£62', '£68.20', '£74.40']
        ]
      }
    ],
    guide: [
      {
        h: 'What is an end of tenancy clean?',
        p: [
          'An end of tenancy clean, also called a move-out clean, is a thorough clean of a rented property when a tenant leaves. It returns the property to the standard it was in at the start of the tenancy, which is what the letting agent or inventory clerk checks at the check-out inspection.',
          `We carry out end of tenancy cleaning ${LONDON_ESSEX} for tenants, landlords and letting agents, with our own trained, insured and DBS-checked team.`
        ]
      },
      {
        h: 'What do letting agents check at the end of a tenancy?',
        p: [
          'Agents and inventory clerks look at the same areas every time, so they are where we spend the most time:'
        ],
        list: [
          'Inside the oven, hob and extractor',
          'Limescale on taps, tiles, shower screens and toilets',
          'Inside the fridge, freezer, cupboards and wardrobes',
          'Skirting boards, door frames, light switches and sockets',
          'Marks on walls and doors, windowsills and internal glass',
          'Floors, including under where furniture stood'
        ]
      },
      {
        h: 'How much does end of tenancy cleaning cost?',
        p: [
          'Our end of tenancy cleaning is a fixed price based on the size of the property and how furnished it is, starting from £179 for an unfurnished studio flat. A 2 bed flat is from £229 and a 3 bed house from £305. Oven cleaning, extra bathrooms and extra rooms can be added, and the booking form shows your full price before you confirm.'
        ]
      },
      {
        h: 'What if the agent is not happy with the clean?',
        p: [
          'Tell us within 72 hours and we come back and re-clean anything cleaning-related that the agent has flagged, free of charge. We allow 72 hours rather than 24 because the property is empty and it can take a day or two for the agent or landlord to inspect.'
        ]
      },
      {
        h: 'When should you book an end of tenancy clean?',
        p: [
          'Book the clean for after your furniture and belongings have been moved out. An empty property lets us clean behind and under everything, which is exactly what the check-out inspection looks at. Booking a few days before your move-out date also gives time for any re-clean before you hand back the keys.'
        ]
      }
    ],
    extraFaqs: [
      {
        question: 'How much is an end of tenancy clean for a 2 bed flat?',
        answer: 'An end of tenancy clean for a 2 bed flat is £229 unfurnished, £249 part furnished and £275 furnished. Oven cleaning is an extra £49 for a single oven.'
      },
      {
        question: 'Do I need to be there for the end of tenancy clean?',
        answer: 'No. As long as we can get in, you do not need to be there. Tell us how we will access the property when you book and we will let you know when the clean is done.'
      }
    ]
  },

  'airbnb-cleaning': {
    metaTitle: 'Airbnb Cleaning London & Essex | Guest Turnovers',
    metaDescription:
      'Airbnb and short-let cleaning in London & Essex. Turnovers between guests, beds made, bathrooms and kitchens reset, essentials restocked on request. Book online.',
    guide: [
      {
        h: 'What is Airbnb cleaning?',
        p: [
          'Airbnb cleaning, also called a turnover or changeover clean, is the clean between one guest checking out and the next checking in. The property is cleaned, the beds are changed and the bathrooms, kitchen and living areas are reset so the listing is ready for the next stay.',
          `We clean Airbnb and short-let properties ${LONDON_ESSEX} for hosts and co-hosts, with our own trained, insured and DBS-checked team.`
        ]
      },
      {
        h: 'What is included in an Airbnb turnover clean?',
        p: [
          'Every turnover covers the whole property, not just a quick tidy:'
        ],
        list: [
          'Full clean and disinfection of the bathroom, with fresh towels laid out',
          'Kitchen surfaces and appliances wiped, used dishes washed and put away',
          'Beds made with fresh linen, floors vacuumed and mopped',
          'Bins emptied and recycling cleared',
          'A check for anything guests left behind, and any damage reported to you'
        ]
      },
      {
        h: 'Can you do same-day turnovers?',
        p: [
          'Yes. Same-day check-out to check-in turnovers are what this service is built for. Tell us your usual check-out and check-in times and we plan the clean around them.'
        ]
      },
      {
        h: 'Why use a professional cleaner for your Airbnb?',
        p: [
          'Guests notice cleanliness first, and it shows up in reviews. A professional team with a set checklist means every guest arrives to the same standard, and you do not have to be at the property between stays.'
        ]
      }
    ],
    extraFaqs: [
      {
        question: 'Do you clean Airbnb properties in Essex as well as London?',
        answer: 'Yes, we clean short-let and Airbnb properties across London and Essex. Enter your postcode in the quote form to check your address.'
      }
    ]
  },

  'deep-house-cleaning': {
    metaTitle: 'Deep Cleaning London & Essex | From £23/hour',
    metaDescription:
      'Deep house cleaning in London & Essex: inside the oven, grout, tiles, skirting boards and behind furniture. Own insured, DBS-checked team. From £23 an hour.',
    prices: [
      {
        title: 'Deep cleaning prices (per hour)',
        note: 'Hourly rate per cleaner for a one-off deep clean.',
        columns: ['Option', 'Price per hour'],
        rows: [
          ['Cleaning only (your products)', '£23.00'],
          ['We bring the cleaning products', '£24.90'],
          ['We bring products & equipment', '£25.90']
        ]
      }
    ],
    guide: [
      {
        h: 'What is a deep clean?',
        p: [
          'A deep clean is a top-to-bottom clean of the areas a regular clean does not usually cover. It goes after the grime that builds up over time: inside the oven, around grout and tiles, on skirting boards and door frames, and behind and under furniture.',
          `We carry out deep cleaning ${LONDON_ESSEX} with our own trained, insured and DBS-checked team, using professional products for every surface.`
        ]
      },
      {
        h: 'What is the difference between a regular clean and a deep clean?',
        p: [
          'A regular clean keeps a home that is already generally tidy on top: surfaces, floors, bathrooms and kitchen. A deep clean takes longer and reaches further, including inside appliances, limescale and grout in bathrooms, and all the edges and corners where dust collects. Many customers book a deep clean first and then move to regular cleaning.'
        ]
      },
      {
        h: 'How much does a deep clean cost?',
        p: [
          'Deep cleaning is charged by the hour, from £23 an hour if you provide the products, £24.90 if we bring the products and £25.90 if we bring the products and equipment. The time needed depends on the size of the home and its condition. Tell us about your home in the form above and we will send you a price.'
        ]
      },
      {
        h: 'Can you deep clean just the kitchen or bathroom?',
        p: [
          'Yes. You can book a deep clean for the whole home or only the rooms that need it. Kitchens and bathrooms are the most popular.'
        ]
      }
    ],
    extraFaqs: [
      {
        question: 'How much is a deep clean per hour?',
        answer: 'Our deep cleaning is £23 an hour if you provide the products, £24.90 if we bring the cleaning products and £25.90 if we bring products and equipment.'
      }
    ]
  },

  'after-builders-cleaning': {
    metaTitle: 'After Builders Cleaning London & Essex',
    metaDescription:
      'After builders and post-renovation cleaning in London & Essex. Building dust removed from every surface, ready to move in or hand over. Request a quote.',
    guide: [
      {
        h: 'What is an after builders clean?',
        p: [
          'An after builders clean, also called a post-construction or post-renovation clean, removes the dust, debris and residue left once building work is finished. Fine building dust settles on every surface, inside cupboards and on fittings, and a normal clean does not shift it.',
          `We carry out after builders cleaning ${LONDON_ESSEX} for homeowners, landlords, builders and developers, with our own trained, insured and DBS-checked team.`
        ]
      },
      {
        h: 'What is included in an after builders clean?',
        p: ['We clean the whole property from top to bottom:'],
        list: [
          'Dust removed from walls, skirting boards, light fittings, vents and sills',
          'Kitchen and bathroom fixtures, cabinets and drawers cleaned inside and out',
          'Floors vacuumed and mopped, and internal windows and frames cleaned',
          'Paint splashes and tape residue removed where possible',
          'Packaging and small debris cleared (large waste removal is arranged separately)'
        ]
      },
      {
        h: 'When should you book an after builders clean?',
        p: [
          'Book once the trades have finished and the property is clear to access. If you have a handover, move-in or completion date, tell us when you request a quote and we will plan the clean around it.'
        ]
      }
    ],
    extraFaqs: [
      {
        question: 'How much does an after builders clean cost?',
        answer: 'The price depends on the size of the property and the work that was done. Tell us about the job using the form on this page and we will send you a quote.'
      }
    ]
  },

  'carpet-cleaning-services': {
    metaTitle: 'Carpet Cleaning London & Essex | From £20',
    metaDescription:
      'Professional carpet and rug cleaning in London & Essex. Stains pre-treated, fast-dry method, priced per room from £20. Book online.',
    prices: [
      {
        title: 'Carpet cleaning prices',
        columns: ['Room or item', 'Price'],
        rows: [
          ['Hallway', '£20'],
          ['Single bedroom', '£45'],
          ['Double bedroom', '£59'],
          ['Master bedroom', '£79'],
          ['Living room', '£79'],
          ['Dining room', '£69'],
          ['Staircase', '£49'],
          ['Small or medium rug', '£29'],
          ['Large rug', '£59']
        ]
      }
    ],
    guide: [
      {
        h: 'How does professional carpet cleaning work?',
        p: [
          'We first check the carpet type and condition, vacuum up loose dirt and pre-treat visible stains. The carpet is then deep cleaned with professional equipment to lift dirt from deep in the fibres, treated for odours and finished with a fast-dry method.',
          `We clean carpets and rugs ${LONDON_ESSEX} in homes and rental properties, with our own trained, insured and DBS-checked team.`
        ]
      },
      {
        h: 'How much does carpet cleaning cost?',
        p: [
          'Carpet cleaning is priced per room, from £20 for a hallway, £45 for a single bedroom and £79 for a living room. A staircase is £49 and rugs start at £29. The full price list is above.'
        ]
      },
      {
        h: 'How long do carpets take to dry?',
        p: [
          'With our fast-dry method most carpets can be walked on within a few hours. Full drying can take up to 24 hours depending on the carpet and how well the room is ventilated.'
        ]
      },
      {
        h: 'Can carpet cleaning be added to an end of tenancy clean?',
        p: [
          'Yes. Carpets are often checked at the end of a tenancy, so many customers book carpet cleaning together with their end of tenancy clean.'
        ]
      }
    ],
    extraFaqs: [
      {
        question: 'How much does it cost to clean a living room carpet?',
        answer: 'Cleaning a living room carpet costs £79. A single bedroom is £45, a double bedroom £59 and a hallway £20.'
      }
    ]
  },

  'upholstery-cleaning': {
    metaTitle: 'Sofa & Upholstery Cleaning London & Essex | From £12',
    metaDescription:
      'Sofa, armchair and upholstery cleaning in London & Essex with fabric-safe products. 3-seater sofa £89, armchair £29, dining chair £12. Book online.',
    prices: [
      {
        title: 'Upholstery cleaning prices',
        columns: ['Item', 'Price'],
        rows: [
          ['2-seater sofa', '£69'],
          ['3-seater sofa', '£89'],
          ['Corner sofa', '£119'],
          ['Armchair', '£29'],
          ['Dining chair', '£12'],
          ['Ottoman', '£29'],
          ['Headboard', '£25'],
          ['Curtains (half)', '£29'],
          ['Curtains (full)', '£49']
        ]
      }
    ],
    guide: [
      {
        h: 'How is a sofa professionally cleaned?',
        p: [
          'We check the fabric type, test on a hidden area and pre-treat visible stains. The piece is then deep cleaned with a fabric-safe solution, paying attention to seams, piping and crevices, and finished with a fast-dry method.',
          `We clean sofas, armchairs, dining chairs, headboards and curtains ${LONDON_ESSEX}, with our own trained, insured and DBS-checked team.`
        ]
      },
      {
        h: 'How much does sofa cleaning cost?',
        p: [
          'Upholstery cleaning is priced per item: £69 for a 2-seater sofa, £89 for a 3-seater and £119 for a corner sofa. Armchairs are £29 and dining chairs £12. The full price list is above.'
        ]
      },
      {
        h: 'How long before I can use my sofa again?',
        p: [
          'Most upholstery is dry enough to sit on within a few hours, with full drying usually complete within 24 hours.'
        ]
      }
    ],
    extraFaqs: [
      {
        question: 'How much is it to clean a 3-seater sofa?',
        answer: 'Cleaning a 3-seater sofa costs £89. A 2-seater is £69 and a corner sofa £119.'
      }
    ]
  },

  'mattress-cleaning': {
    metaTitle: 'Mattress Cleaning London & Essex | From £39',
    metaDescription:
      'Professional mattress cleaning in London & Essex. Stains, odours and dust mites treated. Single £39, double £49, king £59. Book online.',
    prices: [
      {
        title: 'Mattress cleaning prices',
        columns: ['Mattress size', 'Price'],
        rows: [
          ['Single', '£39'],
          ['Double', '£49'],
          ['King', '£59'],
          ['Super king', '£69']
        ]
      }
    ],
    guide: [
      {
        h: 'Why get a mattress professionally cleaned?',
        p: [
          'A mattress is the one part of the bed that never goes in the wash. Over time it builds up dust mites, sweat and spills, even with clean sheets on top. A professional clean treats stains and odours and targets dust mites and allergens.',
          `We clean mattresses ${LONDON_ESSEX} in homes and rental properties, with our own trained, insured and DBS-checked team.`
        ]
      },
      {
        h: 'How much does mattress cleaning cost?',
        p: [
          'Mattress cleaning is priced by size: £39 for a single, £49 for a double, £59 for a king and £69 for a super king.'
        ]
      },
      {
        h: 'How often should a mattress be cleaned?',
        p: [
          'Once or twice a year keeps a mattress fresh. Book sooner after a spill or illness, if someone in the home has allergies, or when moving in or out of a property.'
        ]
      }
    ],
    extraFaqs: [
      {
        question: 'How much does it cost to clean a double mattress?',
        answer: 'Cleaning a double mattress costs £49. A single is £39, a king £59 and a super king £69.'
      }
    ]
  }
};
