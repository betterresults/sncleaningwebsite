// SEO content for each service page: meta tags, long-form guide sections,
// price tables and extra FAQs. Merged into data/service-content.js.
// Prices are from the SN Cleaning Services price list. Keep every claim true.

const LONDON_ESSEX = 'across London and Essex';

module.exports = {
  'domestic-cleaning': {
    metaTitle: 'Domestic Cleaning London and Essex | Own DBS Checked Team',
    metaDescription:
      'Weekly, fortnightly or one off domestic cleaning in London and Essex by our own DBS checked cleaners, with a 24 hour re clean guarantee. Book online.',
    prices: [],
    guide: [
      {
        h: 'What is domestic cleaning?',
        p: [
          'Domestic cleaning is regular, general cleaning of your home: kitchens, bathrooms, living areas and bedrooms kept clean and tidy on a schedule that suits you. It is the clean that keeps a home on top, week after week, rather than a one time deep reset.',
          'You can work through our [room by room domestic cleaning checklist](/domestic-cleaning-checklist/) to see exactly what a regular visit covers.',
          `SN Cleaning Services has provided domestic cleaning ${LONDON_ESSEX} for 12 years. Every clean is done by our own trained, insured and DBS checked cleaners, never subcontractors, and we send the same cleaner wherever we can so they get to know your home.`
        ]
      },
      {
        h: 'How much does domestic cleaning cost in London and Essex?',
        p: [
          'Our domestic cleaning starts from £23 an hour. Regular visits cost less per hour than a one off clean. Click Get a quote, enter your postcode and email, and the booking form shows your exact price before you confirm.'
        ]
      },
      {
        h: 'Weekly, fortnightly or monthly: how often should you book?',
        p: [
          'Weekly suits busy households, families and homes with pets, where the house needs regular attention to stay on top. Fortnightly is a good balance for couples and smaller homes. Monthly works as a regular reset, and a one off clean is there when you need a hand before guests arrive or after a busy few weeks.'
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
        answer: 'Our domestic cleaning starts from £23 an hour. The rate depends on how often we visit and whether we bring equipment as well as products, and the booking form shows your exact price.'
      },
      {
        question: 'Which areas do you cover for domestic cleaning?',
        answer: 'We cover London and Essex, including Romford, Upminster, Brentwood, Chelmsford and the surrounding areas. Enter your postcode in the quote form to check your address.'
      }
    ]
  },

  'end-of-tenancy-cleaning': {
    metaTitle: 'End of Tenancy Cleaning London and Essex | Deposit Back',
    metaDescription:
      'End of tenancy cleaning for homes in London and Essex by SN Cleaning Services, with a deposit back guarantee and a 7 day re clean. Book online.',
    prices: [],
    guide: [
      {
        h: 'What is an end of tenancy clean?',
        p: [
          'An end of tenancy clean, also called a move out clean, is a thorough clean of a rented property when a tenant leaves. It returns the property to the standard it was in at the start of the tenancy, which is what the letting agent or inventory clerk checks at the check out inspection.',
          `We carry out end of tenancy cleaning ${LONDON_ESSEX} for tenants, landlords and letting agents, with our own trained, insured and DBS checked team.`
        ]
      },
      {
        h: 'What do letting agents check at the end of a tenancy?',
        p: [
          'Agents and inventory clerks look at the same areas every time, so they are where we spend the most time:',
          'If you are cleaning the property yourself, work through our [room by room end of tenancy cleaning checklist](/end-of-tenancy-cleaning-checklist/) before the inspection.'
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
          'Our end of tenancy cleaning starts from £179. The exact price depends on the number of bedrooms and bathrooms and what you choose to add, such as professional internal kitchen appliance cleaning for the oven, which is an optional extra priced by the size of the oven. Click Get a quote and the booking form shows your full price before you confirm.'
        ]
      },
      {
        h: 'What if the agent is not happy with the clean?',
        p: [
          'Tell us within 7 days through the customer app or WhatsApp and we come back and re clean anything cleaning related that the agent has flagged, free of charge. We allow 7 days because the property is empty and the agent or inventory clerk often needs a few days to visit and write the report. We aim to come back within 1 to 2 working days, and a re clean is always a priority, so it is often done within 24 hours.'
        ]
      },
      {
        h: 'When should you book an end of tenancy clean?',
        p: [
          'Book the clean for after your furniture and belongings have been moved out. An empty property lets us clean behind and under everything, which is exactly what the check out inspection looks at. Booking a few days before your move out date also gives time for any re clean before you hand back the keys.'
        ]
      }
    ],
    extraFaqs: [
      {
        question: 'How is the price worked out for an end of tenancy clean?',
        answer: 'It starts from £179 and depends on the number of bedrooms and bathrooms and any extras you add, such as the oven, which is optional. The booking form shows your exact price before you confirm, so you know what you will pay before we start.'
      },
      {
        question: 'Do I need to be there for the end of tenancy clean?',
        answer: 'No. As long as we can get in, you do not need to be there. Tell us how we will access the property when you book and we will let you know when the clean is done.'
      }
    ]
  },

  'airbnb-cleaning': {
    metaTitle: 'Airbnb Cleaning London and Essex | Reliable Changeovers',
    metaDescription:
      'Airbnb and short let cleaning in London and Essex: turnovers between guests, beds made, bathrooms and kitchens reset, essentials restocked on request.',
    // Airbnb price list (Silvia, 18 Nov 2026; matches the Dilvon booking form).
    prices: [
      {
        title: 'Airbnb cleaning prices',
        note: 'Per cleaner, per hour, minimum 2 hours a visit. Professional grade cleaning products always included.',
        items: [
          {
            name: 'Check in and check out clean',
            price: '£26 per hour',
            text: 'Your guest has left and the next one is on the way. We clean the whole property, make the beds, reset the bathroom and kitchen, empty the bins and check for anything left behind or damaged, so it is ready for the next guest.'
          },
          {
            name: 'Mid stay clean',
            price: '£24 per hour',
            text: 'Your guests are still staying and the property needs freshening up. We clean the bathroom, kitchen and floors, empty the bins and change the bed linen and towels if you leave fresh ones for us.'
          },
          {
            name: 'Refresh clean',
            price: '£23 per hour',
            text: 'The property was already cleaned, but it has stood empty for a while or there has been some work done. We go round, dust, do the floors and wipe down the bathroom and kitchen so it is fresh and ready for the next guest.'
          },
          {
            name: 'Deep clean after a long stay',
            price: '£29 per hour',
            text: 'Guests have stayed for a longer period and a normal changeover is not enough. We clean top to bottom and spend longer on limescale, kitchen grease, skirting boards and the places a quick clean misses.'
          }
        ],
        footer: 'Several properties? Check in and check out cleans come down to £25 per hour when we look after more than one of your properties.'
      }
    ],
    guide: [
      {
        h: 'What is Airbnb cleaning?',
        p: [
          'Airbnb cleaning, also called a turnover or changeover clean, is the clean between one guest checking out and the next checking in. The property is cleaned, the beds are changed and the bathrooms, kitchen and living areas are reset so the listing is ready for the next stay.',
          `We clean Airbnb and short let properties ${LONDON_ESSEX} for hosts and co hosts, with our own trained, insured and DBS checked team.`
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
        h: 'How much does Airbnb cleaning cost?',
        p: [
          'You pay by the hour, per cleaner, with a minimum of 2 hours a visit, so a studio or a one bedroom let only pays for the time it needs. The price depends on the type of clean: see the price list for what each one covers. Hosts with several properties pay £25 an hour for check in and check out cleans. Click Get a quote and the booking form shows your exact price before you confirm.'
        ]
      },
      {
        h: 'Do you bring cleaning products and equipment?',
        p: [
          'Our prices always include the cleaning products. We bring professional grade products to every clean, including our own Limescale Remover, because that is the only way we get the result we want, guest after guest.',
          'Equipment such as a vacuum and mop can be added on request. Tell us how often you need cleaning and a little about the property first, so we can confirm we can supply it for your property.'
        ]
      },
      {
        h: 'Can you do same day turnovers?',
        p: [
          'Yes. Same day check out to check in turnovers are what this service is built for. Tell us your usual check out and check in times and we plan the clean around them.'
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
        question: 'How much is an Airbnb cleaner per hour?',
        answer: 'A check in and check out clean is £26 an hour for one property and £25 an hour if we clean several of your properties. Mid stay cleans are £24, refresh cleans £23 and a deep clean after a long stay £29 an hour. Prices are per cleaner, include professional cleaning products and have a 2 hour minimum.'
      },
      {
        question: 'Do you clean Airbnb properties in Essex as well as London?',
        answer: 'Yes, we clean short let and Airbnb properties across London and Essex. Enter your postcode in the quote form to check your address.'
      }
    ]
  },

  'deep-house-cleaning': {
    metaTitle: 'Deep Cleaning London and Essex | Own DBS Checked Team',
    metaDescription:
      'Deep house cleaning in London and Essex: grout, tiles, limescale, skirting boards and behind furniture, by our own insured, DBS checked team. No judgement.',
    prices: [],
    guide: [
      {
        h: 'What is a deep clean?',
        p: [
          'A deep clean is a top to bottom clean of the areas a regular clean does not usually cover. It goes after the grime that builds up over time: inside the oven, around grout and tiles, on skirting boards and door frames, and behind and under furniture.',
          `We carry out deep cleaning ${LONDON_ESSEX} with our own trained, insured and DBS checked team, using professional products for every surface.`
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
          'Deep cleaning is charged by the hour, from £27 an hour. The time needed depends on the size of the home and its condition. Tell us about your home in the form above and we will send you a price.'
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
        answer: 'Our deep cleaning starts from £27 an hour. How many hours it takes depends on the size and condition of the home, so we send you a price once you tell us about it.'
      }
    ]
  },

  'after-builders-cleaning': {
    metaTitle: 'After Builders Cleaning London and Essex | Dust Free Finish',
    metaDescription:
      'After builders and post renovation cleaning in London and Essex. Building dust removed from every surface, ready to move in or hand over. Request a quote.',
    guide: [
      {
        h: 'What is an after builders clean?',
        p: [
          'An after builders clean, also called a post construction or post renovation clean, removes the dust, debris and residue left once building work is finished. Fine building dust settles on every surface, inside cupboards and on fittings, and a normal clean does not shift it.',
          `We carry out after builders cleaning ${LONDON_ESSEX} for homeowners, landlords, builders and developers, with our own trained, insured and DBS checked team.`
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
          'Book once the trades have finished and the property is clear to access. If you have a handover, move in or completion date, tell us when you request a quote and we will plan the clean around it.'
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
    metaTitle: 'Carpet Cleaning London and Essex | 5★ Rated on Google',
    metaDescription:
      'Professional carpet and rug cleaning in London and Essex by our trained team. Stains treated before cleaning, then a fast dry. Book online.',
    prices: [],
    guide: [
      {
        h: 'How does professional carpet cleaning work?',
        p: [
          'We first check the carpet type and condition, vacuum up loose dirt and pre treat visible stains. The carpet is then deep cleaned with professional equipment to lift dirt from deep in the fibres, treated for odours and finished with a fast dry method.',
          `We clean carpets and rugs ${LONDON_ESSEX} in homes and rental properties, with our own trained, insured and DBS checked team.`
        ]
      },
      {
        h: 'How much does carpet cleaning cost?',
        p: [
          'Carpet cleaning starts from £49. The price depends on the rooms, stairs and rugs you need cleaned, and the booking form shows your exact price before you confirm.'
        ]
      },
      {
        h: 'How long do carpets take to dry?',
        p: [
          'With our fast dry method most carpets can be walked on within a few hours. Full drying can take up to 24 hours depending on the carpet and how well the room is ventilated.'
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
        question: 'How is carpet cleaning priced?',
        answer: 'By room, so you only pay for what you need cleaned. It starts from £49, and adding stairs or rugs is simple in the booking form.'
      }
    ]
  },

  'upholstery-cleaning': {
    metaTitle: 'Sofa and Upholstery Cleaning London and Essex | 5★ Rated',
    metaDescription:
      'Sofa, armchair and upholstery cleaning in London and Essex with products matched to the fabric, by our own trained, insured team. Rated 5.0 on Google.',
    prices: [],
    guide: [
      {
        h: 'How is a sofa professionally cleaned?',
        p: [
          'We check the fabric type, test on a hidden area and pre treat visible stains. The piece is then deep cleaned with a fabric safe solution, paying attention to seams, piping and crevices, and finished with a fast dry method.',
          `We clean sofas, armchairs, dining chairs, headboards and curtains ${LONDON_ESSEX}, with our own trained, insured and DBS checked team.`
        ]
      },
      {
        h: 'How much does sofa cleaning cost?',
        p: [
          'Upholstery cleaning is priced per item, so the cost depends on what you need cleaned: sofas, armchairs, dining chairs, headboards or curtains. Click Get a quote and the booking form shows your exact price.'
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
        question: 'How is sofa cleaning priced?',
        answer: 'Per item, based on the size of the sofa or chair. Add each piece in the booking form and it shows your exact price before you confirm.'
      }
    ]
  },

  'mattress-cleaning': {
    metaTitle: 'Mattress Cleaning London and Essex | 5★ Rated on Google',
    metaDescription:
      'Professional mattress cleaning in London and Essex. Stains, odours and dust mites treated by our trained team, with a 24 hour re clean. Book online.',
    prices: [],
    guide: [
      {
        h: 'Why get a mattress professionally cleaned?',
        p: [
          'A mattress is the one part of the bed that never goes in the wash. Over time it builds up dust mites, sweat and spills, even with clean sheets on top. A professional clean treats stains and odours and targets dust mites and allergens.',
          `We clean mattresses ${LONDON_ESSEX} in homes and rental properties, with our own trained, insured and DBS checked team.`
        ]
      },
      {
        h: 'How much does mattress cleaning cost?',
        p: [
          'Mattress cleaning is priced by the size of the mattress. Click Get a quote and the booking form shows your exact price.'
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
        question: 'How is mattress cleaning priced?',
        answer: 'By size, from single to super king. Choose yours in the booking form and it shows the exact price before you confirm.'
      }
    ]
  }
};
