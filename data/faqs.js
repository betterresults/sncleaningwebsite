// Site-wide FAQs shown on the homepage. Distinct from the per-service FAQs
// stored in Supabase's service_pages.faqs (those answer service-specific
// questions on each service page; these answer general "should I book" and
// "how does this work" questions before someone commits).
module.exports = [
  {
    question: 'What areas do you cover?',
    answer:
      "We cover London and Essex — see the full list of boroughs and towns below. If you're just outside these areas, get in touch and we'll do our best to accommodate you."
  },
  {
    question: 'How much does a cleaning cost?',
    answer:
      "Pricing is flat-rate based on the size of your space and the type of clean, so there are no hidden fees or surprise add-ons. Enter your postcode above or get in touch for an instant, no-obligation quote."
  },
  {
    question: 'Are your cleaners insured and background-checked?',
    answer:
      'Yes. Every cleaner is fully vetted, background-checked, trained and covered by our insurance before they ever visit a property.'
  },
  {
    question: 'Do I need to provide cleaning supplies or equipment?',
    answer:
      "No — we bring everything needed for the job, including eco-friendly products on request. Just let us know if you'd prefer we use your own supplies."
  },
  {
    question: "What if I'm not happy with the clean?",
    answer:
      "Let us know within 24 hours and we'll come back and re-clean the area free of charge — that's our 100% clean guarantee."
  },
  {
    question: 'How do I book, and how far in advance?',
    answer:
      'Booking takes about 60 seconds online, or you can call or message us directly. We offer next-day and weekend slots, so you rarely need to book far ahead.'
  },
  {
    question: 'Can I get a discount for recurring cleaning?',
    answer:
      'Yes — weekly, fortnightly and monthly recurring cleans all come with an automatic discount, and you get the same cleaner each visit whenever possible.'
  },
  {
    question: 'Can I cancel or reschedule a booking?',
    answer:
      'Absolutely — just give us as much notice as you can and we\'ll move your booking to a time that works better for you, free of charge.'
  }
];
