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

module.exports = { isPlaceholderSocial, digitsOnly, telHref, whatsappHref };
