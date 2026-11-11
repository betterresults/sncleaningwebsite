require('dotenv').config();
const fs = require('fs');
const express = require('express');
const expressLayouts = require('express-ejs-layouts');
const bodyParser = require('body-parser');
const path = require('path');
const nodemailer = require('nodemailer');

const { SITE_URL } = require('./lib/site-config');
const schema = require('./lib/schema');
const { isPlaceholderSocial, whatsappHref } = require('./lib/site-helpers');

const app = express();
const PORT = process.env.PORT || 3000;

// One value per build/process start, appended to CSS/JS URLs as ?v=... so browsers
// never serve a stale cached copy after a deploy — required because netlify.toml
// caches /css/* and /js/* for a full year as "immutable" (safe for performance,
// but only if the URL itself changes whenever the file's contents change).
const ASSET_VERSION = Date.now().toString(36); // bust CSS/JS after gallery copy change
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
// Page edits, SEO and colours saved in the website editor (/admin).
const editorContent = require('./lib/editor-content');
app.use(editorContent.middleware);

// Hardcoded fallback used only if site_settings has no row yet or Supabase is
// unreachable — keeps the site working, never blank, while staying editable
// from Supabase the rest of the time.
const SITE_DEFAULTS = {
  name: 'SN Cleaning Services',
  phone: '020 3835 5033',
  email: 'info@sncleaningservices.co.uk',
  address: 'Serving London & Essex',
  hours: 'Customer support: Mon to Fri 7am to 10pm · Sat and Sun 8am to 5pm',
  social: {
    facebook: '',
    instagram: ''
  },
  googleBusinessUrl: 'https://share.google/aZm6Leu555SOn4IvZ',
  logoUrl: '/images/logo.png',
  defaultOgImage: '/images/og-image.jpg',
  whatsappUrl: whatsappHref('020 3835 5033')
};

// ---------- Data ----------
const content = require('./data/content'); // live content from Supabase (services, service pages, blog, site settings)
const testimonials = require('./data/testimonials');
const whyUs = require('./data/why-us');
const jobVideoLib = require('./lib/videos');
const checklist = require('./data/checklist');
const faqs = require('./data/faqs');
const { serviceImage, GALLERY } = require('./data/media');
const { servicePrice } = require('./data/prices');

app.locals.serviceImage = serviceImage;
// Lets views add schema for what they show (the page itself, the reviews on it).
app.locals.schemaWebPage = schema.buildWebPage;
app.locals.schemaReviews = schema.buildReviews;

