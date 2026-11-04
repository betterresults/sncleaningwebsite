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

function buildVideoSchema(videos) {
  return (videos || []).map((v) => ({
    '@context': 'https://schema.org',
    '@type': 'VideoObject',
    name: v.title,
    description: v.description || v.title,
    thumbnailUrl: thumb(v),
    uploadDate: (v.recorded_on || String(v.created_at || '').slice(0, 10)) || undefined,
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
