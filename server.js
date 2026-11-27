require('dotenv').config();
const fs = require('fs');
const express = require('express');
const expressLayouts = require('express-ejs-layouts');
const bodyParser = require('body-parser');
const path = require('path');
const nodemailer = require('nodemailer');

const { SITE_URL } = require('./lib/site-config');
const schema = require('./lib/schema');
const { isPlaceholderSocial, whatsappHref, plainPlaceName } = require('./lib/site-helpers');
const { linkifyInternal, applyLinkPhrasesToPage } = require('./lib/linkify-internal');

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
    facebook: 'https://www.facebook.com/sncleaningservicesuk',
    instagram: 'https://www.instagram.com/sncleanservices/',
    tiktok: 'https://www.tiktok.com/@sncleaningservices',
    youtube: 'https://www.youtube.com/@sncleaningservicesuk'
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
const { servicePrice, priceNote } = require('./data/prices');

app.locals.serviceImage = serviceImage;
// Lets views add schema for what they show (the page itself, the reviews on it).
app.locals.schemaWebPage = schema.buildWebPage;
app.locals.schemaReviews = schema.buildReviews;
app.locals.customerSupport = require('./data/customer-support');

// Responsive photos: scripts/build-images.js writes WebP copies at 480/800/1200px
// into public/images/_r/. rs(src, sizes) returns the srcset + sizes attributes
// for a local photo, or nothing if no copies exist (e.g. external images).
const RS_WIDTHS = [480, 800, 1200];
const rsCache = new Map();
// Largest WebP the page can render, plus the srcset the <img> uses.
// Preload href must be one of those WebP URLs. A JPG href is fetched as well.
function responsiveWebp(src) {
  const clean = String(src || '').split('?')[0];
  if (!clean.startsWith('/images/')) return { href: clean, srcset: '' };
  if (!rsCache.has(clean)) {
    const base = clean.replace(/^\/images\//, '').replace(/\.(jpe?g|png|webp)$/i, '');
    const have = RS_WIDTHS.filter((w) => fs.existsSync(path.join(__dirname, 'public/images/_r', `${base}-${w}.webp`)));
    const srcset = have.length ? have.map((w) => `/images/_r/${base}-${w}.webp?v=${ASSET_VERSION} ${w}w`).join(', ') : '';
    const href = have.length
      ? `/images/_r/${base}-${have[have.length - 1]}.webp?v=${ASSET_VERSION}`
      : `${clean}?v=${ASSET_VERSION}`;
    rsCache.set(clean, { href, srcset });
  }
  return rsCache.get(clean);
}
app.locals.responsiveWebp = responsiveWebp;
app.locals.rs = (src, sizes) => {
  const { srcset } = responsiveWebp(src);
  return srcset ? ` srcset="${srcset}" sizes="${sizes || '100vw'}"` : '';
};
app.locals.schemaCollapse = (blocks) => schema.mergeReviewsIntoBusiness(blocks, []);
app.locals.plainPlaceName = plainPlaceName;
app.locals.servicePrice = servicePrice;
app.locals.priceNote = priceNote;
app.locals.answerCapsuleFor = require('./data/answer-capsules').forSlug;
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
  res.locals.linkifyInternal = linkifyInternal;
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
            facebook: isPlaceholderSocial(facebook) ? SITE_DEFAULTS.social.facebook : facebook,
            instagram: isPlaceholderSocial(instagram) ? SITE_DEFAULTS.social.instagram : instagram,
            tiktok: SITE_DEFAULTS.social.tiktok,
            youtube: SITE_DEFAULTS.social.youtube
          },
          googleBusinessUrl: settings.google_business_url || SITE_DEFAULTS.googleBusinessUrl,
          logoUrl: settings.logo_url || SITE_DEFAULTS.logoUrl,
          defaultOgImage: settings.default_og_image || SITE_DEFAULTS.defaultOgImage,
          whatsappUrl: whatsappHref(phone)
        }
      : { ...SITE_DEFAULTS, whatsappUrl: whatsappHref(SITE_DEFAULTS.phone) };

    res.locals.navWhyUs = whyUs.all().map((p) => ({ title: p.nav_label, url: p.url }));
    res.locals.coverageAreas = (coverageAreas || []).map(plainPlaceName);
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

