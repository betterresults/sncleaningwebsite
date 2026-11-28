// Live content layer, reads published rows from Supabase at build/request time.
// Falls back to empty arrays (never throws) so a Supabase hiccup can't take the
// whole site down; routes below handle empty state gracefully.
const supabase = require('../lib/supabase');
const localBlogPosts = require('./blog-posts');
const videoDurations = require('./video-durations');

function publishedLocalPosts() {
  return localBlogPosts
    .filter((p) => p.published !== false)
    .slice()
    .sort((a, b) => new Date(b.published_at) - new Date(a.published_at));
}

function mergeBlogPosts(remote) {
  const bySlug = new Map();
  publishedLocalPosts().forEach((p) => bySlug.set(p.slug, p));
  (remote || []).forEach((p) => bySlug.set(p.slug, p));
  return Array.from(bySlug.values()).sort(
    (a, b) => new Date(b.published_at || 0) - new Date(a.published_at || 0)
  );
}

// One in-memory copy of each list for a single prerender process. A new build
// is a new process, so it always reads Supabase again at the start. Nothing is
// written to disk. npm start and Netlify Functions leave PRERENDER unset and
// stay live; NETLIFY=true alone must not turn this on (functions set that).
let contentCacheFetches = 0;

function memo(fn) {
  let stored = false;
  let value;
  let pending = null;
  return function memoized() {
    if (process.env.PRERENDER !== '1') return fn();
    if (stored) return Promise.resolve(value);
    if (!pending) {
      contentCacheFetches += 1;
      pending = Promise.resolve()
        .then(fn)
        .then((result) => {
          value = result;
          stored = true;
          return result;
        })
        .finally(() => {
          pending = null;
        });
    }
    return pending;
  };
}

function contentCacheFetchCount() {
  return contentCacheFetches;
}

const getServices = memo(async function getServices() {
  const { data, error } = await supabase
    .from('services')
    .select('*')
    .eq('published', true)
    .order('sort_order', { ascending: true });

  if (error) {
    console.error('Error fetching services:', error.message);
    return [];
  }
  return data || [];
});

const getServicePages = memo(async function getServicePages() {
  const { data, error } = await supabase
    .from('service_pages')
    .select('*, services(*)')
    .eq('published', true);

  if (error) {
    console.error('Error fetching service pages:', error.message);
    return [];
  }
  return data || [];
});

async function getServicePageBySlug(slug) {
  const pages = await getServicePages();
  return pages.find((p) => p.slug === slug) || null;
}

const getBlogPosts = memo(async function getBlogPosts() {
  const { data, error } = await supabase
    .from('blog_posts')
    .select('*')
    .eq('published', true)
    .order('published_at', { ascending: false });

  if (error) {
    console.error('Error fetching blog posts:', error.message);
    return publishedLocalPosts();
  }
  return mergeBlogPosts(data);
});

async function getBlogPostBySlug(slug) {
  const posts = await getBlogPosts();
  return posts.find((p) => p.slug === slug) || publishedLocalPosts().find((p) => p.slug === slug) || null;
}

// Sitewide business info (name, phone, address, hours, socials), a single
// editable row instead of hardcoded values in server.js. Falls back to null
// (never throws) so a Supabase hiccup can't take the whole site down; the
// caller in server.js has hardcoded defaults for that case.
const getSiteSettings = memo(async function getSiteSettings() {
  const { data, error } = await supabase.from('site_settings').select('*').maybeSingle();

  if (error) {
    console.error('Error fetching site settings:', error.message);
    return null;
  }
  return data;
});

// The flat "Areas We Cover" list, London boroughs and Essex districts
// (level = 'borough'; these are also the shapes on the coverage map). Specific local areas nested under one of these (e.g.
// Shenfield under Essex - Brentwood) are surfaced separately by
// getFeaturedAreaGroups() below instead of duplicated in this list.
const getCoverageAreas = memo(async function getCoverageAreas() {
  const { data, error } = await supabase
    .from('coverage_regions')
    .select('name')
    .eq('is_active', true)
    .eq('level', 'borough')
    .order('display_order', { ascending: true });

  if (error) {
    console.error('Error fetching coverage areas:', error.message);
    return [];
  }
  return (data || []).map((r) => r.name);
});

