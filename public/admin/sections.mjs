// Ready made sections for the "+ Add section" library (SN Cleaning Services design).
// Every word, photo and colour can be changed in the editor after adding.
const icon = (p) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${p}</svg>`;
const SHIELD = icon('<path d="M12 3 4 6v6c0 5 3.4 8.3 8 9 4.6-.7 8-4 8-9V6l-8-3z"/><path d="m9 12 2 2 4-4"/>');
const TEAM = icon('<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c.6-3.6 3.2-5.5 6.5-5.5s5.9 1.9 6.5 5.5"/><path d="M16 4.8a3.3 3.3 0 0 1 0 6.4M18 14.8c2 .6 3.2 2.3 3.5 5.2"/>');
const REDO = icon('<path d="M4 12a8 8 0 0 1 14-5.3L20 9"/><path d="M20 4v5h-5"/><path d="M20 12a8 8 0 0 1-14 5.3L4 15"/>');
const STARS = "&#9733;&#9733;&#9733;&#9733;&#9733;";
const BTN = '<a class="ps-btn" href="https://app.sncleaningservices.co.uk/book/sn-cleaning-services/main-landing">Get a quote</a>';

export const SECTIONS = [
  { id: "video", name: "Text and video", desc: "Your text on one side, a video on the other.", thumb: "split-video",
    html: `<section class="ps-sec"><div class="ps-wrap ps-split">
<div class="ps-copy"><p class="ps-eyebrow">See us at work</p><h2>Watch how we clean</h2>
<p class="ps-lead">A short look at our own team and the care we take on every visit.</p>
<p>Our cleaners are insured and DBS checked, and we bring professional products and equipment.</p>${BTN}</div>
<div class="ps-video"><iframe src="https://www.youtube-nocookie.com/embed/G8cOOI3hErg" title="Domestic cleaning in Essex by our in house trained cleaners" loading="lazy" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe></div>
</div></section>` },
  { id: "photo-text", name: "Photo and text", desc: "A photo on one side and your text on the other.", thumb: "split-photo",
    html: `<section class="ps-sec"><div class="ps-wrap ps-split">
<div class="ps-media"><img src="/images/about-cleaner.jpg" alt="SN Cleaning Services cleaner at work" loading="lazy"></div>
<div class="ps-copy"><p class="ps-eyebrow">Our team</p><h2>Our own cleaners, never subcontractors</h2>
<p class="ps-lead">Every cleaner is insured, DBS checked and trained by us before their first visit.</p>
<p>Where possible we send the same cleaner each time, so they get to know your home and how you like things done.</p>${BTN}</div>
</div></section>` },
  { id: "photo-text-right", name: "Text and photo", desc: "Your text first, with the photo on the right.", thumb: "split-photo-r",
    html: `<section class="ps-sec"><div class="ps-wrap ps-split">
<div class="ps-copy"><p class="ps-eyebrow">Our promise</p><h2>Missed something? We come back free</h2>
<p class="ps-lead">Tell us within 24 hours and we come back to re-clean it at no cost.</p>
<p>Every clean follows a checklist for each room, so nothing is left to chance.</p></div>
<div class="ps-media"><img src="/images/services/deep.jpg" alt="Deep cleaned kitchen" loading="lazy"></div>
</div></section>` },
  { id: "gallery", name: "Photo gallery", desc: "A grid of six photos. Duplicate a photo to add more.", thumb: "gallery",
    html: `<section class="ps-sec"><div class="ps-wrap">
<div class="ps-head"><h2>Our recent work</h2><p>A few of the homes we have cleaned in London and Essex.</p></div>
<div class="ps-gallery">
<figure><img src="/images/services/deep.jpg" alt="Deep cleaning" loading="lazy"><figcaption>Deep clean</figcaption></figure>
<figure><img src="/images/services/tenancy.jpg" alt="End of tenancy cleaning" loading="lazy"><figcaption>End of tenancy</figcaption></figure>
<figure><img src="/images/services/domestic.jpg" alt="Domestic cleaning" loading="lazy"><figcaption>Domestic</figcaption></figure>
<figure><img src="/images/services/airbnb.jpg" alt="Airbnb cleaning" loading="lazy"><figcaption>Airbnb</figcaption></figure>
<figure><img src="/images/services/builders.jpg" alt="After builders cleaning" loading="lazy"><figcaption>After builders</figcaption></figure>
<figure><img src="/images/services/carpet.jpg" alt="Carpet cleaning" loading="lazy"><figcaption>Carpet</figcaption></figure>
</div></div></section>` },
  { id: "before-after", name: "Before and after", desc: "Two photos side by side with labels.", thumb: "before-after",
    html: `<section class="ps-sec ps-tint"><div class="ps-wrap">