// Responsive photos: scripts/build-images.js writes WebP copies at 480/800/1200px
// into public/images/_r/. rs(src, sizes) returns the srcset + sizes attributes
// for a local photo, or nothing if no copies exist (e.g. external images).
const RS_WIDTHS = [480, 800, 1200];
const rsCache = new Map();
app.locals.rs = (src, sizes) => {
  if (!src || !src.startsWith('/images/')) return '';
  if (!rsCache.has(src)) {
    const base = src.replace(/^\/images\//, '').replace(/\.(jpe?g|png|webp)$/i, '');
    const have = RS_WIDTHS.filter((w) => fs.existsSync(path.join(__dirname, 'public/images/_r', `${base}-${w}.webp`)));
    rsCache.set(src, have.length ? have.map((w) => `/images/_r/${base}-${w}.webp?v=${ASSET_VERSION} ${w}w`).join(', ') : '');
  }
  const set = rsCache.get(src);
  return set ? ` srcset="${set}" sizes="${sizes || '100vw'}"` : '';
};
app.locals.servicePrice = servicePrice;
// Blog posts rebuilt at their old WordPress address (/{slug}/) keep it; others live under /blog/.
const postUrl = (p) => (p.legacy_root ? `/${p.slug}/` : `/blog/${p.slug}`);
app.locals.postUrl = postUrl;

// Where a "Get a quote" for a service should go: its own booking form when it
// has one (services.booking_embed_url), otherwise the service chooser at /book.
const BOOK_SCRIPT = require('fs').readFileSync(require('path').join(__dirname, 'public/js/book.js'), 'utf8');
app.locals.bookScript = BOOK_SCRIPT;
const BOOKING_LANDING_EMBED = 'https://app.dilvon.com/book/sn-cleaning-services/main-landing?embedded=true';
// Commercial work lives on the SN Clean site. Office and nursery cleaning are
// listed there, not here; the link is tagged so SN Clean can see the referral.
const COMMERCIAL_SLUGS = ['office-cleaning', 'nursery-cleaning'];
app.locals.commercialUrl = 'https://snclean.co.uk/?ref=sncleaningservices&utm_source=sncleaningservices.co.uk&utm_medium=referral&utm_campaign=domestic_site';
const isDomestic = (s) => !COMMERCIAL_SLUGS.includes(s.slug);
// Upholstery and mattress cleaning are booked through the carpet form (Dilvon
// lists them together as "Carpet, Upholstery and Mattress Cleaning").
const BOOK_ALIAS = { 'upholstery-cleaning': 'carpet-cleaning-services', 'mattress-cleaning': 'carpet-cleaning-services' };
// The slug of the online booking form for a service, or null if it has none.
// Services with an online form on app.sncleaningservices.co.uk that have no
// booking_embed_url in Supabase (they were never embedded).
const ONLINE_FORM = ['deep-house-cleaning', 'after-builders-cleaning'];
app.locals.bookSlug = (service) => (!service ? null : (service.booking_embed_url || ONLINE_FORM.includes(service.slug)) ? service.slug : BOOK_ALIAS[service.slug] || null);
// Where "Get a quote" goes: the service's booking form, or (no online form)
// the quote request form on the service's own page.
// The booking forms now live on our own subdomain (Dilvon custom domain), so
// buttons link straight to them. Dilvon's form names match our service slugs,
// except carpet (carpet-cleaning) and deep (deep-cleaning). Same rule in public/js/main.js.
const BOOK_BASE = 'https://app.sncleaningservices.co.uk/book/sn-cleaning-services/';
const BOOK_LANDING = BOOK_BASE + 'main-landing';
const DILVON_SLUG = { 'carpet-cleaning-services': 'carpet-cleaning', 'deep-house-cleaning': 'deep-cleaning' };
app.locals.bookUrl = (slug) => (slug ? BOOK_BASE + (DILVON_SLUG[slug] || slug) : BOOK_LANDING);
app.locals.bookHref = (service) => {
  if (!service) return BOOK_LANDING;
  const slug = app.locals.bookSlug(service);
  return slug ? app.locals.bookUrl(slug) : `/${service.slug}#quote`;
};

// Runs on every request. Sets up everything every page needs regardless of
// route: current path, canonical URL, the nav dropdown's service list, sitewide
// business info (from Supabase's site_settings), real coverage areas (for
// LocalBusiness schema on every page), and sensible defaults for breadcrumbs,
// social-share image and structured data that routes can override below.
app.use(async (req, res, next) => {
  res.locals.currentPath = req.path;
  // Pages are served with a trailing slash (Netlify redirects /x to /x/), so
  // canonicals point at the final URL, not at a redirect.
  res.locals.canonicalUrl = `${SITE_URL}${req.path === '/' || /\.[a-z0-9]+$/i.test(req.path) ? req.path : req.path.replace(/\/?$/, '/')}`;
  res.locals.noindex = false;

  try {
    const [services, servicePages, settings, coverageAreas] = await Promise.all([
      content.getServices(),
      content.getServicePages(),
      content.getSiteSettings(),
      content.getCoverageAreas()
    ]);
    const detailSlugs = new Set(servicePages.map((p) => p.slug));
    res.locals.navServices = services.filter(isDomestic).map((s) => ({
      ...s,
      hasDetailPage: detailSlugs.has(s.slug)
    }));

    const phone = (settings && settings.phone) || SITE_DEFAULTS.phone;
    const facebook = settings && settings.facebook_url;
    const instagram = settings && settings.instagram_url;

    res.locals.site = settings
      ? {
          name: settings.business_name || SITE_DEFAULTS.name,
          phone,
          email: settings.email || SITE_DEFAULTS.email,
          address: settings.address_area || SITE_DEFAULTS.address,
          hours: settings.hours_note || SITE_DEFAULTS.hours,
          social: {
            facebook: isPlaceholderSocial(facebook) ? '' : facebook,
            instagram: isPlaceholderSocial(instagram) ? '' : instagram
          },
          googleBusinessUrl: settings.google_business_url || SITE_DEFAULTS.googleBusinessUrl,
          logoUrl: settings.logo_url || SITE_DEFAULTS.logoUrl,
          defaultOgImage: settings.default_og_image || SITE_DEFAULTS.defaultOgImage,
          whatsappUrl: whatsappHref(phone)
        }
      : { ...SITE_DEFAULTS, whatsappUrl: whatsappHref(SITE_DEFAULTS.phone) };

    res.locals.navWhyUs = whyUs.all().map((p) => ({ title: p.nav_label, url: p.url }));
    res.locals.coverageAreas = coverageAreas || [];
    res.locals.hasCaseStudies = editorContent.editorPosts('case').length > 0;
    res.locals.ogImage = schema.absoluteUrl(res.locals.site.defaultOgImage || res.locals.site.logoUrl);
    res.locals.breadcrumbs = [{ name: 'Home', url: '/' }];
    res.locals.structuredData = [
      schema.buildLocalBusiness({ site: res.locals.site, coverageAreas: res.locals.coverageAreas, services: res.locals.navServices }),
      schema.buildWebSite({ site: res.locals.site }),
      schema.buildFounder()
    ];

    next();
  } catch (err) {
    console.error('Error loading nav services / site settings:', err);
    res.locals.navServices = [];
    res.locals.navWhyUs = [];
    res.locals.site = SITE_DEFAULTS;
    res.locals.coverageAreas = [];
    res.locals.ogImage = schema.absoluteUrl(SITE_DEFAULTS.defaultOgImage);
    res.locals.breadcrumbs = [{ name: 'Home', url: '/' }];
    res.locals.structuredData = [];
    next();
  }
});

// Coverage map links: each map area links to its local page when one exists
// (matched by coverage region, or by the parent region of a sub-area),
// preferring services earlier in `servicePref`. Areas with no page link to
// the quote form (#quote) on the same page.
function buildMapLink(areaPages, regions, servicePref, { onlyThese = false } = {}) {
  const regionById = new Map(regions.map((r) => [r.id, r]));
  const areaLinks = {};
  areaPages
    .filter((p) => p.services && p.coverage_regions && (!onlyThese || servicePref.includes(p.services.slug)))
    .forEach((p) => {
      const reg = p.coverage_regions;
      const names = [reg.name];
      if (reg.parent_id && regionById.get(reg.parent_id)) names.push(regionById.get(reg.parent_id).name);
      const url = `/${p.services.slug}/${p.slug}`;
      const rank = servicePref.indexOf(p.services.slug) === -1 ? 99 : servicePref.indexOf(p.services.slug);
      names.forEach((n) => {
        // an exact region match beats a parent match; then service preference
        const score = (n === reg.name ? 0 : 100) + rank;
        if (!areaLinks[n] || score < areaLinks[n].score) areaLinks[n] = { url, score };
      });
    });
  const link = (regionName) => (areaLinks[regionName] ? areaLinks[regionName].url : '#quote');
  link.count = Object.keys(areaLinks).length;
  return link;
}

// Service pages already moved to the new design (views/service-v2.ejs).
// The rest still use views/service-detail.ejs until they are redesigned.
const serviceContent = require('./data/service-content');
const areaMap = require('./lib/area-map');
app.locals.serviceContent = serviceContent;
const SERVICE_V2 = ['domestic-cleaning', 'end-of-tenancy-cleaning', 'airbnb-cleaning', 'deep-house-cleaning', 'after-builders-cleaning', 'carpet-cleaning-services', 'upholstery-cleaning', 'mattress-cleaning'];

// ---------- Routes ----------
app.get('/', async (req, res) => {
  const [services, areaPages, regions] = await Promise.all([
    content.getServices(),
    content.getAreaPages(),
    content.getAllCoverageRegions()
  ]);
  const faqPage = schema.buildFaqPage(faqs);

  const mapLink = buildMapLink(areaPages, regions, ['domestic-cleaning', 'deep-house-cleaning', 'end-of-tenancy-cleaning', 'airbnb-cleaning']);

  res.render('index', {
    title: 'Cleaning Services London & Essex',
    metaDescription:
      'Insured domestic, end of tenancy and Airbnb cleaning across London & Essex. Own staff, a re-clean guarantee, and a quote the same weekday you enquire.',
    // Homepage service cards, in this order.
    services: ['domestic-cleaning', 'end-of-tenancy-cleaning', 'deep-house-cleaning', 'carpet-cleaning-services', 'after-builders-cleaning', 'airbnb-cleaning']
      .map((slug) => services.find((s) => s.slug === slug))
      .filter(Boolean),
    bookable: services.filter((s) => s.booking_embed_url || ONLINE_FORM.includes(s.slug)),
    testimonials,
    checklist,
    faqs,
    mapLink,
    heroPreload: '/images/hero-living-room.jpg',
    isHome: true,
    coverageAreas: res.locals.coverageAreas,
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
      'Domestic, end of tenancy, Airbnb, deep cleaning, after builders, carpet, upholstery and mattress cleaning across London & Essex.',
    services: services.filter(isDomestic).map((s) => ({ ...s, hasDetailPage: detailSlugs.has(s.slug) })),
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
  if (!post || post.legacy_root) return next();
  renderPost(req, res, post);
});

function renderPost(req, res, post) {
  const breadcrumbs = [...res.locals.breadcrumbs, { name: 'Blog', url: '/blog' }, { name: post.title, url: postUrl(post) }];

  res.render('blog/post', {
    title: post.meta_title || post.title,
    noindex: !!post.noindex,
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
}

// Templates the website editor uses to preview a new post or case study before
// it is published. Not linked anywhere, hidden from Google and the sitemap.
const SAMPLE = {
  slug: '_template', title: 'Post title', excerpt: 'Short summary', cover_image: '/images/hero-living-room.jpg',
  published_at: new Date().toISOString(), content: '<p>Text</p>', editor: true, noindex: true, service: 'Service', area: 'Area'
};
app.get('/blog/_template', (req, res) => renderPost(req, res, SAMPLE));
app.get('/case-studies/_template', (req, res) => renderCase(req, res, SAMPLE));

// ---------- Case studies (written in the website editor) ----------
app.get('/case-studies', (req, res, next) => {
  const cases = editorContent.editorPosts('case');
  if (!cases.length) return next();
  const breadcrumbs = [...res.locals.breadcrumbs, { name: 'Case studies', url: '/case-studies' }];
  res.render('case-studies/index', {
    title: 'Case Studies: Real Cleaning Jobs',
    metaDescription: 'Real cleaning jobs from SN Cleaning Services in London and Essex: what the client needed, what we did and the result, with before and after photos.',
    cases,
    breadcrumbs,
    structuredData: [...res.locals.structuredData, schema.buildBreadcrumbList(breadcrumbs)]
  });
});
app.get('/case-studies/:slug', (req, res, next) => {
  const cs = editorContent.editorPosts('case').find((p) => p.slug === req.params.slug);
  if (!cs) return next();
  renderCase(req, res, cs);
});
function renderCase(req, res, cs) {
  const url = `/case-studies/${cs.slug}`;
  const breadcrumbs = [...res.locals.breadcrumbs, { name: 'Case studies', url: '/case-studies' }, { name: cs.title, url }];
  res.render('case-studies/post', {
    title: cs.meta_title || cs.title,
    metaDescription: cs.meta_description || cs.excerpt,
    noindex: !!cs.noindex,
    post: cs,
    breadcrumbs,
    ogImage: cs.cover_image ? schema.absoluteUrl(cs.cover_image) : res.locals.ogImage,
    structuredData: [
      ...res.locals.structuredData,
      schema.buildBreadcrumbList(breadcrumbs),
      schema.buildArticle({ post: cs, site: res.locals.site, url })
    ]
  });
}

// Questions answered: /questions and /questions/{slug} (rows in Supabase public.faq_answers)
app.get('/questions', async (req, res) => {
  const answers = await content.getFaqAnswers();
  const breadcrumbs = [...res.locals.breadcrumbs, { name: 'Questions', url: '/questions' }];
  const faq = schema.buildFaqPage(answers.map((a) => ({ question: a.question, answer: a.short_answer })));
  res.render('questions/index', {
    title: 'Cleaning Questions Answered',
    metaDescription: 'Real questions about end of tenancy, deep, carpet and Airbnb cleaning in London and Essex, answered by the SN Cleaning Services team.',
    answers,
    breadcrumbs,
    structuredData: [...res.locals.structuredData, schema.buildBreadcrumbList(breadcrumbs), faq].filter(Boolean)
  });
});
app.get('/questions/:slug', async (req, res, next) => {
  const answers = await content.getFaqAnswers();
  const answer = answers.find((a) => a.slug === req.params.slug);
  if (!answer) return next();
  const url = `/questions/${answer.slug}`;
  const breadcrumbs = [...res.locals.breadcrumbs, { name: 'Questions', url: '/questions' }, { name: answer.question, url }];
  const pages = await content.getServicePages();
  const sp = answer.service_slug && pages.find((p) => p.slug === answer.service_slug);
  const serviceLink = sp ? { url: `/${sp.slug}/`, name: sp.service_name || sp.title || 'Our service' } : null;
  const related = answers.filter((a) => a.slug !== answer.slug && a.service_slug === answer.service_slug).slice(0, 4);
  const video = answer.youtube_id ? jobVideoLib.buildVideoSchema([{ title: answer.video_title || answer.question, description: answer.short_answer, youtube_id: answer.youtube_id, recorded_on: answer.checked_on, created_at: answer.created_at }]) : [];
  res.render('questions/answer', {
    title: answer.meta_title || answer.question,
    metaDescription: answer.meta_description || answer.short_answer,
    answer,
    related,
    serviceLink,
    breadcrumbs,
    ogImage: answer.youtube_id ? `https://i.ytimg.com/vi/${answer.youtube_id}/hqdefault.jpg` : res.locals.ogImage,
    structuredData: [
      ...res.locals.structuredData,
      schema.buildBreadcrumbList(breadcrumbs),
      schema.buildFaqPage([{ question: answer.question, answer: answer.short_answer }]),
      schema.buildArticle({ post: { title: answer.question, meta_description: answer.short_answer, published_at: answer.created_at, updated_at: answer.updated_at }, site: res.locals.site, url }),
      ...video
    ]
  });
});

// Legal pages (content in data/legal.js).
const legalDocs = require('./data/legal');
Object.keys(legalDocs).forEach((slug) => {
  app.get(`/${slug}`, (req, res) => {
    const doc = legalDocs[slug];
    const breadcrumbs = [...res.locals.breadcrumbs, { name: doc.title, url: `/${slug}` }];
    res.render('legal', {
      title: doc.title,
      metaDescription: doc.metaDescription,
      doc,
      breadcrumbs,
      structuredData: [...res.locals.structuredData, schema.buildBreadcrumbList(breadcrumbs)]
    });
  });
});

// ---------- Why us: a hub plus one page per service ----------
app.get('/why-us', (req, res) => {
  const breadcrumbs = [...res.locals.breadcrumbs, { name: 'Why us', url: '/why-us' }];
  res.render('why-us-index', {
    title: 'Why Choose SN Cleaning Services',
    metaDescription:
      'Why people across London and Essex choose SN Cleaning Services: 12 years, 7,549 end of tenancy cleans, our own DBS checked team and a free re clean.',
    pages: whyUs.all(),
    reviews: testimonials.slice(0, 3),
    designV2: true,
    breadcrumbs,
    structuredData: [...res.locals.structuredData, schema.buildBreadcrumbList(breadcrumbs)]
  });
});

app.get('/why-us/:slug', async (req, res, next) => {
  const page = whyUs.get(req.params.slug);
  if (!page) return next();
  const services = await content.getServices();
  const service = services.find((s) => s.slug === page.slug) || { title: page.service_name, slug: page.slug };
  const breadcrumbs = [
    ...res.locals.breadcrumbs,
    { name: 'Why us', url: '/why-us' },
    { name: page.service_name, url: page.url }
  ];
  const reviews = (page.proof && page.proof.review_indices || []).map((i) => testimonials[i]).filter(Boolean);
  const faqPage = schema.buildFaqPage(page.faqs);
  const svcVideos = jobVideoLib.forService(await content.getJobVideos(), page.slug);
  const jobVideos = jobVideoLib.section(svcVideos, page.slug, page.service_name);
  res.render('why-us', {
    jobVideos,
    title: page.meta_title,
    metaDescription: page.meta_description,
    page,
    service,
    reviews,
    others: whyUs.all().filter((p) => p.slug !== page.slug),
    designV2: true,
    breadcrumbs,
    structuredData: [
      ...res.locals.structuredData,
      schema.buildBreadcrumbList(breadcrumbs),
      ...(faqPage ? [faqPage] : []),
      ...jobVideoLib.buildVideoSchema(jobVideos.videos)
    ]
  });
});

// ---------- All job videos for one service ----------
app.get('/videos/:serviceSlug', async (req, res, next) => {
  const allVideos = jobVideoLib.forService(await content.getJobVideos(), req.params.serviceSlug);
  if (!allVideos.length) return next();
  const services = await content.getServices();
  const svc = services.find((x) => x.slug === req.params.serviceSlug);
  const serviceName = svc ? svc.title : req.params.serviceSlug;
  const breadcrumbs = [...res.locals.breadcrumbs, { name: serviceName, url: `/${req.params.serviceSlug}` }, { name: 'Videos', url: `/videos/${req.params.serviceSlug}` }];
  res.render('videos', {
    title: `${serviceName} Videos: Before and After From Our Jobs`,
    metaDescription: `Before and after videos from real ${serviceName.toLowerCase()} jobs by SN Cleaning Services across London and Essex.`,
    allVideos,
    serviceName,
    serviceSlug: req.params.serviceSlug,
    designV2: true,
    breadcrumbs,
    structuredData: [...res.locals.structuredData, schema.buildBreadcrumbList(breadcrumbs), ...jobVideoLib.buildVideoSchema(allVideos)]
  });
});

app.get('/about', (req, res) => {
  const breadcrumbs = [...res.locals.breadcrumbs, { name: 'About', url: '/about' }];
  res.render('about', {
    title: 'About Us — 12 Years Cleaning London & Essex',
    metaDescription:
      'SN Cleaning Services has cleaned London & Essex homes for 12 years with its own insured, DBS-checked team, professional products and a free re-clean guarantee.',
    breadcrumbs,
    testimonials,
    designV2: true,
    structuredData: [...res.locals.structuredData, schema.buildBreadcrumbList(breadcrumbs)]
  });
});

app.get('/about/silvia-nedeva', (req, res) => {
  const breadcrumbs = [...res.locals.breadcrumbs, { name: 'About', url: '/about' }, { name: 'Silvia Nedeva', url: '/about/silvia-nedeva' }];
  res.render('silvia', {
    title: 'Silvia Nedeva, SN Cleaning Services',
    metaDescription:
      'Silvia Nedeva came to the UK from Bulgaria in 2014, started as a cleaner and now manages SN Cleaning Services in Brentwood. Her story and how she trains the team.',
    breadcrumbs,
    designV2: true,
    structuredData: [...res.locals.structuredData, schema.buildBreadcrumbList(breadcrumbs)]
  });
});

// Full FAQ page per service. Unlinked and noindex until Silvia approves it (set live: true then).
const SERVICE_FAQS = { 'end-of-tenancy-cleaning': { data: require('./data/faq-end-of-tenancy'), live: true } };
// The top questions of a service's FAQ page plus its link, shown on that service's pages (null if no live FAQ page).
app.locals.serviceFaqTeaser = (slug) => {
  const entry = SERVICE_FAQS[slug];
  if (!entry || !entry.live) return null;
  const items = entry.data.groups.flatMap((g) => g.items).filter((i) => i.top);
  return { url: `/${slug}/faq/`, label: entry.data.linkLabel || 'See all questions', items };
};
app.locals.liveServiceFaqs = () =>
  Object.entries(SERVICE_FAQS).filter(([, e]) => e.live).map(([slug, e]) => ({ url: `/${slug}/faq/`, title: e.data.title }));
app.get('/:serviceSlug/faq', (req, res, next) => {
  const entry = SERVICE_FAQS[req.params.serviceSlug];
  if (!entry) return next();
  const faq = entry.data;
  const all = faq.groups.flatMap((g) => g.items);
  const breadcrumbs = [
    ...res.locals.breadcrumbs,
    { name: 'End of Tenancy Cleaning', url: `/${req.params.serviceSlug}` },
    { name: 'FAQ', url: `/${req.params.serviceSlug}/faq` }
  ];
  res.render('service-faq', {
    title: 'End of Tenancy Cleaning FAQ: Prices, Deposits and More',
    metaDescription:
      'End of tenancy cleaning questions answered: what is included, the oven, carpets, how long it takes, prices from £179, deposits, the Tenant Fees Act and our guarantees.',
    faq,
    breadcrumbs,
    designV2: true,
    noindex: !entry.live,
    structuredData: [
      ...res.locals.structuredData,
      schema.buildBreadcrumbList(breadcrumbs),
      schema.buildFaqPage(all.map((i) => ({ question: i.q, answer: i.a })))
    ]
  });
});

app.get('/our-work', (req, res) => {
  const breadcrumbs = [...res.locals.breadcrumbs, { name: 'Our work', url: '/our-work' }];
  res.render('our-work', {
    title: 'Our Work: Real Before and After Cleans in Essex and London',
    metaDescription:
      'Real before and after photos from SN Cleaning Services jobs across Essex and London, our latest cleans, and where we cleaned in the last 6 months.',
    designV2: true,
    breadcrumbs,
    structuredData: [...res.locals.structuredData, schema.buildBreadcrumbList(breadcrumbs)]
  });
});

app.get('/gallery', (req, res) => {
  const breadcrumbs = [...res.locals.breadcrumbs, { name: 'Gallery', url: '/gallery' }];
  res.render('gallery', {
    title: 'Our Work',
    metaDescription: 'A look at the standard of work from SN Cleaning Services, serving London & Essex with professional home and office cleaning.',
    gallery: GALLERY,
    breadcrumbs,
    structuredData: [...res.locals.structuredData, schema.buildBreadcrumbList(breadcrumbs)]
  });
});

app.get('/contact', (req, res) => {
  const breadcrumbs = [...res.locals.breadcrumbs, { name: 'Contact', url: '/contact' }];
  res.render('contact', {
    title: 'Contact',
    metaDescription:
      'Request a quote from SN Cleaning Services. Send your postcode, call or WhatsApp — we quote the same weekday.',
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

// ---------- Booking ----------
// /book is the "choose a service" landing (generic "Get a quote"); /book/{slug}
// is one service's own booking form. Both embed the Dilvon forms. Any postcode
// and email in the page URL are passed on to the form by public/js/book.js
// (the pages are prerendered, so this has to happen in the browser).
app.get('/book', (req, res) => {
  const breadcrumbs = [...res.locals.breadcrumbs, { name: 'Get a quote', url: '/book' }];
  res.render('book', {
    title: 'Get a Quote — Choose Your Cleaning Service',
    metaDescription: 'Choose the cleaning service you need and book online with SN Cleaning Services, London & Essex.',
    embedUrl: BOOKING_LANDING_EMBED,
    embedTitle: 'Choose a service',
    service: null,
    breadcrumbs,
    noindex: true,
    designV2: true,
    structuredData: []
  });
});

app.get('/book/:serviceSlug', async (req, res, next) => {
  const services = await content.getServices();
  const service = services.find((s) => s.slug === req.params.serviceSlug && s.booking_embed_url);
  if (!service) return next();
  const breadcrumbs = [
    ...res.locals.breadcrumbs,
    { name: 'Get a quote', url: '/book' },
    { name: service.title, url: `/book/${service.slug}` }
  ];
  res.render('book', {
    title: `Book ${service.title}`,
    metaDescription: `Book ${service.title.toLowerCase()} online with SN Cleaning Services, London & Essex.`,
    embedUrl: service.booking_embed_url,
    embedTitle: `${service.title} booking form`,
    service,
    breadcrumbs,
    noindex: true,
    designV2: true,
    structuredData: []
  });
});

// This route is only used for local Node/traditional hosting. On Netlify, form
// submissions are intercepted and handled entirely by Netlify Forms (no server needed) —
// see the "contact" form's data-netlify attribute in views/contact.ejs.
app.post('/contact', async (req, res) => {
  const { name, email, phone, postcode, service, message } = req.body;

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
        text: `Name: ${name}\nEmail: ${email}\nPhone: ${phone || 'N/A'}\nPostcode: ${postcode || 'N/A'}\nService: ${service || 'N/A'}\n\nMessage:\n${message}`
      });
    } else {
      console.log('New contact form submission (SMTP not configured, logging only):', {
        name, email, phone, postcode, service, message
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
  if (!page) {
    // Old blog posts rebuilt at their original WordPress address (/{slug}/).
    const post = await content.getBlogPostBySlug(req.params.slug);
    if (post && post.legacy_root) return renderPost(req, res, post);
    return next(); // not a real service slug — falls through to the area route, then 404
  }

  const allServices = (await content.getServices()).filter(isDomestic);
  const relatedServices = allServices.filter((s) => s.slug !== page.slug).slice(0, 3);
  const service = page.services;
  const coverageAreas = res.locals.coverageAreas;

  const breadcrumbs = [
    ...res.locals.breadcrumbs,
    { name: 'Services', url: '/our-services' },
    { name: service.title, url: `/${page.slug}` }
  ];
  const v2 = SERVICE_V2.includes(page.slug);
  const extra = (v2 && serviceContent[page.slug]) || {};
  // Database FAQs plus the service's extra FAQs (data/service-seo.js).
  const allFaqs = [...(page.faqs || []), ...(extra.extraFaqs || [])];
  const faqPage = schema.buildFaqPage(allFaqs);

  let mapLink = null;
  let localPages = [];
  if (v2) {
    const [areaPages, regions] = await Promise.all([content.getAreaPages(), content.getAllCoverageRegions()]);
    mapLink = buildMapLink(areaPages, regions, [page.slug], { onlyThese: true });
    // This service's local area pages, for the "Areas we cover" links.
    localPages = areaPages
      .filter((p) => p.services && p.services.slug === page.slug && p.coverage_regions && p.coverage_regions.level !== 'town')
      .map((p) => ({ name: p.coverage_regions.name, url: `/${page.slug}/${p.slug}` }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  const svcJobVideos = jobVideoLib.section(jobVideoLib.forService(await content.getJobVideos(), page.slug), page.slug, service.title);
  res.render(v2 ? 'service-v2' : 'service-detail', {
    jobVideos: svcJobVideos,
    designV2: v2,
    heroPreload: v2 ? ((page.images && page.images.length) ? page.images[0] : serviceImage(page.slug)) : null,
    mapLink,
    mapPages: mapLink ? mapLink.count : 0,
    localPages,
    allFaqs,
    title: page.meta_title || extra.metaTitle || service.title,
    metaDescription: page.meta_description || extra.metaDescription || service.short_description,
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
      ...(faqPage ? [faqPage] : []),
      ...jobVideoLib.buildVideoSchema(svcJobVideos.videos)
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
// Town pages nested under a borough keep the address Google already knows,
// e.g. /end-of-tenancy-cleaning/redbridge/wanstead/ (area_pages.slug = 'redbridge/wanstead').
app.get('/:serviceSlug/:areaSlug/:subSlug', (req, res, next) => renderArea(req, res, next, `${req.params.areaSlug}/${req.params.subSlug}`));
app.get('/:serviceSlug/:areaSlug', (req, res, next) => renderArea(req, res, next, req.params.areaSlug));

async function renderArea(req, res, next, areaSlug) {
  const page = await content.getAreaPageBySlug(req.params.serviceSlug, areaSlug);
  if (!page) return next(); // not a real service+area combo — falls through to 404

  const region = page.coverage_regions;
  const service = page.services;
  const [allRegions, areaPagesForService, allServices] = await Promise.all([
    content.getAllCoverageRegions(),
    content.getAreaPagesForService(service.slug),
    content.getServices()
  ]);
  const parent = region.parent_id ? allRegions.find((r) => r.id === region.parent_id) : null;

  if (SERVICE_V2.includes(service.slug)) {
    // New design. Area name: display_name, else the region name cleaned of
    // map labels like "Essex - " and " / Thurrock Edge".
    const areaName = (r) => r ? (r.display_name || String(r.name).replace(/^Essex - /, '').replace(/\s*\/.*$/, '')) : '';
    const place = areaName(region);
    const fullService = allServices.find((s) => s.slug === service.slug) || service; // has booking_embed_url
    const allAreaPages = await content.getAreaPages();
    const pageUrl = (ap) => `/${ap.services.slug}/${ap.slug}`;
    // Parent page for this service (e.g. Havering for Romford), if it exists.
    const parentPage = parent ? allAreaPages.find((ap) => ap.services.slug === service.slug && ap.region_id === parent.id) : null;
    // Nearby: same service, same parent. Children: same service, this area is the parent.
    const nearby = region.parent_id
      ? allAreaPages.filter((ap) => ap.id !== page.id && ap.services.slug === service.slug && ap.coverage_regions && ap.coverage_regions.parent_id === region.parent_id)
      : [];
    const children = allAreaPages.filter((ap) => ap.services.slug === service.slug && ap.coverage_regions && ap.coverage_regions.parent_id === region.id);
    // Other services in this same area: link to that service's page for this
    // area, else its parent-area page, else the main service page.
    const otherServices = allServices.filter(isDomestic).filter((s) => s.slug !== service.slug && SERVICE_V2.includes(s.slug)).map((s) => {
      const here = allAreaPages.find((ap) => ap.services.slug === s.slug && ap.region_id === region.id);
      const up = !here && parent ? allAreaPages.find((ap) => ap.services.slug === s.slug && ap.region_id === parent.id) : null;
      return { ...s, url: here ? pageUrl(here) : up ? pageUrl(up) : `/${s.slug}`, local: !!here };
    });
    // Every level above this area that has a page for this service
    // (e.g. London > Havering > Elm Park).
    const ancestors = [];
    for (let r = parent; r; r = r.parent_id ? allRegions.find((x) => x.id === r.parent_id) : null) {
      const ap = allAreaPages.find((x) => x.services.slug === service.slug && x.region_id === r.id);
      if (ap) ancestors.unshift({ name: areaName(r), url: pageUrl(ap) });
    }
    const crumbs = [
      ...res.locals.breadcrumbs,
      { name: service.title, url: `/${service.slug}` },
      ...ancestors,
      { name: place, url: `/${service.slug}/${page.slug}` }
    ];
    const servicePage = await content.getServicePageBySlug(service.slug);
    const faqs = page.faqs || [];
    const faq = schema.buildFaqPage(faqs);
    // London / Essex pages: coverage map linking to this service's borough pages.
    // London / Essex pages: the big coverage map linking to this service's pages.
    const serviceMap = buildMapLink(allAreaPages, allRegions, [service.slug], { onlyThese: true });
    const mapLink = region.level === 'region' && serviceMap.count ? serviceMap : null;
    // Every other area page: a small map of this area and its neighbours,
    // with links to nearby pages beside it, and a grouped list of all the rest.
    const chain = [];
    for (let r = region; r; r = r.parent_id ? allRegions.find((x) => x.id === r.parent_id) : null) chain.push(r);
    const chainNames = chain.map((r) => r.name);
    const svcPages = allAreaPages.filter((ap) => ap.services.slug === service.slug && ap.coverage_regions);
    const pageForRegionName = (n) => svcPages.find((ap) => ap.coverage_regions.name === n);
    const link = (ap) => ({ name: areaName(ap.coverage_regions), url: pageUrl(ap) });
    const mini = mapLink ? null : areaMap.miniMap(chainNames, (n) => !!pageForRegionName(n));
    let nearbyLinks = [];
    if (region.level !== 'region') {
      if (parent && region.level === 'town') {
        const neighbourPages = (mini ? mini.neighbourRegions : []).map(pageForRegionName).filter(Boolean);
        nearbyLinks = [...(parentPage ? [parentPage] : []), ...nearby.sort((a, b) => areaName(a.coverage_regions).localeCompare(areaName(b.coverage_regions))).slice(0, 5), ...neighbourPages];
      } else {
        const neighbourPages = (mini ? mini.neighbourRegions : []).map(pageForRegionName).filter(Boolean);
        nearbyLinks = [...children, ...neighbourPages];
      }
    }
    nearbyLinks = nearbyLinks.filter((ap, i, a) => ap.id !== page.id && a.findIndex((x) => x.id === ap.id) === i).map(link);
    if (region.level !== 'town') nearbyLinks.sort((a, b) => a.name.localeCompare(b.name));
    nearbyLinks = nearbyLinks.slice(0, 8);
    const shown = new Set([pageUrl(page), ...nearbyLinks.map((l) => l.url)]);
    const groups = new Map();
    for (const ap of svcPages) {
      if (shown.has(pageUrl(ap)) || ap.coverage_regions.level === 'region') continue;
      const names = [];
      for (let r = ap.coverage_regions; r; r = r.parent_id ? allRegions.find((x) => x.id === r.parent_id) : null) names.push(r.name);
      const g = areaMap.groupFor(names);
      if (!groups.has(g)) groups.set(g, []);
      groups.get(g).push(link(ap));
    }
    const directory = areaMap.GROUP_ORDER.filter((g) => groups.has(g)).map((g) => ({
      name: g, links: groups.get(g).sort((a, b) => a.name.localeCompare(b.name))
    }));
    const mapCopy = require('./data/area-map-copy')[service.slug] || '';
    // Every page in Essex (any service), plus domestic cleaning in Havering
    // (Romford, Upminster), shows the team video.
    let inEssex = false;
    for (let r = region; r && !inEssex; r = r.parent_id ? allRegions.find((x) => x.id === r.parent_id) : null) {
      if (/^essex\b/i.test(String(r.slug || '')) || /^essex\b/i.test(String(r.name || ''))) inEssex = true;
    }
    const inHavering = [region, parent].some((r) => r && /^havering/i.test(String(r.name || '')));
    // The general team video is no longer shown on area pages (Silvia, 11 Nov 2026); job videos show instead.
    const video = null;
const areaJobVideos = jobVideoLib.section(jobVideoLib.forArea(await content.getJobVideos(), service.slug, page.postcodes), service.slug, service.title);
        return res.render('area-v2', {
      jobVideos: areaJobVideos,
      mapLink,
      mapCopy,
      mini,
      nearbyLinks,
      directory,
      video,
      designV2: true,
      heroPreload: serviceImage(service.slug),
      // Title format (keyword first, then price, then trust): fits Google's ~60 characters.
      title: [`${service.title} ${place} | ${servicePrice(service.slug) || 'Free Quote'} | 5★ Rated`, `${service.title} ${place} | ${servicePrice(service.slug) || 'Free Quote'}`, `${service.title} ${place}`].find((t) => t.length <= 60) || `${service.title} ${place}`,
      metaDescription: page.meta_description || `${service.title} in ${place}.`,
      page, region, service: fullService, parent, place,
      servicePage: servicePage || {},
      parentLink: parentPage ? { name: areaName(parent), url: pageUrl(parentPage) } : null,
      nearby: nearby.map((ap) => ({ name: areaName(ap.coverage_regions), url: pageUrl(ap) })).sort((a, b) => a.name.localeCompare(b.name)),
      children: children.map((ap) => ({ name: areaName(ap.coverage_regions), url: pageUrl(ap) })).sort((a, b) => a.name.localeCompare(b.name)),
      otherServices,
      testimonials,
      breadcrumbs: crumbs,
      structuredData: [
        ...res.locals.structuredData,
        schema.buildBreadcrumbList(crumbs),
        schema.buildServiceAreaPage({ service, page, region }),
        ...(faq ? [faq] : []),
        ...jobVideoLib.buildVideoSchema(areaJobVideos.videos)
      ]
    });
  }

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
}

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
