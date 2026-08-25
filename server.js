require('dotenv').config();
const express = require('express');
const expressLayouts = require('express-ejs-layouts');
const bodyParser = require('body-parser');
const path = require('path');
const nodemailer = require('nodemailer');

const { SITE_URL } = require('./lib/site-config');
const schema = require('./lib/schema');

const app = express();
const PORT = process.env.PORT || 3000;

// One value per build/process start, appended to CSS/JS URLs as ?v=... so browsers
// never serve a stale cached copy after a deploy — required because netlify.toml
// caches /css/* and /js/* for a full year as "immutable" (safe for performance,
// but only if the URL itself changes whenever the file's contents change).
const ASSET_VERSION = Date.now().toString(36);
app.locals.assetVersion = ASSET_VERSION;

// ---------- View engine ----------
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(expressLayouts);
app.set('layout', 'layouts/main');

// ---------- Middleware ----------
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// Hardcoded fallback used only if site_settings has no row yet or Supabase is
// unreachable — keeps the site working, never blank, while staying editable
// from Supabase the rest of the time.
const SITE_DEFAULTS = {
  name: 'SN Cleaning Services',
  phone: '020 3835 5033',
  email: 'info@sncleaningservices.co.uk',
  address: 'Serving London & Essex',
  hours: 'Phone: Mon - Sat, 8am - 5pm · WhatsApp: Mon - Sun, 8am - 9pm',
  social: {
    facebook: 'https://facebook.com',
    instagram: 'https://instagram.com'
  },
  googleBusinessUrl: null,
  logoUrl: '/images/logo.png',
  defaultOgImage: null
};

// ---------- Data ----------
const content = require('./data/content'); // live content from Supabase (services, service pages, blog, site settings)
const testimonials = require('./data/testimonials');
const checklist = require('./data/checklist');
const faqs = require('./data/faqs');

// Runs on every request. Sets up everything every page needs regardless of
// route: current path, canonical URL, the nav dropdown's service list, sitewide
// business info (from Supabase's site_settings), real coverage areas (for
// LocalBusiness schema on every page), and sensible defaults for breadcrumbs,
// social-share image and structured data that routes can override below.
app.use(async (req, res, next) => {
  res.locals.currentPath = req.path;
  res.locals.canonicalUrl = `${SITE_URL}${req.path}`;
  res.locals.noindex = false;

  try {
    const [services, servicePages, settings, coverageAreas] = await Promise.all([
      content.getServices(),
      content.getServicePages(),
      content.getSiteSettings(),
      content.getCoverageAreas()
    ]);
    const detailSlugs = new Set(servicePages.map((p) => p.slug));
    res.locals.navServices = services.map((s) => ({
      ...s,
      hasDetailPage: detailSlugs.has(s.slug)
    }));

    res.locals.site = settings
      ? {
          name: settings.business_name || SITE_DEFAULTS.name,
          phone: settings.phone || SITE_DEFAULTS.phone,
          email: settings.email || SITE_DEFAULTS.email,
          address: settings.address_area || SITE_DEFAULTS.address,
          hours: settings.hours_note || SITE_DEFAULTS.hours,
          social: {
            facebook: settings.facebook_url || SITE_DEFAULTS.social.facebook,
            instagram: settings.instagram_url || SITE_DEFAULTS.social.instagram
          },
          googleBusinessUrl: settings.google_business_url || null,
          logoUrl: settings.logo_url || SITE_DEFAULTS.logoUrl,
          defaultOgImage: settings.default_og_image || null
        }
      : SITE_DEFAULTS;

    res.locals.coverageAreas = coverageAreas || [];
    res.locals.ogImage = schema.absoluteUrl(res.locals.site.defaultOgImage || res.locals.site.logoUrl);
    res.locals.breadcrumbs = [{ name: 'Home', url: '/' }];
    res.locals.structuredData = [schema.buildLocalBusiness({ site: res.locals.site, coverageAreas: res.locals.coverageAreas })];

    next();
  } catch (err) {
    console.error('Error loading nav services / site settings:', err);
    res.locals.navServices = [];
    res.locals.site = SITE_DEFAULTS;
    res.locals.coverageAreas = [];
    res.locals.ogImage = schema.absoluteUrl(SITE_DEFAULTS.logoUrl);
    res.locals.breadcrumbs = [{ name: 'Home', url: '/' }];
    res.locals.structuredData = [];
    next();
  }
});

// ---------- Routes ----------
app.get('/', async (req, res) => {
  const [services, featuredAreaGroups] = await Promise.all([content.getServices(), content.getFeaturedAreaGroups()]);
  const faqPage = schema.buildFaqPage(faqs);

  res.render('index', {
    title: 'Professional Cleaning Services in London & Essex',
    metaDescription:
      'Flat-rate home and office cleaning across London & Essex — vetted, insured cleaners, a 100% clean guarantee, and an instant quote in 60 seconds.',
    services: services.slice(0, 6),
    testimonials,
    checklist,
    faqs,
    coverageAreas: res.locals.coverageAreas,
    featuredAreaGroups,
    structuredData: [...res.locals.structuredData, ...(faqPage ? [faqPage] : [])]
  });
});

