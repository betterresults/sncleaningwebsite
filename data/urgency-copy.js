// Shared availability wording (Silvi, 28 Nov 2026). The strings are used on the
// announcement bar, service and area heroes, the quote card, and the two FAQs.
// End of tenancy is the only service with the £50 same day or Sunday extra.
const LINE = 'We clean at weekends, can start early morning or late afternoon, and can do urgent cleans within 24 hours or same day.';
const EOT_PRICE = 'Same day or Sunday is £50 extra. Saturdays and weekdays are the normal price.';
const CLOSE = 'Get in touch or book online and we will tell you what we can do for your dates.';

const WEEKEND_Q = 'Can you clean this weekend?';
const WEEKEND_A = 'Yes. We have weekend availability, and we can start early morning or late afternoon. ' + CLOSE;
const SAME_Q = 'Do you do same day cleans?';
const SAME_A = 'Yes. We can do urgent cleans within 24 hours, or even same day, when we have a team free. ' + CLOSE;
const SAME_EOT_A = 'Yes. We can do urgent cleans within 24 hours, or even same day, when we have a team free. ' + EOT_PRICE + ' ' + CLOSE;
const AIRBNB_EXTRA = ' Same day check out to check in turnovers are also available.';

function faqsFor(slug) {
  let same = slug === 'end-of-tenancy-cleaning' ? SAME_EOT_A : SAME_A;
  if (slug === 'airbnb-cleaning') same += AIRBNB_EXTRA;
  return [
    { question: WEEKEND_Q, answer: WEEKEND_A },
    { question: SAME_Q, answer: same }
  ];
}

// A question that asks whether we can come at the weekend or do a same day
// booking. Combining another service on the same visit, or a mattress being
// dry the same day, is a different question and stays.
function isAvailabilityQuestion(question) {
  const q = String(question || '').toLowerCase().replace(/\s+/g, ' ').trim();
  return [
    /can you clean this weekend/,
    /do you do same day cleans/,
    /same day or weekend/,
    /weekend or same day/,
    /weekend or at short notice/,
    /short notice or at the weekend/,
    / at the weekend\??$/,
    /^can you clean at weekends/,
    /^do you clean at weekends/,
    /same day turnover/,
    /weekend changeover/,
    /weekend turnover/,
    /same day changeover/,
    /work weekends/,
    /same day as check out/,
    /same day a guest checks out/,
    /check out and check in/,
    /book a same day/,
    /same day carpet cleaning/,
    /on the same day i move out/,
    /the same day we move out/,
    /the same day or at the weekend/,
    /at the weekend or on the same day/,
    /weekend end of tenancy/,
    /between two guests on the same day/
  ].some((re) => re.test(q));
}

function mergeFaqs(existing, slug) {
  const kept = (existing || []).filter((faq) => faq && !isAvailabilityQuestion(faq.question || faq.q));
  const have = new Set(kept.map((faq) => String(faq.question || faq.q || '').toLowerCase()));
  const add = faqsFor(slug).filter((faq) => !have.has(faq.question.toLowerCase()));
  return kept.concat(add);
}

module.exports = { LINE, EOT_PRICE, CLOSE, faqsFor, isAvailabilityQuestion, mergeFaqs };
