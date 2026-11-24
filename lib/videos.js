// Job videos: pick which videos a page shows and build their VideoObject schema.
// A page shows the section only when at least one video matches.
const { SITE_URL } = require('./site-config');

const norm = (d) => String(d || '').toUpperCase().replace(/\s+/g, '');

function forService(all, serviceSlug) {
  return (all || []).filter((v) => v.service_slug === serviceSlug);
}

// Area pages list their postcode districts in page.postcodes; a video matches
// when it is for the same service and its district is one of them.
function forArea(all, serviceSlug, postcodes) {
  const set = new Set((postcodes || []).map(norm));
  if (!set.size) return [];
  return forService(all, serviceSlug).filter((v) => set.has(norm(v.district)));
}

function thumb(v) {
  return `https://i.ytimg.com/vi/${v.youtube_id}/hqdefault.jpg`;
}

// Google needs a full ISO 8601 date and time with a timezone
// (e.g. 2026-11-03T12:00:00+00:00); a bare date is flagged in Search Console.
function uploadDate(v) {
  const day = String(v.recorded_on || v.created_at || '').slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) return undefined;
  return `${day}T12:00:00+00:00`;
}

function buildVideoSchema(videos) {
  return (videos || []).map((v) => ({
    '@context': 'https://schema.org',
    '@type': 'VideoObject',
    name: v.title,
    description: v.description || v.title,
    thumbnailUrl: thumb(v),
    uploadDate: uploadDate(v),
    embedUrl: `https://www.youtube-nocookie.com/embed/${v.youtube_id}`,
    contentUrl: `https://www.youtube.com/watch?v=${v.youtube_id}`,
    // The full business entity (name, logo, address, phone, sameAs) is on every page under this @id (lib/schema.js).
    publisher: { '@id': `${SITE_URL}/#business` }
  }));
}

// Section data for a page: the newest 3, the total, and the View all link.
function section(videos, serviceSlug, serviceName) {
  return {
    videos: (videos || []).slice(0, 3),
    total: (videos || []).length,
    viewAllUrl: `/videos/${serviceSlug}`,
    serviceName
  };
}

// "Recent cleans in <area>" on area pages (Silvia, 18 Nov 2026): up to 3 published
// job videos filmed in the page's postcode districts or its town, any of the
// services whose photos may be shown publicly (end of tenancy, deep, carpet).
// Videos already shown in the page's own job video section are left out.
const PUBLIC_PHOTO_SERVICES = new Set(['end-of-tenancy-cleaning', 'deep-house-cleaning', 'carpet-cleaning-services']);
const normTown = (t) => String(t || '').toLowerCase().replace(/[^a-z]/g, '');
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

function monthLabel(v) {
  const m = String(v.recorded_on || v.created_at || '').match(/^(\d{4})-(\d{2})/);
  return m ? `${MONTHS[Number(m[2]) - 1]} ${m[1]}` : '';
}

function recentCleans(all, postcodes, town, excludeIds, caseStudies) {
  const set = new Set((postcodes || []).map(norm));
  const t = normTown(town);
  const skip = new Set((excludeIds || []).filter(Boolean));
  const cases = caseStudies || [];
  return (all || [])
    .filter((v) => PUBLIC_PHOTO_SERVICES.has(v.service_slug) && v.youtube_id && !skip.has(v.id))
    .filter((v) => (v.district && set.has(norm(v.district))) || (t && normTown(v.town) === t))
    .slice(0, 3)
    .map((v) => {
      const keys = [norm(v.district), normTown(v.town)].filter(Boolean);
      const cs = cases.find((c) => {
        const hay = `${c.slug || ''} ${c.title || ''}`;
        return keys.some((k) => norm(hay).includes(k) || normTown(hay).includes(k));
      });
      return { ...v, month: monthLabel(v), caseStudyUrl: cs ? `/case-studies/${cs.slug}` : null };
    });
}

module.exports = { forService, forArea, thumb, buildVideoSchema, section, recentCleans, monthLabel };