// Services index — lives at /our-services/ (not /services/) to match the
// exact URL already indexed on sncleaningservices.co.uk, so this build can
// take over that URL with no redirect needed once the domain moves.
app.get('/our-services', async (req, res) => {
  const [services, servicePages] = await Promise.all([content.getServices(), content.getServicePages()]);
  const detailSlugs = new Set(servicePages.map((p) => p.slug));
  const breadcrumbs = [...res.locals.breadcrumbs, { name: 'Services', url: '/our-services' }];

  res.render('services', {
    title: 'Cleaning Services We Offer',
    metaDescription:
      'Residential, end of tenancy, Airbnb, deep cleaning, after builders, carpet, upholstery, mattress and office cleaning — flat-rate pricing across London & Essex.',
    services: services.map((s) => ({ ...s, hasDetailPage: detailSlugs.has(s.slug) })),
    checklist,
    breadcrumbs,
    structuredData: [...res.locals.structuredData, schema.buildBreadcrumbList(breadcrumbs)]
  });
});

app.get('/blog', async (req, res) => {
  const posts = await content.getBlogPosts();
  const breadcrumbs = [...res.locals.breadcrumbs, { name: 'Blog', url: '/blog' }];

  res.render('blog/index', {
    title: 'Cleaning Tips & Advice Blog',
    metaDescription: 'Practical cleaning tips, guides and news from the SN Cleaning Services team.',
    posts,
    breadcrumbs,
    structuredData: [...res.locals.structuredData, schema.buildBreadcrumbList(breadcrumbs)]
  });
});

app.get('/blog/:slug', async (req, res, next) => {
  const post = await content.getBlogPostBySlug(req.params.slug);
  if (!post) return next();

  const breadcrumbs = [...res.locals.breadcrumbs, { name: 'Blog', url: '/blog' }, { name: post.title, url: `/blog/${post.slug}` }];

  res.render('blog/post', {
    title: post.meta_title || post.title,
    metaDescription: post.meta_description || post.excerpt,
    post,
    breadcrumbs,
    ogImage: post.cover_image ? schema.absoluteUrl(post.cover_image) : res.locals.ogImage,
    structuredData: [
      ...res.locals.structuredData,
      schema.buildBreadcrumbList(breadcrumbs),
      schema.buildArticle({ post, site: res.locals.site })
    ]
  });
});

app.get('/about', (req, res) => {
  const breadcrumbs = [...res.locals.breadcrumbs, { name: 'About', url: '/about' }];
  res.render('about', {
    title: 'About Us',
    metaDescription:
      'Meet the team behind SN Cleaning Services — a fully insured, vetted cleaning company serving London & Essex homes and businesses.',
    breadcrumbs,
    structuredData: [...res.locals.structuredData, schema.buildBreadcrumbList(breadcrumbs)]
  });
});

app.get('/gallery', (req, res) => {
  const breadcrumbs = [...res.locals.breadcrumbs, { name: 'Gallery', url: '/gallery' }];
  res.render('gallery', {
    title: 'Our Work',
    metaDescription: 'A look at the standard of work from SN Cleaning Services, serving London & Essex with professional home and office cleaning.',
    breadcrumbs,
    structuredData: [...res.locals.structuredData, schema.buildBreadcrumbList(breadcrumbs)]
  });
});

app.get('/contact', (req, res) => {
  const breadcrumbs = [...res.locals.breadcrumbs, { name: 'Contact', url: '/contact' }];
  res.render('contact', {
    title: 'Contact Us & Get a Free Quote',
    metaDescription:
      'Get in touch with SN Cleaning Services for a free, no-obligation cleaning quote. Call, message, or book online — most enquiries answered within 24 hours.',
    success: false,
    error: null,
    breadcrumbs,
    structuredData: [...res.locals.structuredData, schema.buildBreadcrumbList(breadcrumbs)]
  });
});

app.get('/contact/success', (req, res) => {
  res.render('thank-you', {
    title: 'Thank You',
    noindex: true,
    structuredData: []
  });
});

// This route is only used for local Node/traditional hosting. On Netlify, form
// submissions are intercepted and handled entirely by Netlify Forms (no server needed) —
// see the "contact" form's data-netlify attribute in views/contact.ejs.
app.post('/contact', async (req, res) => {
  const { name, email, phone, service, message } = req.body;

  if (!name || !email || !message) {
    return res.status(400).render('contact', {
      title: 'Contact Us',
      success: false,
      error: 'Please fill in your name, email and message before sending.'
    });
  }

  try {
    // Email sending is optional - only runs if SMTP settings are provided in .env
    if (process.env.SMTP_HOST) {
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT || 587,
        secure: false,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS
        }
      });

      await transporter.sendMail({
        from: `"${name}" <${process.env.SMTP_USER}>`,
        to: process.env.CONTACT_TO || process.env.SMTP_USER,
        replyTo: email,
        subject: `New enquiry from ${name} (${service || 'General'})`,
        text: `Name: ${name}\nEmail: ${email}\nPhone: ${phone || 'N/A'}\nService: ${service || 'N/A'}\n\nMessage:\n${message}`
      });
    } else {
      console.log('New contact form submission (SMTP not configured, logging only):', {
        name, email, phone, service, message
      });
    }

    res.render('contact', {
      title: 'Contact Us',
      success: true,
      error: null
    });
  } catch (err) {
    console.error('Error sending contact email:', err);
    res.status(500).render('contact', {
      title: 'Contact Us',
      success: false,
      error: 'Something went wrong sending your message. Please try again or call us directly.'
    });
  }
});

