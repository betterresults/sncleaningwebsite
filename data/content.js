// Live content layer — reads published rows from Supabase at build/request time.
// Falls back to empty arrays (never throws) so a Supabase hiccup can't take the
// whole site down; routes below handle empty state gracefully.
const supabase = require('../lib/supabase');

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
    return [];
  }
  return data || [];
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
    return null;
  }
  return data;
}

async function getCoverageAreas() {
  const { data, error } = await supabase
    .from('coverage_regions')
    .select('name')
    .eq('is_active', true)
    .order('display_order', { ascending: true });

  if (error) {
    console.error('Error fetching coverage areas:', error.message);
    return [];
  }
  return (data || []).map((r) => r.name);
}

module.exports = {
  getServices,
  getServicePages,
  getServicePageBySlug,
  getBlogPosts,
  getBlogPostBySlug,
  getCoverageAreas
};
