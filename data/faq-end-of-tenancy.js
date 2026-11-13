// End of tenancy FAQ page (/end-of-tenancy-cleaning/faq/).
// Answers come from Silvia (6 Nov 2026) and the site's rules. Do not add answers she has not given.
// `top: true` marks the questions shown on every end of tenancy page with a link to this page.
module.exports = {
  slug: 'end-of-tenancy-cleaning',
  title: 'End of tenancy cleaning FAQ',
  linkLabel: 'See all end of tenancy questions',
  // Main area pages linked at the bottom of the FAQ page
  nearYou: [
    { name: 'Brentwood', url: '/end-of-tenancy-cleaning/essex/brentwood/' },
    { name: 'Shenfield', url: '/end-of-tenancy-cleaning/shenfield/' },
    { name: 'Basildon', url: '/end-of-tenancy-cleaning/basildon/' },
    { name: 'Chelmsford', url: '/end-of-tenancy-cleaning/chelmsford/' },
    { name: 'Romford', url: '/end-of-tenancy-cleaning/romford/' },
    { name: 'Harold Wood', url: '/end-of-tenancy-cleaning/havering/harold-wood/' },
    { name: 'Harold Hill', url: '/end-of-tenancy-cleaning/havering/harold-hill/' },
    { name: 'Gidea Park', url: '/end-of-tenancy-cleaning/havering/gidea-park/' },
    { name: 'Hornchurch', url: '/end-of-tenancy-cleaning/havering/hornchurch/' },
    { name: 'Upminster', url: '/end-of-tenancy-cleaning/havering/upminster/' },
    { name: 'Havering', url: '/end-of-tenancy-cleaning/havering/' },
    { name: 'Essex', url: '/end-of-tenancy-cleaning/essex/' }
  ],
  groups: [
    {
      name: 'The clean itself',
      items: [
        {
          q: 'What is an end of tenancy clean?',
          a: "A top to bottom clean of the whole property when you move out, done so it matches the check in inventory and is ready for the next tenant. It's what letting agents and landlords expect to see at the final inspection."
        },
        {
          q: 'What does an end of tenancy clean include?',
          top: true,
          a: 'Every room from top to bottom: inside all kitchen cupboards and drawers, the fridge and freezer, hob, extractor and microwave, bathrooms descaled, internal glass, skirting boards, doors, switches and radiators, carpets vacuumed and hard floors washed. We follow a checklist for every room.'
        },
        {
          q: 'Is oven cleaning included?',
          top: true,
          a: "No, it's an optional extra. Professional internal kitchen appliance cleaning, including the oven, can be added when you book, and it's priced by the size of the oven. You see the price before you confirm."
        },
        {
          q: 'Is carpet cleaning included?',
          links: [{ text: 'Carpet cleaning', url: '/carpet-cleaning-services/' }],
          a: 'Carpets are vacuumed as part of every end of tenancy clean. Professional carpet cleaning is a separate service from £49, which you can add if your tenancy agreement asks for it or the carpets need it.'
        },
        {
          q: 'Do you clean windows, inside and outside?',
          a: 'We clean the inside of the windows and all internal glass. Outside windows are not included.'
        },
        {
          q: 'Do you clean walls, marks and scuffs?',
          a: "We check the walls and remove marks where we can. Washing whole walls isn't part of the clean, and if there are a lot of marks, removing them is an additional charge."
        },
        { q: 'Can you clean a property where pets have lived?', a: "Yes, that's fine." },
        {
          q: 'Do you bring your own products and equipment?',
          a: "Yes. Our team brings professional products and equipment, including our own Limescale Remover. You don't need to buy anything."
        },
        {
          q: 'Does the property need to be empty?',
          a: 'Yes. For an end of tenancy clean the property must be free of personal belongings.'
        },
        { q: 'Do I need to be there during the clean?', a: 'No. We just need access to the property.' },
        {
          q: 'Do the electricity and hot water need to be on?',
          a: 'Yes. Please make sure the electricity is on and the boiler is working so there is hot water, and switch off the fridge and freezer before we arrive so they can be defrosted and cleaned.'
        }
      ]
    },
    {
      name: 'Time and booking',
      items: [
        {
          q: 'How long does an end of tenancy clean take?',
          a: "Usually between 3 and 6 hours for the team, depending on the size of the property. A one bedroom property can take 3 to 4 hours, depending on whether it's furnished or unfurnished."
        },
        {
          q: 'How many cleaners will come?',
          a: 'We work in teams. For a studio or one bedroom we may send one cleaner. For two or three bedrooms we send two cleaners, sometimes three for a larger three bedroom home, and for four bedrooms or more usually three.'
        },
        { q: 'How far ahead should I book?', a: 'Whenever suits you. You can book up to around six months ahead.' },
        { q: 'Do you do same day or weekend cleans?', a: 'Yes, we clean at weekends and can do same day cleans. Just get in touch.' },
        {
          q: "How do you get the keys if I've already moved out?",
          a: "We can collect and return the keys from your office, a neighbour or another place nearby. Within one mile of the property it's free, up to three miles is £15 and up to five miles is £25. If the keys are further away, get in touch first."
        }
      ]
    },
    {
      name: 'Price and payment',
      items: [
        {
          q: 'How much does an end of tenancy clean cost?',
          top: true,
          a: 'From £179. The exact price depends on the size of the property, mainly the number of bedrooms and bathrooms, and what you need. You see it before you book through Get a quote. Extras such as oven cleaning and carpet cleaning are added only if you choose them.'
        },
        {
          q: 'Is it charged by the hour?',
          a: "It isn't charged by the hour. Your price is calculated from the size of the property and what you choose to include, such as the number of bedrooms and bathrooms and extras like carpet cleaning. Prices start from £179, and you see your exact price before you confirm."
        },
        {
          q: 'How and when do I pay?',
          a: 'You add your card details when you book. 48 hours before the clean we authorise the amount on your card, and we only charge it once the job is completed.'
        }
      ]
    },
    {
      name: 'Your deposit, your landlord and the law',
      items: [
        {
          q: 'Do I legally have to pay for a professional end of tenancy clean?',
          a: "No. Since the Tenant Fees Act 2019, a landlord in England can't make you pay for a professional clean. You do have to hand the property back as clean as it was when you moved in, allowing for fair wear and tear.",
          source: { name: 'GOV.UK: Tenant Fees Act 2019 guidance', url: 'https://www.gov.uk/government/publications/tenant-fees-act-2019-guidance' }
        },
        {
          q: 'Can my landlord take cleaning costs from my deposit?',
          a: 'Yes, if the property is less clean than it was at check in, beyond fair wear and tear. The landlord has to show this, usually by comparing the check in and check out inventories. If you disagree, your deposit protection scheme (DPS, mydeposits or TDS) offers free dispute resolution.',
          source: { name: 'GOV.UK: Tenancy deposit protection', url: 'https://www.gov.uk/tenancy-deposit-protection' }
        },
        {
          q: 'Will a professional clean get my deposit back?',
          top: true,
          a: "It gives you the best chance, because we clean to what the agent checks. If the clean is booked and done properly, your deposit shouldn't be reduced for poor cleaning. If the agent or landlord says an area isn't clean enough, we come back and clean it for free."
        },
        {
          q: 'What does the letting agent or inventory clerk check?',
          links: [{ text: 'End of tenancy: what actually gets checked', url: '/blog/end-of-tenancy-what-gets-checked/' }],
          a: 'Inside every cupboard and drawer, the fridge, freezer and oven, limescale on taps and shower screens, the extractor, skirting boards, door frames, switches and the inside of windows, compared with the check in report.'
        },
        {
          q: 'What is fair wear and tear?',
          a: "Normal deterioration from everyday living, such as light scuffs or carpet worn where people walk. A landlord can't charge you for it. Dirt, grease and limescale are not fair wear and tear."
        },
        {
          q: 'What happens if the agent says something was missed?',
          a: 'Tell us within 7 days, through the customer app or WhatsApp, and we come back and put it right free of charge. We aim to return within 1 to 2 working days.'
        },
        { q: 'Do you give a receipt or cleaning certificate for the agent?', a: 'Yes, we do.' }
      ]
    },
    {
      name: 'About SN Cleaning Services',
      items: [
        {
          q: 'What is your show up guarantee?',
          links: [{ text: 'Why tenants and agents choose us', url: '/why-us/end-of-tenancy-cleaning/' }],
          a: "Your clean happens on the day you booked. If something outside our control happens, we do it within 12 hours or it's free."
        },
        {
          q: 'What is your deposit back guarantee?',
          links: [{ text: 'Why tenants and agents choose us', url: '/why-us/end-of-tenancy-cleaning/' }],
          a: "It covers everything related to the cleaning you booked. If the agent or landlord isn't happy with an area we cleaned, we come back and clean it again for free. It can't cover services you didn't book: for example, the standard clean includes vacuuming the carpets, so if the agent asks for professional carpet cleaning and it wasn't booked, that isn't covered."
        },
        {
          q: 'Are your cleaners vetted, insured and DBS checked?',
          a: 'Yes. Every cleaner is part of our own team, trained, insured and DBS checked. We never use subcontractors.'
        },
        { q: 'Do landlords and letting agents book with you too?', a: 'Yes. Tenants, landlords and letting agents can all book.' },
        {
          q: "What's the difference between an end of tenancy clean and a deep clean?",
          links: [{ text: 'Deep cleaning', url: '/deep-house-cleaning/' }],
          a: "An end of tenancy clean is for moving out: the property is empty, it follows the agent's checklist and it's priced by the size of the property and what you need, from £179. A deep clean is for a home you live in, booked by the hour from £27 an hour."
        },
        {
          q: 'Do you also clean before a new tenant moves in?',
          a: 'Yes. Even after a professional clean, a property can get dusty while it stands empty, after work has been done or after viewings. We can clean it again before the new tenant moves in.'
        }
      ]
    }
  ]
};