// Individual service page — one shared template, content pulled from Supabase.
// Lives at site root (/{slug}/, e.g. /office-cleaning/, /domestic-cleaning/)
// rather than under /services/, matching the real indexed URLs on
// sncleaningservices.co.uk exactly, so this build can take over those pages
// with no redirect needed once the domain moves.
//
// Registered after every fixed route above (/blog, /about, /gallery,
// /contact, etc.) so those always match first; a non-matching slug calls
// next() and falls through to the area route below, then to 404.
app.get('/:slug', async (req, res, next) => {
  const page = await content.getServicePageBySlug(req.params.slug);
  if (!page) return next(); // not a real service slug — falls through to the area route, then 404

  const allServices = await content.getServices();
  const relatedServices = allServices.filter((s) => s.slug !== page.slug).slice(0, 3);
  const service = page.services;
  const coverageAreas = res.locals.coverageAreas;

  const breadcrumbs = [
    ...res.locals.breadcrumbs,
    { name: 'Services', url: '/our-services' },
    { name: service.title, url: `/${page.slug}` }
  ];
  const faqPage = schema.buildFaqPage(page.faqs);

  res.render('service-detail', {
    title: page.meta_title || service.title,
    metaDescription: page.meta_description || service.short_description,
    page,
    service,
    relatedServices,
    testimonials,
    coverageAreas,
    breadcrumbs,
    ogImage: page.images && page.images.length ? schema.absoluteUrl(page.images[0]) : res.locals.ogImage,
    structuredData: [
      ...res.locals.structuredData,
      schema.buildBreadcrumbList(breadcrumbs),
      schema.buildService({ service, page, coverageAreas }),
      ...(faqPage ? [faqPage] : [])
    ]
  });
});

// Per-service area/borough landing page — e.g. /end-of-tenancy-cleaning/camden/,
// /airbnb-cleaning/hillingdon/. This matches the exact URL shape already live
// and indexed on sncleaningservices.co.uk (service slug, then area slug, both
// at the site root — no /services or /areas prefix) so this build can take
// over those URLs directly with no redirects needed once it goes live.
//
// Registered LAST, right before the 404 handler, so every more specific route
// above (/:slug, /blog/:slug, /contact, etc.) always matches first —
// otherwise this catch-all two-segment route would shadow them.
app.get('/:serviceSlug/:areaSlug', async (req, res, next) => {
  const page = await content.getAreaPageBySlug(req.params.serviceSlug, req.params.areaSlug);
  if (!page) return next(); // not a real service+area combo — falls through to 404

  const region = page.coverage_regions;
  const service = page.services;
  const [allRegions, areaPagesForService, allServices] = await Promise.all([
    content.getAllCoverageRegions(),
    content.getAreaPagesForService(service.slug),
    content.getServices()
  ]);
  const parent = region.parent_id ? allRegions.find((r) => r.id === region.parent_id) : null;

  // Other area pages for this SAME service under the same parent borough —
  // internal linking between nearby areas for the same service, rather than
  // each page sitting isolated.
  const relatedAreas = areaPagesForService
    .filter((ap) => ap.id !== page.id && ap.coverage_regions && ap.coverage_regions.parent_id === region.parent_id)
    .map((ap) => ({ name: ap.coverage_regions.name, url: `/${service.slug}/${ap.slug}` }));

  const breadcrumbs = [
    ...res.locals.breadcrumbs,
    { name: service.title, url: `/${service.slug}` },
    { name: region.name, url: `/${service.slug}/${page.slug}` }
  ];
  const faqPage = schema.buildFaqPage(page.faqs);

  res.render('area-detail', {
    title: page.meta_title || `${service.title} in ${region.name}`,
    metaDescription: page.meta_description || `${service.title} in ${region.name}.`,
    page,
    region,
    service,
    parent,
    relatedAreas,
    services: allServices.slice(0, 6),
    testimonials,
    coverageAreas: res.locals.coverageAreas,
    breadcrumbs,
    structuredData: [
      ...res.locals.structuredData,
      schema.buildBreadcrumbList(breadcrumbs),
      schema.buildServiceAreaPage({ service, page, region }),
      ...(faqPage ? [faqPage] : [])
    ]
  });
});

// ---------- 404 ----------
app.use((req, res) => {
  res.status(404).render('404', { title: 'Page Not Found', noindex: true, structuredData: [] });
});

// Only start a listening server when run directly (local dev / traditional Node hosting).
// When required by scripts/prerender.js for a Netlify static build, we just need the app object.
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`SN Cleaning Services website running at http://localhost:${PORT}`);
  });
}

module.exports = app;