<div class="ps-head"><h2>Before and after</h2><p>The difference a proper clean makes.</p></div>
<div class="ps-ba">
<figure><span class="ps-tag">Before</span><img src="/images/services/builders.jpg" alt="Before cleaning" loading="lazy"></figure>
<figure><span class="ps-tag ps-tag-alt">After</span><img src="/images/services/deep.jpg" alt="After cleaning" loading="lazy"></figure>
</div></div></section>` },
  { id: "features", name: "Three feature cards", desc: "Three points with icons.", thumb: "cards",
    html: `<section class="ps-sec"><div class="ps-wrap">
<div class="ps-head"><h2>Why people choose us</h2><p>12 years cleaning homes across London and Essex.</p></div>
<div class="ps-cards">
<div>${SHIELD}<h3>Insured and DBS checked</h3><p>Every cleaner is vetted, insured and trained by us.</p></div>
<div>${TEAM}<h3>Our own team</h3><p>Never subcontractors, so the standard stays the same.</p></div>
<div>${REDO}<h3>Free re clean</h3><p>Missed something? Tell us within 24 hours and we come back.</p></div>
</div></div></section>` },
  { id: "stats", name: "Numbers", desc: "Four big numbers.", thumb: "stats",
    html: `<section class="ps-sec"><div class="ps-wrap"><div class="ps-stats">
<div><strong>12</strong><span>years in business</span></div>
<div><strong>5.0</strong><span>rating on Google</span></div>
<div><strong>32</strong><span>London boroughs covered</span></div>
<div><strong>100%</strong><span>our own staff</span></div>
</div></div></section>` },
  { id: "steps", name: "How it works", desc: "Three numbered steps.", thumb: "steps",
    html: `<section class="ps-sec ps-tint"><div class="ps-wrap">
<div class="ps-head ps-center"><h2>How it works</h2></div>
<ol class="ps-steps">
<li><span>1</span><h3>Tell us what you need</h3><p>Choose your service and enter your postcode.</p></li>
<li><span>2</span><h3>Get your price</h3><p>See your price online, or we send a quote the same weekday.</p></li>
<li><span>3</span><h3>Enjoy a clean home</h3><p>Our own team arrives with everything needed.</p></li>
</ol></div></section>` },
  { id: "reviews", name: "Reviews", desc: "Three client reviews with stars.", thumb: "reviews",
    html: `<section class="ps-sec ps-tint"><div class="ps-wrap">
<div class="ps-head"><h2>What our clients say</h2><p>Real reviews from our clients on Google.</p></div>
<div class="ps-reviews">
<figure><div class="ps-stars" aria-label="5 stars">${STARS}</div><blockquote>&ldquo;Wonderful cleaners and excellent customer service! They&rsquo;ve helped us do an end of tenancy clean and a deep clean as well as regular cleanings, and they&rsquo;ve been great all around.&rdquo;</blockquote><figcaption>Sarah S. &middot; Google review</figcaption></figure>
<figure><div class="ps-stars" aria-label="5 stars">${STARS}</div><blockquote>&ldquo;I had a great experience with SN Cleaning Services! They arrived right on time; the service was excellent, thorough and efficient.&rdquo;</blockquote><figcaption>Qingzi J. &middot; Google review</figcaption></figure>
<figure><div class="ps-stars" aria-label="5 stars">${STARS}</div><blockquote>&ldquo;Cleaning service is reliable and efficient. Happy to recommend Silvia Nedeva and her team.&rdquo;</blockquote><figcaption>Sally W. &middot; Google review</figcaption></figure>
</div></div></section>` },
  { id: "faq", name: "Questions and answers", desc: "Questions that open and close.", thumb: "faq",
    html: `<section class="ps-sec"><div class="ps-wrap ps-faq">
<div><h2>Questions</h2><p class="ps-lead">Can&rsquo;t find your answer? Message us on WhatsApp.</p></div>
<div class="ps-faq-list">
<details><summary>Do you bring cleaning products?</summary><p>Yes. We bring professional products and equipment to every clean.</p></details>
<details><summary>Are your cleaners insured and DBS checked?</summary><p>Yes. Every cleaner is our own staff, insured, DBS checked and trained by us.</p></details>
<details><summary>What areas do you cover?</summary><p>London and Essex. Send your postcode and we will confirm.</p></details>
</div></div></section>` },
  { id: "text", name: "Text block", desc: "A heading with two columns of text.", thumb: "text",
    html: `<section class="ps-sec"><div class="ps-wrap ps-text">
