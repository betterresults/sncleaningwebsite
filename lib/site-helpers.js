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

// Where a "get a quote" button should go.
//
//   - a service with a booking form  -> that service's booking page
//   - a service without one          -> the contact form, pre-tagged
//   - no service in hand             -> /book, the chooser
//
// Every template uses this rather than hardcoding a path, so wiring a new
// booking form up is a data change and nothing else.
function bookHref(service) {
  if (!service) return '/book';
  if (service.booking_url) return service.booking_url;
  if (service.slug) return `/contact?service=${encodeURIComponent(service.slug)}`;
  return '/book';
}

module.exports = { isPlaceholderSocial, digitsOnly, telHref, whatsappHref, bookHref };
