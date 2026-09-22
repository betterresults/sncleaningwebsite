// Live content layer — reads published rows from Supabase at build/request time.
// Falls back to empty arrays (never throws) so a Supabase hiccup can't take the
// whole site down; routes below handle empty state gracefully.
const supabase = require('../lib/supabase');
const localBlogPosts = require('./blog-posts');

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

async function getServices() {
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
}

async function getServicePages() {
  const { data, error } = await supabase
    .from('service_pages')
    .select('*, services(*)')
    .eq('published', true);

  if (error) {
    console.error('Error fetching service pages:', error.message);
    return [];
  }
  return data || [];
}

async function getServicePageBySlug(slug) {
  const { data, error } = await supabase
    .from('service_pages')
    .select('*, services(*)')
    .eq('slug', slug)
    .eq('published', true)
    .maybeSingle();

  if (error) {
    console.error('Error fetching service page:', error.message);
    return null;
  }
  return data;
}

async function getBlogPosts() {
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
}

async function getBlogPostBySlug(slug) {
  const { data, error } = await supabase
    .from('blog_posts')
    .select('*')
    .eq('slug', slug)
    .eq('published', true)
    .maybeSingle();

  if (error) {
    console.error('Error fetching blog post:', error.message);
  }
  if (data) return data;
  return publishedLocalPosts().find((p) => p.slug === slug) || null;
}

// Sitewide business info (name, phone, address, hours, socials) — a single
// editable row instead of hardcoded values in server.js. Falls back to null
// (never throws) so a Supabase hiccup can't take the whole site down; the
// caller in server.js has hardcoded defaults for that case.
async function getSiteSettings() {
  const { data, error } = await supabase.from('site_settings').select('*').maybeSingle();

  if (error) {
    console.error('Error fetching site settings:', error.message);
    return null;
  }
  return data;
}

// The flat "Areas We Cover" tag list — top-level boroughs/towns only
// (parent_id is null). Specific local areas nested under one of these (e.g.
// Shenfield under Essex - Brentwood) are surfaced separately by
// getFeaturedAreaGroups() below instead of duplicated in this list.
async function getCoverageAreas() {
  const { data, error } = await supabase
    .from('coverage_regions')
    .select('name')
    .eq('is_active', true)
    .is('parent_id', null)
    .order('display_order', { ascending: true });

  if (error) {
    console.error('Error fetching coverage areas:', error.message);
    return [];
  }
  return (data || []).map((r) => r.name);
}

// Every coverage region including sub-areas, used internally to resolve a
// sub-area's parent borough name (id, name, parent_id only — not the display list).
async function getAllCoverageRegions() {
  const { data, error } = await supabase.from('coverage_regions').select('id, name, display_name, parent_id');

  if (error) {
    console.error('Error fetching coverage regions:', error.message);
    return [];
  }
  return data || [];
}

// Every published area page belongs to exactly one service (area_pages.service_id)
// and one region (area_pages.region_id) — this is what lets each service build
// its own set of borough/area pages (/end-of-tenancy-cleaning/camden/,
// /airbnb-cleaning/hillingdon/, ...) instead of one generic area page shared
// across every service.
async function getAreaPages() {
  const { data, error } = await supabase
    .from('area_pages')
    .select('*, coverage_regions(id, name, display_name, parent_id), services(id, title, slug, icon, short_description, coverage_postcode_areas)')
    .eq('published', true);

  if (error) {
    console.error('Error fetching area pages:', error.message);
    return [];
  }
  return data || [];
}

// Looks up one area page by its service AND area slug together — e.g.
// serviceSlug="end-of-tenancy-cleaning", areaSlug="camden" for
// /end-of-tenancy-cleaning/camden/. Both must match the same row.
async function getAreaPageBySlug(serviceSlug, areaSlug) {
  const { data, error } = await supabase
    .from('area_pages')
    .select('*, coverage_regions(id, name, display_name, parent_id), services!inner(id, title, slug, icon, short_description, coverage_postcode_areas)')
    .eq('slug', areaSlug)
    .eq('services.slug', serviceSlug)
    .eq('published', true)
    .maybeSingle();

  if (error) {
    console.error('Error fetching area page:', error.message);
    return null;
  }
  return data;
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
// automatically on the next request/build — nothing else to wire up. A
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

module.exports = {
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
