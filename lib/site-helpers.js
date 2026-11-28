function isPlaceholderSocial(url) {
  if (!url || typeof url !== 'string') return true;
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.replace(/^www\./, '').toLowerCase();
    const path = parsed.pathname.replace(/\/+$/, '');
    const genericHosts = ['facebook.com', 'fb.com', 'instagram.com', 'instagr.am'];
    return genericHosts.includes(host) && (!path || path === '');
  } catch {
    return true;
  }
}

function digitsOnly(phone) {
  return String(phone || '').replace(/\D/g, '');
}

function telHref(phone) {
  const digits = digitsOnly(phone);
  return digits ? `tel:+${digits.startsWith('0') ? '44' + digits.slice(1) : digits}` : '#';
}

function whatsappHref(phone) {
  const digits = digitsOnly(phone);
  if (!digits) return '';
  const intl = digits.startsWith('0') ? '44' + digits.slice(1) : digits;
  return `https://wa.me/${intl}`;
}

// A date, a pixel size or a postcode range (2026-11-27, RM8-RM10) is not a compound word.
function isNumericCompound(word) {
  return word.split('-').every((part) => /^\d+$/.test(part) || /^[A-Za-z]{1,2}\d+[A-Za-z]?$/.test(part));
}

// Turn a compound hyphen into spaces. URLs, slugs and code are not passed here.
function splitCompound(word) {
  if (isNumericCompound(word)) return word;
  return word.replace(/-/g, ' ');
}

// Visible sentences. Leaves URLs, paths and HTML tags alone so slugs stay hyphenated.
function visibleCopy(value) {
  const text = String(value || '');
  if (!text) return text;
  if (text.includes('<')) {
    return text.split(/(<[^>]*>)/).map((part) => (part.startsWith('<') ? part : dehyphenText(part))).join('');
  }
  return dehyphenText(text);
}

// Compound words in prose only. Never rewrite:
// - absolute URLs
// - markdown link targets ](...)
// - HTML attributes (href, src, class, and the rest of a tag)
// - any token that touches a / # . or - path character
function dehyphenText(text) {
  return String(text).replace(
    /(https?:\/\/[^\s<"]+)|(\]\([^)]+\))|(\b(?:href|src|srcset|class|id|action)\s*=\s*(?:"[^"]*"|'[^']*'))|(?<![\w/#.-])([A-Za-z0-9]+(?:-[A-Za-z0-9]+)+)(?![\w/-])/gi,
    (match, url, md, attr, word) => (url || md || attr ? match : splitCompound(word))
  );
}

// Visible place names. Slugs and URLs stay hyphenated (southend-on-sea).
function plainPlaceName(name) {
  return visibleCopy(String(name || '')
    .replaceAll('Southend-on-Sea', 'Southend on Sea')
    .replaceAll('Leigh-on-Sea', 'Leigh on Sea'));
}

module.exports = { isPlaceholderSocial, digitsOnly, telHref, whatsappHref, plainPlaceName, visibleCopy, dehyphenText };
