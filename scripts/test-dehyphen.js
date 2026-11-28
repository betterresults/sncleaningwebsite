// Unit checks for visible dehyphenation. Link targets, attributes and paths stay hyphenated.
const assert = require('assert');
const { dehyphenText, visibleCopy, plainPlaceName } = require('../lib/site-helpers');
const { linkifyInternal } = require('../lib/linkify-internal');

function same(actual, expected, label) {
  assert.strictEqual(actual, expected, label + '\n  actual:   ' + actual + '\n  expected: ' + expected);
}

const markdown = 'Use the [house cleaning time calculator](/house-cleaning-time-calculator/) and our [room-by-room checklist](/end-of-tenancy-cleaning-checklist/).';
const markdownOut = dehyphenText(markdown);
same(
  markdownOut,
  'Use the [house cleaning time calculator](/house-cleaning-time-calculator/) and our [room by room checklist](/end-of-tenancy-cleaning-checklist/).',
  'markdown link targets stay hyphenated; the label is prose'
);
assert.ok(!markdownOut.includes('](/house-cleaning time'), 'markdown target gained a space');
assert.ok(markdownOut.includes('](/end-of-tenancy-cleaning-checklist/)'), 'checklist target was rewritten');

const html = '<a href="/deep-house-cleaning/kelvedon-hatch/" class="h-hero-bg" src="/images/end-of-tenancy-cleaning.jpg">A same-day check-in and a DBS-checked team.</a>';
const htmlOut = visibleCopy(html);
same(
  htmlOut,
  '<a href="/deep-house-cleaning/kelvedon-hatch/" class="h-hero-bg" src="/images/end-of-tenancy-cleaning.jpg">A same day check in and a DBS checked team.</a>',
  'inline HTML links keep href, src and class; only the text node changes'
);
assert.ok(!/href="[^"]*\s/.test(htmlOut), 'href contains a space');
const rawHtml = dehyphenText(html);
assert.ok(rawHtml.includes('href="/deep-house-cleaning/kelvedon-hatch/"'), 'dehyphenText left the href path');
assert.ok(rawHtml.includes('class="h-hero-bg"'), 'dehyphenText left the class');
assert.ok(rawHtml.includes('check in'), 'dehyphenText still rewrote the text node');

const prose = dehyphenText('End-of-tenancy, after-builders, one-off, add-on, short-let, 24-hour re-clean and a move-out.');
same(
  prose,
  'End of tenancy, after builders, one off, add on, short let, 24 hour re clean and a move out.',
  'ordinary compound hyphens in prose become spaces'
);

same(dehyphenText('See /domestic-cleaning/upminster/ today.'), 'See /domestic-cleaning/upminster/ today.', 'a path is not a compound word');
same(dehyphenText('Postcodes RM8-RM10 and the date 2026-11-27 stay.'), 'Postcodes RM8-RM10 and the date 2026-11-27 stay.', 'postcode ranges and dates stay');
same(
  dehyphenText('Read https://sncleaningservices.co.uk/end-of-tenancy-cleaning/ now.'),
  'Read https://sncleaningservices.co.uk/end-of-tenancy-cleaning/ now.',
  'absolute URLs stay'
);

const throughPage = plainPlaceName('Work through our [room-by-room list](/house-cleaning-time-calculator/) before the check-out.');
const linked = linkifyInternal(throughPage);
assert.ok(linked.includes('href="/house-cleaning-time-calculator/"'), 'rendered link target is intact');
assert.ok(!linked.includes('](/'), 'markdown was left raw');
assert.ok(!/href="[^"]*\s/.test(linked), 'rendered href contains a space');
assert.ok(linked.includes('room by room'), 'link label was dehyphened');
assert.ok(linked.includes('check out'), 'prose after the link was dehyphened');

console.log('dehyphen tests passed');