<h2>A clean you can rely on</h2>
<div class="ps-cols"><p>Every home is different, so we start by finding out what matters most to you, then agree a checklist for your home.</p><p>From there, the same standard is followed on every visit, and you always know who to talk to.</p></div>
</div></section>` },
  { id: "banner", name: "Photo banner", desc: "A wide photo with a heading and button on top.", thumb: "banner",
    html: `<section class="ps-sec"><div class="ps-wrap"><div class="ps-banner"><img src="/images/hero-living-room.jpg" alt="" loading="lazy">
<div class="ps-banner-copy"><h2>Come home to a properly clean home</h2><p>Domestic, end of tenancy and deep cleaning across London and Essex.</p>${BTN}</div>
</div></div></section>` },
  { id: "cta", name: "Call to action", desc: "A coloured band with a heading and one button.", thumb: "cta",
    html: `<section class="ps-sec"><div class="ps-wrap"><div class="ps-cta">
<div><h2>Ready for a cleaner you can rely on?</h2><p>Choose your service and see your price online.</p></div>${BTN}
</div></div></section>` }
];

const W = (inner) => `<svg viewBox="0 0 120 72" aria-hidden="true"><rect width="120" height="72" rx="6" fill="#f4f1eb"/>${inner}</svg>`;
const L = (x, y, w, c = "#cfd8d5", h = 4) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="2" fill="${c}"/>`;
const G = "#1f6b66", A = "#f4a300";
export const THUMBS = {
  "split-video": W(L(10, 18, 40, G, 6) + L(10, 30, 44) + L(10, 38, 36) + L(10, 50, 22, G, 7) + `<rect x="62" y="14" width="48" height="44" rx="5" fill="${G}"/><path d="M82 29v14l12-7z" fill="#fff"/>`),
  "split-photo": W(`<rect x="10" y="14" width="48" height="44" rx="5" fill="#9fbfb9"/>` + L(66, 20, 40, G, 6) + L(66, 32, 44) + L(66, 40, 36) + L(66, 50, 22, G, 7)),
  "split-photo-r": W(L(10, 20, 40, G, 6) + L(10, 32, 44) + L(10, 40, 36) + `<rect x="62" y="14" width="48" height="44" rx="5" fill="#9fbfb9"/>`),
  gallery: W([0, 1, 2].flatMap((c) => [0, 1].map((r) => `<rect x="${10 + c * 35}" y="${10 + r * 27}" width="30" height="23" rx="3" fill="#9fbfb9"/>`)).join("")),
  "before-after": W(`<rect x="10" y="14" width="48" height="44" rx="4" fill="#b9b3a5"/><rect x="62" y="14" width="48" height="44" rx="4" fill="#9fbfb9"/>` + L(14, 18, 16, G, 6) + L(66, 18, 16, A, 6)),
  cards: W([0, 1, 2].map((i) => `<rect x="${8 + i * 36}" y="14" width="32" height="44" rx="4" fill="#fff"/><rect x="${13 + i * 36}" y="20" width="8" height="8" rx="2" fill="${G}"/>` + L(13 + i * 36, 34, 22, G) + L(13 + i * 36, 42, 18)).join("")),
  stats: W([0, 1, 2, 3].map((i) => L(12 + i * 26, 26, 16, G, 10) + L(10 + i * 26, 42, 20)).join("")),
  steps: W([0, 1, 2].map((i) => `<circle cx="${24 + i * 36}" cy="26" r="7" fill="${G}"/>` + L(14 + i * 36, 40, 20, G) + L(12 + i * 36, 48, 24)).join("")),
  reviews: W([0, 1, 2].map((i) => `<rect x="${8 + i * 36}" y="14" width="32" height="44" rx="4" fill="#fff"/>` + L(12 + i * 36, 20, 16, A) + L(12 + i * 36, 30, 24) + L(12 + i * 36, 36, 20)).join("")),
  faq: W(L(10, 16, 30, G, 6) + L(10, 28, 32) + [0, 1, 2].map((i) => `<rect x="50" y="${12 + i * 17}" width="60" height="13" rx="3" fill="#fff"/>` + L(54, 16 + i * 17, 36, G)).join("")),
  text: W(L(10, 16, 34, G, 6) + [0, 1, 2, 3].map((i) => L(56, 16 + i * 9, 24) + L(84, 16 + i * 9, 26)).join("")),
  banner: W(`<rect x="8" y="10" width="104" height="52" rx="6" fill="#3d6f69"/>` + L(18, 24, 50, "#fff", 6) + L(18, 36, 40, "#d7e6e3") + L(18, 46, 22, A, 7)),
  cta: W(`<rect x="8" y="18" width="104" height="36" rx="8" fill="${G}"/>` + L(18, 28, 44, "#fff", 6) + L(18, 40, 36, "#9fbfb9") + L(80, 31, 24, "#fff", 9))
};
