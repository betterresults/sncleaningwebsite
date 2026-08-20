# SN Cleaning Services Website

A Node.js (Express + EJS) website for SN Cleaning Services — a residential & commercial cleaning company.

## Pages

- **Home** — hero, services preview, why-us, testimonials, call to action
- **Services** — full list of services with descriptions and features
- **About** — company story and values
- **Gallery** — placeholder gallery grid (swap in real photos)
- **Contact** — enquiry form (Netlify Forms in production; posts to `/contact` with optional SMTP email when self-hosted)

## Getting Started

```bash
npm install
cp .env.example .env   # optional: fill in SMTP details to enable email sending
npm run dev             # starts with nodemon on http://localhost:3000
# or
npm start
```

## Project Structure

```
server.js              Express app & routes
data/services.js        Service listings (edit here to add/remove services)
data/testimonials.js    Customer testimonials
views/                   EJS templates
  layouts/main.ejs        Shared page layout
  partials/                Header & footer
public/
  css/style.css            All site styling
  js/main.js               Mobile nav + small UX helpers
```

## Editing Content

- **Business details** (phone, email, address, hours, socials): edit `res.locals.site` in `server.js`.
- **Services**: edit `data/services.js`.
- **Testimonials**: edit `data/testimonials.js`.
- **Gallery photos**: replace the placeholder tiles in `views/gallery.ejs` with real images from `public/images/`.

## Contact Form

In production (Netlify), the form is handled entirely by **Netlify Forms** — no backend needed.
It's detected automatically from the `data-netlify="true"` form in `views/contact.ejs` at deploy
time. Submissions show up in your Netlify dashboard under **Site → Forms**, and you can turn on
an email notification there (Site configuration → Forms → Notifications).

When running locally with `npm run dev`/`npm start` (not on Netlify), the form still posts to
`/contact` in `server.js`, which logs the submission to the console, or sends a real email if
`SMTP_HOST`, `SMTP_USER`, `SMTP_PASS` and `CONTACT_TO` are set in `.env` (see `.env.example`).

## Deployment

### Netlify (recommended — this repo is set up for it)

The site is pre-rendered to static HTML at build time (`npm run build` → `scripts/prerender.js`
runs the Express app locally and saves every page to `/dist`), so Netlify just serves static
files — fast, free, and no server to maintain.

1. Log in to [app.netlify.com](https://app.netlify.com) → **Add new site → Import an existing project**.
2. Choose **GitHub** and select the `sncleaningwebsite` repo (authorize Netlify's GitHub app if asked).
3. Build settings (should be auto-detected from `netlify.toml`, but confirm):
   - **Build command:** `npm run build`
   - **Publish directory:** `dist`
4. Click **Deploy site**. Netlify gives you a `*.netlify.app` URL immediately; add your own domain
   under **Domain management** whenever you're ready.
5. Every future `git push` to `main` automatically triggers a new deploy.

To preview the exact static build locally before pushing:
```bash
npm run build
npx serve dist
```

### Alternative: any Node host

Since `server.js` still exports a working Express app, it can also run as a normal always-on
Node server (Render, Railway, Fly.io, a VPS, etc.) instead of the static Netlify build — just
run `npm start` and set the `PORT` environment variable if your host requires a specific one.
