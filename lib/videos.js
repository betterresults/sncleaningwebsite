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
    publisher: { '@type': 'Organization', name: 'SN Cleaning Services', url: SITE_URL }
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

module.exports = { forService, forArea, thumb, buildVideoSchema, section };
