// The deep cleaning service FAQ in the CMS lists the oven with the deep clean.
// Oven cleaning is an optional add on chosen at booking, the same rule as the
// deep cleaning intro. The daily CMS rewrite can put the old sentence back,
// so the visible answer and the FAQPage schema are corrected here.
function fixAnswer(answer) {
  if (typeof answer !== 'string' || !/ovens,\s*grout,\s*skirting boards/i.test(answer)) return answer;
  const next = answer.replace(
    /ovens,\s*grout,\s*skirting boards,\s*behind furniture,/i,
    'grout, skirting boards and behind furniture,'
  );
  if (/optional add on chosen at booking/i.test(next)) return next;
  return next.replace(
    /longer\./,
    'longer. Oven cleaning is an optional add on chosen at booking, not part of the from price.'
  );
}

function fixDeepOvenFaqs(faqs) {
  return (faqs || []).map((faq) => {
    if (!faq || typeof faq.answer !== 'string' || faq.answer === fixAnswer(faq.answer)) return faq;
    return { ...faq, answer: fixAnswer(faq.answer) };
  });
}

module.exports = { fixAnswer, fixDeepOvenFaqs };