function reviewsForService(list, slug) {
  const copy = serviceContent[slug] || serviceContent['domestic-cleaning'] || {};
  const match = copy.reviewMatch;
  return (list || []).slice()
    .sort((a, b) => ((match && match.test(b.quote) ? 1 : 0) - (match && match.test(a.quote) ? 1 : 0)))
    .slice(0, 3);
}
function plainContent(value) {
  if (typeof value === 'string') return plainPlaceName(value);
  if (Array.isArray(value)) return value.map(plainContent);
  if (value && typeof value === 'object') {
    const next = {};
    for (const [key, item] of Object.entries(value)) {
      next[key] = (key === 'slug' || key === 'url' || key === 'href' || key === 'src' || key === 'id') ? item : plainContent(item);
    }
    return next;
  }
  return value;
}
function reviewsForArea(list, slug, place) {
  const copy = serviceContent[slug] || serviceContent['domestic-cleaning'] || {};
  const match = copy.reviewMatch;
  const placeRe = new RegExp(String(place || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
  const score = (t) => (placeRe.test(`${t.quote} ${t.location || ''}`) ? 2 : 0) + (match && match.test(t.quote) ? 1 : 0);
  return (list || []).slice().sort((a, b) => score(b) - score(a)).slice(0, 3);
}
// WebPage dates for the homepage, the core service pages and the price pages.
// 2025-01-15 is the fallback where the page has no earlier published date.
const AI_DATE_PUBLISHED = '2025-01-15';
const AI_DATE_MODIFIED = '2026-11-27';
const AI_DATED_SERVICES = new Set([
  'domestic-cleaning',
  'deep-house-cleaning',
  'airbnb-cleaning',
  'after-builders-cleaning',
  'end-of-tenancy-cleaning'
]);
function aiPageDates(published) {
  return {
    webPageDatePublished: published || AI_DATE_PUBLISHED,
    webPageDateModified: AI_DATE_MODIFIED
  };
}

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
    ...aiPageDates(),
    structuredData: schema.mergeReviewsIntoBusiness(
      [...res.locals.structuredData, ...(faqPage ? [faqPage] : [])],
      testimonials
    )
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
    metaDescription: 'Cleaning guides from the SN Cleaning Services team: carpet stains, mould and damp, end of tenancy, Airbnb turnovers and sharing chores at home.',
    posts,
    breadcrumbs,
    structuredData: [...res.locals.structuredData, schema.buildBreadcrumbList(breadcrumbs), schema.buildBlog({ posts, postUrl })]
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
      ...(schema.buildGuideArticle({ page }) ? [schema.buildGuideArticle({ page })] : []),
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
    metaDescription: `Before and after videos from real ${serviceName.toLowerCase().replace(/\bairbnb\b/, 'Airbnb')} jobs by SN Cleaning Services across London and Essex.`,
    // 3 or fewer videos: the service page already shows all of them and does not link here, so keep this copy out of Google.
    noindex: allVideos.length <= 3,
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
    heroPreload: '/images/silvia.webp',
    structuredData: schema.mergeReviewsIntoBusiness(
      [...res.locals.structuredData, schema.buildBreadcrumbList(breadcrumbs)],
      [((testimonials || []).find((t) => /Silvia/.test(t.quote)) || (testimonials || [])[0])].filter(Boolean)
    )
  });
});

