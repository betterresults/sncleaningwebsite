require('dotenv').config();
const express = require('express');
const expressLayouts = require('express-ejs-layouts');
const bodyParser = require('body-parser');
const path = require('path');
const nodemailer = require('nodemailer');

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

// Make current path + site-wide data available to every view
app.use((req, res, next) => {
  res.locals.currentPath = req.path;
  res.locals.site = {
    name: 'SN Cleaning Services',
    phone: '+44 (0)20 3835 5033',
    email: 'info@sncleaningservices.co.uk',
    address: 'Serving London & Essex',
    hours: 'Phone: Mon - Sat, 8am - 5pm · WhatsApp: Mon - Sun, 8am - 9pm',
    social: {
      facebook: 'https://facebook.com',
      instagram: 'https://instagram.com'
    }
  };
  next();
});

// ---------- Data ----------
const content = require('./data/content'); // live content from Supabase (services, service pages, blog)
const testimonials = require('./data/testimonials');
const checklist = require('./data/checklist');

// Every page needs the services list to build the "Services ▾" nav dropdown,
// and every service page needs to know which slugs have a full detail page.
app.use(async (req, res, next) => {
  try {
    const [services, servicePages] = await Promise.all([content.getServices(), content.getServicePages()]);
    const detailSlugs = new Set(servicePages.map((p) => p.slug));
    res.locals.navServices = services.map((s) => ({
      ...s,
      hasDetailPage: detailSlugs.has(s.slug)
    }));
    next();
  } catch (err) {
    console.error('Error loading nav services:', err);
    res.locals.navServices = [];
    next();
  }
});

// ---------- Routes ----------
app.get('/', async (req, res) => {
  const services = await content.getServices();
  res.render('index', {
    title: 'Home',
    services: services.slice(0, 6),
    testimonials
  });
});

app.get('/services', async (req, res) => {
  const [services, servicePages] = await Promise.all([content.getServices(), content.getServicePages()]);
  const detailSlugs = new Set(servicePages.map((p) => p.slug));
  res.render('services', {
    title: 'Our Services',
    services: services.map((s) => ({ ...s, hasDetailPage: detailSlugs.has(s.slug) })),
    checklist
  });
});

// Individual service page — one shared template, content pulled from Supabase.
app.get('/services/:slug', async (req, res, next) => {
  const page = await content.getServicePageBySlug(req.params.slug);
  if (!page) return next(); // falls through to 404 handler

  const [allServices, coverageAreas] = await Promise.all([content.getServices(), content.getCoverageAreas()]);
  const relatedServices = allServices.filter((s) => s.slug !== page.slug).slice(0, 3);

  res.render('service-detail', {
    title: page.meta_title || page.services.title,
    metaDescription: page.meta_description || page.services.short_description,
    page,
    service: page.services,
    relatedServices,
    testimonials,
    coverageAreas
  });
});

app.get('/blog', async (req, res) => {
  const posts = await content.getBlogPosts();
  res.render('blog/index', {
    title: 'Blog',
    posts
  });
});

app.get('/blog/:slug', async (req, res, next) => {
  const post = await content.getBlogPostBySlug(req.params.slug);
  if (!post) return next();

  res.render('blog/post', {
    title: post.title,
    metaDescription: post.excerpt,
    post
  });
});

app.get('/about', (req, res) => {
  res.render('about', {
    title: 'About Us'
  });
});

app.get('/gallery', (req, res) => {
  res.render('gallery', {
    title: 'Gallery'
  });
});

app.get('/contact', (req, res) => {
  res.render('contact', {
    title: 'Contact Us',
    success: false,
    error: null
  });
});

app.get('/contact/success', (req, res) => {
  res.render('thank-you', {
    title: 'Thank You'
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

// ---------- 404 ----------
app.use((req, res) => {
  res.status(404).render('404', { title: 'Page Not Found' });
});

// Only start a listening server when run directly (local dev / traditional Node hosting).
// When required by scripts/prerender.js for a Netlify static build, we just need the app object.
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`SN Cleaning Services website running at http://localhost:${PORT}`);
  });
}

module.exports = app;
