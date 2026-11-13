// Contact and customer support facts (Silvia, 13 Nov 2026). Used on /contact/ and in the
// short re clean promise on end of tenancy pages. Change hours or promises here only.
// Live tracking of the cleaner is planned but NOT live: do not mention it until Silvia says so.

const channels = [
  {
    id: 'book-online',
    name: 'Book online',
    when: 'Any time, day or night',
    what: 'Every service has its own online booking form. It is the same form our office team uses when you phone us for a quote, so booking online gets you exactly the same price and service. You see the price before you book and get a confirmation email straight away.'
  },
  {
    id: 'account',
    name: 'Your customer account',
    when: 'Any time',
    what: 'Your account is created automatically with your first booking, and the login details are in your confirmation email. It runs on Dilvon, our booking and management platform. In a few clicks you can see and manage your bookings, send us a message and make a request, such as a change of date or a re clean.'
  },
  {
    id: 'whatsapp',
    name: 'WhatsApp and website chat',
    when: 'Monday to Friday 7am to 10pm, Saturday and Sunday 8am to 5pm',
    what: 'Ask for a quote, send photos of the property, change something on the day, tell us a cleaner is late or report anything after a clean. There is always someone from our team on the chat during these hours.'
  },
  {
    id: 'email',
    name: 'Email and messages in your account',
    when: 'Monday to Friday 9am to 5pm',
    what: 'Answered within 1 hour, usually in 15 to 20 minutes. Messages sent in the evening or at the weekend are answered the next working morning. For anything urgent outside these hours, use WhatsApp.'
  },
  {
    id: 'phone',
    name: 'Phone',
    when: 'Our team: Monday to Friday 9am to 5pm. AI phone assistant: 24 hours a day',
    what: 'Our team handles quotes, new bookings and existing bookings. Outside office hours your call is answered by our AI phone assistant, which can give you prices, check availability and see your bookings and messages.'
  }
];

const steps = [
  {
    title: 'On the day',
    text: 'We send you a message when your cleaner is on the way. If they are running late, or access to the property changes, message us on WhatsApp or in your account and we sort it out with the team.'
  },
  {
    title: 'After the clean',
    text: 'If anything we cleaned is not right, tell us through your account or on WhatsApp, ideally with a photo of the area. We aim to come back within 1 to 2 working days. A re clean always goes to the front of the queue, so in most cases we are back within 24 hours, but we never promise next day when we cannot be sure.'
  },
  {
    title: 'How long you have to tell us',
    text: '7 days for an empty property: end of tenancy cleaning, and after builders cleaning when nobody lives there. Letting agents and inventory clerks often need more than 72 hours to visit and write their report, so a 72 hour window can run out before you even know about a problem. 24 hours for homes people live in, because after that a missed spot cannot be told apart from everyday use. The re clean is free, with no extra fee.'
  }
];

const faqs = [
  {
    question: 'What are your customer support hours?',
    answer: 'WhatsApp and website chat: Monday to Friday 7am to 10pm, Saturday and Sunday 8am to 5pm. Email, messages in your account and our phone team: Monday to Friday 9am to 5pm. Our AI phone assistant answers calls 24 hours a day, and you can book online at any time.'
  },
  {
    question: 'How quickly do you reply to emails?',
    answer: 'Within 1 hour during office hours (Monday to Friday 9am to 5pm), usually in 15 to 20 minutes. Emails sent outside those hours are answered the next working morning.'
  },
  {
    question: 'Can I book a clean without speaking to anyone?',
    answer: 'Yes. Every service has an online booking form that shows your price before you book. It is the same form our office uses for phone bookings. Your customer account is created automatically and the details arrive by email.'
  },
  {
    question: 'What if something is missed after an end of tenancy clean?',
    answer: 'Tell us within 7 days through your account or on WhatsApp, with a photo or the agent\'s report if you have it. We aim to come back within 1 to 2 working days, often within 24 hours, and clean it again free of charge.'
  },
  {
    question: 'Who answers the phone outside office hours?',
    answer: 'Our AI phone assistant. It answers 24 hours a day and can give you prices, check availability and see your bookings and messages.'
  }
];

module.exports = { channels, steps, faqs };