app.get('/about/silvia-nedeva', (req, res) => {
  const breadcrumbs = [...res.locals.breadcrumbs, { name: 'About', url: '/about' }, { name: 'Silvia Nedeva', url: '/about/silvia-nedeva' }];
  res.render('silvia', {
    title: 'Silvia Nedeva, SN Cleaning Services',
    heroPreload: '/images/silvia.webp',
    metaDescription:
      'Silvia Nedeva came to the UK from Bulgaria in 2014, started as a cleaner and now manages SN Cleaning Services in Brentwood. Read how she trains the team.',
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
// Prices hub (/prices/) and the list used by the top menu and footer.
app.locals.pricePages = require('./data/price-pages');
app.get('/prices', (req, res) => {
  const breadcrumbs = [...res.locals.breadcrumbs, { name: 'Prices', url: '/prices' }];
  res.render('prices-index', {
    title: 'Cleaning Prices London & Essex | SN Cleaning Services',
    metaDescription: 'Cleaning prices from SN Cleaning Services in London and Essex: full price lists and calculators for end of tenancy cleaning and after builders cleaning.',
    breadcrumbs,
    designV2: true,
    ...aiPageDates(),
    structuredData: [...res.locals.structuredData, schema.buildBreadcrumbList(breadcrumbs)]
  });
});

// After builders prices page (Silvia, 25 Nov 2026): price by size, by the hour, or cleaners by the day.
app.get('/after-builders-cleaning/prices', (req, res) => {
  const prices = require('./data/after-builders-prices');
  const url = '/after-builders-cleaning/prices';
  const breadcrumbs = [
    ...res.locals.breadcrumbs,
    { name: 'After Builders Cleaning', url: '/after-builders-cleaning' },
    { name: 'Prices', url }
  ];
  const day = prices.hourlyRate * prices.fullDayHours;
  res.render('ab-prices', {
    title: 'After Builders Cleaning Prices London & Essex | Calculator',
    metaDescription:
      'After builders cleaning prices in London and Essex: by the size of an empty home, by the hour for one room, or cleaners by the day for builders. Calculator.',
    p: prices,
    breadcrumbs,
    designV2: true,
    ...aiPageDates(prices.PUBLISHED),
    structuredData: [
      ...res.locals.structuredData,
      schema.buildBreadcrumbList(breadcrumbs),
      schema.buildPriceListService({
        prices,
        url,
        service: 'After Builders Cleaning',
        extraOffers: [
          { name: 'After builders cleaning, one cleaner per hour', price: prices.hourlyRate },
          { name: `After builders cleaning, one cleaner for a day of ${prices.fullDayHours} hours`, price: day }
        ]
      }),
      schema.buildFaqPage(prices.faqs.map((i) => ({ question: i.q, answer: i.a })))
    ]
  });
});

// End of tenancy prices page (Silvia, 24 Nov 2026): the one page with prices per home size and per extra.
app.get('/end-of-tenancy-cleaning/prices', (req, res) => {
  const prices = require('./data/eot-prices');
  const url = '/end-of-tenancy-cleaning/prices';
  const breadcrumbs = [
    ...res.locals.breadcrumbs,
    { name: 'End of Tenancy Cleaning', url: '/end-of-tenancy-cleaning' },
    { name: 'Prices', url }
  ];
  res.render('eot-prices', {
    title: 'End of Tenancy Cleaning Prices London & Essex | Calculator',
    metaDescription:
      'End of tenancy cleaning prices for every flat and house size in London and Essex, with a calculator, worked examples, extras and what is included. No VAT added.',
    p: prices,
    breadcrumbs,
    designV2: true,
    ...aiPageDates(prices.PRICES_LAST_UPDATED),
    structuredData: [
      ...res.locals.structuredData,
      schema.buildBreadcrumbList(breadcrumbs),
      schema.buildPriceListService({ prices, url }),
      schema.buildFaqPage([...prices.sizeAnswers, ...prices.faqs].map((i) => ({ question: i.q, answer: i.a })))
    ]
  });
});

app.get('/:serviceSlug/faq', (req, res, next) => {
  const entry = SERVICE_FAQS[req.params.serviceSlug];
  if (!entry) return next();
  const faq = entry.data;
  const all = faq.groups.flatMap((g) => g.items);
  const plainFaq = (a) => String(a || '').replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');
  const breadcrumbs = [
    ...res.locals.breadcrumbs,
    { name: 'End of Tenancy Cleaning', url: `/${req.params.serviceSlug}` },
    { name: 'FAQ', url: `/${req.params.serviceSlug}/faq` }
  ];
  res.render('service-faq', {
    title: 'End of Tenancy Cleaning FAQ: Prices, Deposits and More',
    metaDescription:
      'End of tenancy cleaning questions answered: what is included, the oven, carpets, how long it takes, deposits, the Tenant Fees Act and all our guarantees.',
    faq,
    breadcrumbs,
    designV2: true,
    noindex: !entry.live,
    structuredData: [
      ...res.locals.structuredData,
      schema.buildBreadcrumbList(breadcrumbs),
      schema.buildFaqPage(all.map((i) => ({ question: i.q, answer: plainFaq(i.a) })))
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
    metaDescription: 'A look at the standard of work from SN Cleaning Services, serving homes across London and Essex.',
    gallery: GALLERY,
    breadcrumbs,
    structuredData: [...res.locals.structuredData, schema.buildBreadcrumbList(breadcrumbs)]
  });
});

app.get('/contact', (req, res) => {
  const breadcrumbs = [...res.locals.breadcrumbs, { name: 'Contact', url: '/contact' }];
  res.render('contact', {
    title: 'Contact and Customer Support',
    metaDescription:
      'Contact SN Cleaning Services: book online any time, WhatsApp 7am to 10pm weekdays, emails answered within 1 hour, 7 day re clean for empty properties.',
    success: false,
    error: null,
    breadcrumbs,
    structuredData: [
      ...res.locals.structuredData,
      schema.buildBreadcrumbList(breadcrumbs),
      { '@context': 'https://schema.org', '@type': 'ContactPage', name: 'Contact and Customer Support', url: 'https://sncleaningservices.co.uk/contact/' },
      schema.buildFaqPage(require('./data/customer-support').faqs)
    ]
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

// End of tenancy checklist. Registered before /:slug so the flat URL is not
// treated as a service page. The nested /end-of-tenancy-cleaning/checklist
// alias is a Netlify 301 only (netlify.toml), not an area route.
const eotChecklist = require('./data/eot-checklist');
const checklistApi = require('./lib/checklist-api-handler');

function useEotBooking(res) {
  const base = app.locals.bookUrl;
  res.locals.bookUrl = (slug) => base(slug || 'end-of-tenancy-cleaning');
}

app.get('/end-of-tenancy-cleaning-checklist', (req, res) => {
  useEotBooking(res);
  const breadcrumbs = [
    ...res.locals.breadcrumbs,
    { name: 'End of Tenancy Cleaning', url: '/end-of-tenancy-cleaning' },
    { name: 'Checklist', url: eotChecklist.PATH }
  ];
  const faqEntities = eotChecklist.faqs.map((item) => ({
    question: item.q,
    answer: item.a + (item.source ? ' Source: ' + item.source.name + ' (' + item.source.url + ').' : '')
  }));
  res.render('eot-checklist', {
    title: eotChecklist.TITLE,
    metaDescription: eotChecklist.META_DESCRIPTION,
    checklist: eotChecklist,
    breadcrumbs,
    designV2: true,
    webPageDateModified: eotChecklist.PUBLISHED,
    structuredData: [
      ...res.locals.structuredData,
      schema.buildBreadcrumbList(breadcrumbs),
      schema.buildChecklistArticle({
        headline: eotChecklist.H1,
        description: eotChecklist.META_DESCRIPTION,
        url: eotChecklist.PATH,
        date: eotChecklist.PUBLISHED,
        citations: eotChecklist.citations
      }),
      schema.buildChecklistHowTo({
        name: eotChecklist.H1,
        description: eotChecklist.META_DESCRIPTION,
        url: eotChecklist.PATH,
        sections: eotChecklist.howToSections
      }),
      schema.buildFaqPage(faqEntities)
    ].filter(Boolean)
  });
});

// Regular domestic checklist. Registered before /:slug so the flat URL is not
// treated as a service page. The nested /domestic-cleaning/checklist alias is
// a Netlify 301 only (netlify.toml), not an area route.
const domesticChecklist = require('./data/domestic-checklist');

function useDomesticBooking(res) {
  const base = app.locals.bookUrl;
  res.locals.bookUrl = (slug) => base(slug || 'domestic-cleaning');
}

app.get('/domestic-cleaning-checklist', (req, res) => {
  useDomesticBooking(res);
  const breadcrumbs = [
    ...res.locals.breadcrumbs,
    { name: 'Domestic Cleaning', url: '/domestic-cleaning' },
    { name: 'Checklist', url: domesticChecklist.PATH }
  ];
  const faqEntities = domesticChecklist.faqs.map((item) => ({
    question: item.q,
    answer: item.a
  }));
  res.render('domestic-checklist', {
    title: domesticChecklist.TITLE,
    metaDescription: domesticChecklist.META_DESCRIPTION,
    checklist: domesticChecklist,
    breadcrumbs,
    designV2: true,
    webPageDateModified: domesticChecklist.PUBLISHED,
    structuredData: [
      ...res.locals.structuredData,
      schema.buildBreadcrumbList(breadcrumbs),
      schema.buildChecklistArticle({
        headline: domesticChecklist.H1,
        description: domesticChecklist.META_DESCRIPTION,
        url: domesticChecklist.PATH,
        date: domesticChecklist.PUBLISHED
      }),
      schema.buildChecklistHowTo({
        name: domesticChecklist.H1,
        description: domesticChecklist.META_DESCRIPTION,
        url: domesticChecklist.PATH,
        sections: domesticChecklist.howToSections
      }),
      schema.buildFaqPage(faqEntities)
    ].filter(Boolean)
  });
});

async function checklistHttp(req, res) {
  try {
    const body = req.method === 'GET' || req.method === 'HEAD'
      ? ''
      : (typeof req.body === 'string' ? req.body : JSON.stringify(req.body || {}));
    const result = await checklistApi.handler({
      httpMethod: req.method,
      headers: req.headers,
      queryStringParameters: req.query || {},
      body
    });
    res.status(result.statusCode || 200);
    Object.entries(result.headers || {}).forEach(([key, value]) => res.set(key, value));
    res.send(result.body || '');
  } catch (err) {
    console.error('checklist route:', err && err.message ? err.message : 'failed');
    res.status(200).json({ ok: true, delivery: 'off', message: checklistApi.OFF_MESSAGE });
  }
}

app.all('/api/checklist', checklistHttp);
app.get('/checklist/report/:id', (req, res) => {
  req.query.report = req.params.id;
  return checklistHttp(req, res);
});

// Clean home report. Registered before /:slug so it is not treated as a service
// or legacy blog slug. Research page: no quote form, no booking button.
const CLEAN_HOME_H1 = 'The clean home: how a clean or messy home affects mood, stress, sleep and motivation';
const CLEAN_HOME_META = 'Published research on how a clean or messy home is linked with mood, stress, sleep and motivation, with a source for every figure. Read the report.';
const CLEAN_HOME_DATE = '2026-11-26T00:00:00+00:00';
// Visible article (standfirst, disclaimer, ten findings and body through methodology,
// excluding the sources list and the explorer, which repeats the findings).
// 4,258 words at 230 per minute, rounded.
const CLEAN_HOME_READING_MINUTES = 19;

app.get('/clean-home-report', (req, res) => {
  const breadcrumbs = [
    ...res.locals.breadcrumbs,
    { name: 'Blog', url: '/blog' },
    { name: 'The clean home report', url: '/clean-home-report' }
  ];
  res.render('clean-home-report', {
    title: 'Clean home report on mood and sleep',
    metaDescription: CLEAN_HOME_META,
    ogType: 'article',
    hideQuoteCta: true,
    bodyClass: 'is-chr-report',
    extraStylesheets: ['clean-home-report.css'],
    breadcrumbs,
    report: {
      h1: CLEAN_HOME_H1,
      date: CLEAN_HOME_DATE,
      dateLabel: '26 November 2026',
      readingMinutes: CLEAN_HOME_READING_MINUTES
    },
    webPageDateModified: CLEAN_HOME_DATE,
    structuredData: [
      ...res.locals.structuredData.map((block) => {
        if (!block || block['@type'] !== 'HomeAndConstructionBusiness') return block;
        const copy = { ...block };
        delete copy.hasOfferCatalog;
        delete copy.priceRange;
        return copy;
      }),
      schema.buildBreadcrumbList(breadcrumbs),
      schema.buildResearchReport({
        headline: CLEAN_HOME_H1,
        description: CLEAN_HOME_META,
        url: '/clean-home-report',
        date: CLEAN_HOME_DATE
      })
    ]
  });
});

// House cleaning time calculator. Registered before /:slug so the flat URL is
// not treated as a service page. Static guide: no Supabase area page, no form capture.
const timeCalc = require('./data/house-cleaning-time-calculator');
const timeCalcEngine = require('./public/js/house-cleaning-time-calculator');

app.get('/house-cleaning-time-calculator', (req, res) => {
  const base = app.locals.bookUrl;
  res.locals.bookUrl = (slug) => base(slug || 'domestic-cleaning');
  const breadcrumbs = [
    ...res.locals.breadcrumbs,
    { name: 'House cleaning time calculator', url: timeCalc.PATH }
  ];
  const faqEntities = timeCalc.faqs.map((item) => ({
    question: item.q,
    answer: item.a
  }));
  const initial = timeCalcEngine.estimate(timeCalc.DEFAULT_STATE, timeCalc.rateInputs());
  res.render('house-cleaning-time-calculator', {
    title: timeCalc.TITLE,
    metaDescription: timeCalc.META_DESCRIPTION,
    calc: timeCalc,
    initial,
    breadcrumbs,
    designV2: true,
    webPageDateModified: timeCalc.PUBLISHED,
    structuredData: [
      ...res.locals.structuredData,
      schema.buildBreadcrumbList(breadcrumbs),
      schema.buildFaqPage(faqEntities),
      schema.buildWebApplication({
        name: timeCalc.H1,
        description: timeCalc.META_DESCRIPTION,
        url: timeCalc.PATH,
        date: timeCalc.PUBLISHED
      })
    ].filter(Boolean)
  });
});

// End of tenancy cost calculator. Registered before /:slug, beside the time
// calculator, so the flat URL is not treated as a service page. Static guide:
// no Supabase area page, no form capture.
const eotCost = require('./data/end-of-tenancy-cleaning-cost-calculator');
const eotCostEngine = require('./public/js/end-of-tenancy-cleaning-cost-calculator');

app.get('/end-of-tenancy-cleaning-cost-calculator', (req, res) => {
  const base = app.locals.bookUrl;
  res.locals.bookUrl = (slug) => base(slug || 'end-of-tenancy-cleaning');
  const breadcrumbs = [
    ...res.locals.breadcrumbs,
    { name: 'End of tenancy cost calculator', url: eotCost.PATH }
  ];
  const faqEntities = eotCost.faqs.map((item) => ({
    question: item.q,
    answer: item.a
  }));
  const eotCatalogue = eotCost.catalogue();
  const eotInitial = eotCostEngine.estimate(eotCost.DEFAULT_STATE, eotCatalogue);
  res.render('end-of-tenancy-cleaning-cost-calculator', {
    title: eotCost.TITLE,
    metaDescription: eotCost.META_DESCRIPTION,
    calc: eotCost,
    catalogue: eotCatalogue,
    initial: eotInitial,
    breadcrumbs,
    designV2: true,
    webPageDateModified: eotCost.PUBLISHED,
    structuredData: [
      ...res.locals.structuredData,
      schema.buildBreadcrumbList(breadcrumbs),
      schema.buildFaqPage(faqEntities),
      schema.buildWebApplication({
        name: eotCost.H1,
        description: eotCost.META_DESCRIPTION,
        url: eotCost.PATH,
        date: eotCost.PUBLISHED
      })
    ].filter(Boolean)
  });
});

// Airbnb turnover checklist. Registered immediately before /:slug so the flat
// URL is not treated as a service page. Static page: no Supabase query here.
const airbnbChecklist = require('./data/airbnb-turnover-checklist');

function useAirbnbBooking(res) {
  const base = app.locals.bookUrl;
  res.locals.bookUrl = (slug) => base(slug || 'airbnb-cleaning');
}

app.get('/airbnb-turnover-cleaning-checklist', (req, res) => {
  useAirbnbBooking(res);
  const breadcrumbs = [
    ...res.locals.breadcrumbs,
    { name: 'Airbnb Cleaning', url: '/airbnb-cleaning' },
    { name: 'Checklist', url: airbnbChecklist.PATH }
  ];
  const faqEntities = airbnbChecklist.faqs.map((item) => ({
    question: item.q,
    answer: item.a
  }));
  res.render('airbnb-turnover-checklist', {
    title: airbnbChecklist.TITLE,
    metaDescription: airbnbChecklist.META_DESCRIPTION,
    checklist: airbnbChecklist,
    breadcrumbs,
    designV2: true,
    webPageDateModified: airbnbChecklist.PUBLISHED,
    structuredData: [
      ...res.locals.structuredData,
      schema.buildBreadcrumbList(breadcrumbs),
      schema.buildChecklistArticle({
        headline: airbnbChecklist.H1,
        description: airbnbChecklist.META_DESCRIPTION,
        url: airbnbChecklist.PATH,
        date: airbnbChecklist.PUBLISHED
      }),
      schema.buildChecklistHowTo({
        name: airbnbChecklist.H1,
        description: airbnbChecklist.META_DESCRIPTION,
        url: airbnbChecklist.PATH,
        sections: airbnbChecklist.howToSections
      }),
      schema.buildFaqPage(faqEntities)
    ].filter(Boolean)
  });
});

// After builders checklist. Registered immediately before /:slug, beside the
// Airbnb checklist, so the flat URL is not treated as a service page. Static
// page: no Supabase query here.
const afterBuildersChecklist = require('./data/after-builders-checklist');

function useAfterBuildersBooking(res) {
  const base = app.locals.bookUrl;
  res.locals.bookUrl = (slug) => base(slug || 'after-builders-cleaning');
}

app.get('/after-builders-cleaning-checklist', (req, res) => {
  useAfterBuildersBooking(res);
  const breadcrumbs = [
    ...res.locals.breadcrumbs,
    { name: 'After Builders Cleaning', url: '/after-builders-cleaning' },
    { name: 'Checklist', url: afterBuildersChecklist.PATH }
  ];
  const faqEntities = afterBuildersChecklist.faqs.map((item) => ({
    question: item.q,
    answer: item.a
  }));
  res.render('after-builders-checklist', {
    title: afterBuildersChecklist.TITLE,
    metaDescription: afterBuildersChecklist.META_DESCRIPTION,
    checklist: afterBuildersChecklist,
    breadcrumbs,
    designV2: true,
    webPageDateModified: afterBuildersChecklist.PUBLISHED,
    structuredData: [
      ...res.locals.structuredData,
      schema.buildBreadcrumbList(breadcrumbs),
      schema.buildChecklistArticle({
        headline: afterBuildersChecklist.H1,
        description: afterBuildersChecklist.META_DESCRIPTION,
        url: afterBuildersChecklist.PATH,
        date: afterBuildersChecklist.PUBLISHED
      }),
      schema.buildChecklistHowTo({
        name: afterBuildersChecklist.H1,
        description: afterBuildersChecklist.META_DESCRIPTION,
        url: afterBuildersChecklist.PATH,
        sections: afterBuildersChecklist.howToSections
      }),
      schema.buildFaqPage(faqEntities)
    ].filter(Boolean)
  });
});

// Deep cleaning checklist. Registered immediately before /:slug, right after
// the after builders checklist, so the flat URL is not treated as a service
// page. Static page: no Supabase query here.
const deepCleaningChecklist = require('./data/deep-cleaning-checklist');

function useDeepCleaningBooking(res) {
  const base = app.locals.bookUrl;
  res.locals.bookUrl = (slug) => base(slug || 'deep-house-cleaning');
}

app.get('/deep-cleaning-checklist', (req, res) => {
  useDeepCleaningBooking(res);
  const breadcrumbs = [
    ...res.locals.breadcrumbs,
    { name: 'Deep House Cleaning', url: '/deep-house-cleaning' },
    { name: 'Checklist', url: deepCleaningChecklist.PATH }
  ];
  const book = res.locals.bookUrl('deep-house-cleaning');
  const faqEntities = deepCleaningChecklist.faqs.map((item) => ({
    question: item.q,
    answer: item.a.split(deepCleaningChecklist.BOOK_TOKEN).join(book)
  }));
  res.render('deep-cleaning-checklist', {
    title: deepCleaningChecklist.TITLE,
    metaDescription: deepCleaningChecklist.META_DESCRIPTION,
    checklist: deepCleaningChecklist,
    breadcrumbs,
    designV2: true,
    webPageDateModified: deepCleaningChecklist.PUBLISHED,
    structuredData: [
      ...res.locals.structuredData,
      schema.buildBreadcrumbList(breadcrumbs),
      schema.buildChecklistArticle({
        headline: deepCleaningChecklist.H1,
        description: deepCleaningChecklist.META_DESCRIPTION,
        url: deepCleaningChecklist.PATH,
        date: deepCleaningChecklist.PUBLISHED
      }),
      schema.buildChecklistHowTo({
        name: deepCleaningChecklist.H1,
        description: deepCleaningChecklist.META_DESCRIPTION,
        url: deepCleaningChecklist.PATH,
        sections: deepCleaningChecklist.howToSections
      }),
      schema.buildFaqPage(faqEntities)
    ].filter(Boolean)
  });
});

// Carpet, sofa and mattress cost calculator. Registered immediately before
// /:slug so the flat URL is not treated as a service page. Static guide:
// no Supabase query here. WebPage JSON-LD is added by the layout.
const carpetCost = require('./data/carpet-cleaning-cost-calculator');
const carpetCostEngine = require('./public/js/carpet-cleaning-cost-calculator');

function useCarpetBooking(res) {
  const base = app.locals.bookUrl;
  res.locals.bookUrl = (slug) => base(slug || 'carpet-cleaning-services');
}

app.get('/carpet-cleaning-cost-calculator', (req, res) => {
  useCarpetBooking(res);
  const breadcrumbs = [
    ...res.locals.breadcrumbs,
    { name: 'Carpet Cleaning', url: '/carpet-cleaning-services' },
    { name: 'Cost Calculator', url: carpetCost.PATH }
  ];
  const faqEntities = carpetCost.faqs.map((item) => ({
    question: item.q,
    answer: item.a
  }));
  const carpetCatalogue = carpetCost.catalogue();
  const carpetInitial = carpetCostEngine.estimate(carpetCost.DEFAULT_STATE, carpetCatalogue);
  res.render('carpet-cleaning-cost-calculator', {
    title: carpetCost.TITLE,
    metaDescription: carpetCost.META_DESCRIPTION,
    calc: carpetCost,
    catalogue: carpetCatalogue,
    initial: carpetInitial,
    breadcrumbs,
    designV2: true,
    webPageDateModified: carpetCost.PUBLISHED,
    structuredData: [
      ...res.locals.structuredData,
      schema.buildBreadcrumbList(breadcrumbs),
      schema.buildFaqPage(faqEntities)
    ].filter(Boolean)
  });
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
  // The FAQ teaser (top questions of the service's live FAQ page) is shown with full answers under
  // the same FAQ heading (partials/faq-teaser.ejs), so the FAQPage schema lists those too: schema matches what is visible.
  const faqTeaser = app.locals.serviceFaqTeaser(page.slug);
  const faqPage = schema.buildFaqPage([...allFaqs, ...((faqTeaser && faqTeaser.items) || []).map((i) => ({ question: i.q, answer: i.a }))]);

  let mapLink = null;
  let localPages = [];
  if (v2) {
    const [areaPages, regions] = await Promise.all([content.getAreaPages(), content.getAllCoverageRegions()]);
    mapLink = buildMapLink(areaPages, regions, [page.slug], { onlyThese: true });
    // This service's local area pages, for the "Areas we cover" links.
    localPages = areaPages
      .filter((p) => p.services && p.services.slug === page.slug && p.coverage_regions && p.coverage_regions.level !== 'town')
      .map((p) => ({ name: plainPlaceName(p.coverage_regions.name), url: `/${page.slug}/${p.slug}` }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  const svcJobVideos = jobVideoLib.section(jobVideoLib.forService(await content.getJobVideos(), page.slug), page.slug, service.title);
  const pickedReviews = reviewsForService(testimonials, page.slug);
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
    pickedReviews,
    coverageAreas,
    breadcrumbs,
    ogImage: page.images && page.images.length ? schema.absoluteUrl(page.images[0]) : res.locals.ogImage,
    ...(AI_DATED_SERVICES.has(page.slug) ? aiPageDates() : {}),
    structuredData: schema.mergeReviewsIntoBusiness([
      ...res.locals.structuredData,
      schema.buildBreadcrumbList(breadcrumbs),
      schema.buildService({ service, page, coverageAreas }),
      ...(faqPage ? [faqPage] : []),
      ...jobVideoLib.buildVideoSchema(svcJobVideos.videos)
    ], pickedReviews)
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

// Per-page SEO overrides (data/seo-overrides.js). Applied after the CMS row is read, so they survive the daily CMS rewrite.
const seoOverrides = require('./data/seo-overrides');
const { guardAirbnbPrices } = require('./lib/price-guard');
function applyLeadOverride(original, ov) {
  let text = original;
  if (ov && ov.leadFirst && original && !original.startsWith(ov.leadFirst)) {
    if (ov.leadKeepOriginal) text = `${ov.leadFirst} ${original}`;
    else {
      const m = original.match(/^[\s\S]*?[.!?](?=\s+[A-Z]|\s*$)/);
      const rest = m ? original.slice(m[0].length).trim() : '';
      text = rest ? `${ov.leadFirst} ${rest}` : ov.leadFirst;
    }
  }
  // Exact sentence swaps in the hero intro. The override has no general body-text field;
  // this is only for a sentence that sits after the first one (the Newham Airbnb rate).
  if (ov && text && Array.isArray(ov.leadSwap)) {
    for (const pair of ov.leadSwap) {
      if (pair && pair[0] && text.includes(pair[0])) text = text.replace(pair[0], pair[1]);
    }
  }
  return text;
}
function applyPageOverrides(page, ov) {
  if (!ov) return page;
  let next = page;
  if (ov.quickAnswer) next = { ...next, quick_answer: ov.quickAnswer };
  else if (ov.leadFirst || (ov.leadSwap && ov.leadSwap.length)) next = { ...next, quick_answer: applyLeadOverride(next.quick_answer, ov) };
  if (ov.linkPhrases) next = applyLinkPhrasesToPage(next, ov.linkPhrases);
  return next;
}

// Adds a guide section and matching FAQ for one service+area key in seo-overrides.contentExtras.
// Rendered by the existing guide and FAQ markup, so only that page changes.
function applyContentExtras(page, serviceSlug) {
  const extra = seoOverrides.contentExtras && seoOverrides.contentExtras[`${serviceSlug}/${page.slug}`];
  if (!extra) return page;
  let next = page;
  if (Array.isArray(extra.sections) && extra.sections.length) {
    const existing = Array.isArray(next.content_sections) ? next.content_sections : [];
    const headings = new Set(existing.map((c) => c && c.heading));
    const add = extra.sections.filter((c) => c && c.heading && !headings.has(c.heading));
    if (add.length) next = { ...next, content_sections: existing.concat(add) };
  }
  if (Array.isArray(extra.faqs) && extra.faqs.length) {
    const existing = Array.isArray(next.faqs) ? next.faqs : [];
    const questions = new Set(existing.map((f) => f && f.question));
    const add = extra.faqs.filter((f) => f && f.question && !questions.has(f.question));
    if (add.length) next = { ...next, faqs: existing.concat(add) };
  }
  return next;
}

async function renderArea(req, res, next, areaSlug) {
  // Airbnb changeover price corrected after the CMS row is read (lib/price-guard.js), so text and FAQ schema match the booking form.
  const page = guardAirbnbPrices(await content.getAreaPageBySlug(req.params.serviceSlug, areaSlug));
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
    const areaName = (r) => r ? plainPlaceName(r.display_name || String(r.name).replace(/^Essex - /, '').replace(/\s*\/.*$/, '')) : '';
    const place = areaName(region);
    const ov = seoOverrides.pages[`${service.slug}/${page.slug}`] || null;
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
    const pageWithCopy = plainContent(applyContentExtras(page, service.slug));
    const faqs = pageWithCopy.faqs || [];
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
    // Neighbouring areas to show first (data/seo-overrides.js nearbyFirst); only published pages of this service are used.
    const firstLinks = (seoOverrides.nearbyFirst[`${service.slug}/${page.slug}`] || [])
      .map((slug) => svcPages.find((ap) => ap.slug === slug && ap.id !== page.id)).filter(Boolean).map(link);
    if (firstLinks.length) nearbyLinks = [...firstLinks, ...nearbyLinks.filter((l) => !firstLinks.some((f) => f.url === l.url))];
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
    const recentCleans = jobVideoLib.recentCleans(await content.getJobVideos(), page.postcodes, place,
      areaJobVideos.videos.map((v) => v.id), editorContent.editorPosts('case').filter((c) => !c.noindex));
    const pickedReviews = reviewsForArea(testimonials, service.slug, place);
        return res.render('area-v2', {
      jobVideos: areaJobVideos,
      recentCleans,
      mapLink,
      mapCopy,
      mini,
      nearbyLinks,
      directory,
      video,
      designV2: true,
      heroPreload: serviceImage(service.slug),
      // Title format (keyword first, then trust; no price in organic titles, Silvia 16 Nov 2026): fits Google's ~60 characters.
      title: plainPlaceName((ov && ov.title) || [`${service.title} ${place} | 5★ Rated on Google`, `${service.title} ${place} | 5★ Rated`, `${service.title} ${place}`].find((t) => t.length <= 60) || `${service.title} ${place}`),
      metaDescription: plainPlaceName((ov && ov.metaDescription) || page.meta_description || `${service.title} in ${place}.`),
      h1Override: ov && ov.h1 ? plainPlaceName(ov.h1) : null,
      page: plainContent(applyPageOverrides(pageWithCopy, ov)),
      region, service: fullService, parent, place,
      servicePage: servicePage || {},
      parentLink: parentPage ? { name: areaName(parent), url: pageUrl(parentPage) } : null,
      nearby: nearby.map((ap) => ({ name: areaName(ap.coverage_regions), url: pageUrl(ap) })).sort((a, b) => a.name.localeCompare(b.name)),
      children: children.map((ap) => ({ name: areaName(ap.coverage_regions), url: pageUrl(ap) })).sort((a, b) => a.name.localeCompare(b.name)),
      otherServices,
      testimonials,
      pickedReviews,
      breadcrumbs: crumbs,
      structuredData: schema.mergeReviewsIntoBusiness([
        ...res.locals.structuredData,
        schema.buildBreadcrumbList(crumbs),
        schema.buildServiceAreaPage({ service, page: pageWithCopy, region }),
        ...(faq ? [faq] : []),
        ...jobVideoLib.buildVideoSchema(areaJobVideos.videos),
        ...jobVideoLib.buildVideoSchema(recentCleans)
      ], pickedReviews)
    });
  }

  // Other area pages for this SAME service under the same parent borough —
  // internal linking between nearby areas for the same service, rather than
  // each page sitting isolated.
  const relatedAreas = areaPagesForService
    .filter((ap) => ap.id !== page.id && ap.coverage_regions && ap.coverage_regions.parent_id === region.parent_id)
    .map((ap) => ({ name: plainPlaceName(ap.coverage_regions.name), url: `/${service.slug}/${ap.slug}` }));

  const breadcrumbs = [
    ...res.locals.breadcrumbs,
    { name: service.title, url: `/${service.slug}` },
    { name: plainPlaceName(region.name), url: `/${service.slug}/${page.slug}` }
  ];
  const faqPage = schema.buildFaqPage(page.faqs);

  res.render('area-detail', {
    title: plainPlaceName(page.meta_title || `${service.title} in ${region.name}`),
    metaDescription: plainPlaceName(page.meta_description || `${service.title} in ${region.name}.`),
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
      schema.buildServiceAreaPage({ service, page: plainContent(page), region }),
      ...(faqPage ? [faqPage] : [])
    ]
  });
}

// ---------- 404 ----------
app.use((req, res) => {
  res.status(404).render('404', { title: 'Page Not Found', noindex: true, omitCanonical: true, structuredData: [] });
});

// Only start a listening server when run directly (local dev / traditional Node hosting).
// When required by scripts/prerender.js for a Netlify static build, we just need the app object.
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`SN Cleaning Services website running at http://localhost:${PORT}`);
  });
}

module.exports = app;