// Every coverage region including sub-areas, used internally to resolve a
// sub-area's parent borough name (id, name, parent_id only, not the display list).
const getAllCoverageRegions = memo(async function getAllCoverageRegions() {
  const { data, error } = await supabase.from('coverage_regions').select('id, name, display_name, parent_id, level');

  if (error) {
    console.error('Error fetching coverage regions:', error.message);
    return [];
  }
  return data || [];
});

// Every published area page belongs to exactly one service (area_pages.service_id)
// and one region (area_pages.region_id), this is what lets each service build
// its own set of borough/area pages (/end-of-tenancy-cleaning/camden/,
// /airbnb-cleaning/hillingdon/, ...) instead of one generic area page shared
// across every service.
const getAreaPages = memo(async function getAreaPages() {
  const { data, error } = await supabase
    .from('area_pages')
    .select('*, coverage_regions(id, name, display_name, parent_id, level), services(id, title, slug, icon, short_description)')
    .eq('published', true);

  if (error) {
    console.error('Error fetching area pages:', error.message);
    return [];
  }
  return data || [];
});

// Looks up one area page by its service AND area slug together, e.g.
// serviceSlug="end-of-tenancy-cleaning", areaSlug="camden" for
// /end-of-tenancy-cleaning/camden/. Both must match the same row.
// Published rows only, which getAreaPages already returns.
async function getAreaPageBySlug(serviceSlug, areaSlug) {
  const pages = await getAreaPages();
  return pages.find((ap) => ap.slug === areaSlug && ap.services && ap.services.slug === serviceSlug) || null;
}

// All published area pages for one service (used on that service's detail
// page to link out to its own area/borough pages).
async function getAreaPagesForService(serviceSlug) {
  const areaPages = await getAreaPages();
  return areaPages.filter((ap) => ap.services && ap.services.slug === serviceSlug);
}

// Powers the homepage's "Local Area Guides" section: every published area
// page, grouped under its parent borough's name. Add a new area_pages row
// with published = true (with a service_id set) and it appears here
// automatically on the next request/build, nothing else to wire up. A
// borough can list more than one service if it has more than one area page.
async function getFeaturedAreaGroups() {
  const [areaPages, regions] = await Promise.all([getAreaPages(), getAllCoverageRegions()]);
  const regionById = new Map(regions.map((r) => [r.id, r]));

  const groups = new Map(); // parent name -> [{ name, slug, serviceSlug, serviceTitle, url }]
  areaPages.forEach((ap) => {
    const region = ap.coverage_regions;
    const service = ap.services;
    if (!region || !service) return;
    const parent = region.parent_id ? regionById.get(region.parent_id) : null;
    const parentName = parent ? parent.name : region.name;

    if (!groups.has(parentName)) groups.set(parentName, []);
    groups.get(parentName).push({
      name: region.name,
      slug: ap.slug,
      serviceSlug: service.slug,
      serviceTitle: service.title,
      url: `/${service.slug}/${ap.slug}`
    });
  });

  return Array.from(groups, ([parentName, areas]) => ({ parentName, areas }));
}


// Before and after job videos (YouTube). Rows: public.job_videos (see docs/VIDEOS.md).
const getJobVideos = memo(async function getJobVideos() {
  const { data, error } = await supabase
    .from('job_videos')
    .select('*')
    .eq('published', true)
    .order('recorded_on', { ascending: false, nullsFirst: false })
    .order('created_at', { ascending: false });
  if (error) {
    console.error('Error fetching job videos:', error.message);
    return [];
  }
  return (data || []).map((v) => (
    v && v.youtube_id && videoDurations[v.youtube_id] && !v.duration
      ? { ...v, duration: videoDurations[v.youtube_id] }
      : v
  ));
});

// Questions answered on the website. Rows: public.faq_answers (published only).
const getFaqAnswers = memo(async function getFaqAnswers() {
  const { data, error } = await supabase
    .from('faq_answers')
    .select('*')
    .eq('published', true)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: false });
  if (error) {
    console.error('Error fetching questions:', error.message);
    return [];
  }
  return data || [];
});

module.exports = {
  contentCacheFetchCount,
  getFaqAnswers,
  getJobVideos,
  getServices,
  getServicePages,
  getServicePageBySlug,
  getBlogPosts,
  getBlogPostBySlug,
  getCoverageAreas,
  getAllCoverageRegions,
  getAreaPages,
  getAreaPageBySlug,
  getAreaPagesForService,
  getFeaturedAreaGroups,
  getSiteSettings
};
