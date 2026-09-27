// Legal pages: /privacy-policy, /terms-and-conditions, /cookies-policy.
// Plain HTML content rendered by views/legal.ejs. Keep every statement true to
// how the site and business actually work; update the "Last updated" date when editing.
const UPDATED = '25 September 2026';
const EMAIL = 'info@sncleaningservices.co.uk';

module.exports = {
  'privacy-policy': {
    title: 'Privacy Policy',
    metaDescription: 'How SN Cleaning Services collects, uses and protects your personal information when you visit our website, ask for a quote or book a clean.',
    updated: UPDATED,
    content: `
<p>This policy explains how SN Cleaning Services ("we", "us") collects and uses personal information when you use sncleaningservices.co.uk, ask for a quote, book a clean or apply to work with us. We are the data controller for this information. If you have any questions, email <a href="mailto:${EMAIL}">${EMAIL}</a>.</p>

<h2>What information we collect</h2>
<ul>
  <li><strong>Quote and contact forms:</strong> your name, email address, phone number, postcode and the details you give us about the property and the clean you need.</li>
  <li><strong>Bookings:</strong> the information you enter in our online booking form, such as your address, property details, the date you choose and your contact details.</li>
  <li><strong>Messages:</strong> anything you send us by email, phone or WhatsApp.</li>
  <li><strong>Job applications:</strong> the information you give us when you apply to work as a cleaner, such as your contact details, experience, availability and right-to-work and DBS information.</li>
  <li><strong>Technical information:</strong> like any website, the servers that host our site receive your IP address and basic browser information when you visit.</li>
</ul>

<h2>How we use your information</h2>
<ul>
  <li>To reply to your enquiry and give you a price.</li>
  <li>To arrange, carry out and follow up on your clean, including sending confirmations, reminders and invoices.</li>
  <li>To handle any re-clean request, complaint or question about a job.</li>
  <li>To assess job applications and contact applicants.</li>
  <li>To keep financial records we are required to keep by law.</li>
</ul>
<p>We do not sell your information, and we do not use it for marketing unless you have asked to hear from us.</p>

<h2>Our legal basis</h2>
<ul>
  <li><strong>Contract:</strong> when you ask for a quote or book a clean, we use your information to take steps at your request and to provide the service.</li>
  <li><strong>Legal obligation:</strong> we keep invoices and payment records because tax law requires it.</li>
  <li><strong>Legitimate interests:</strong> we use your information to run our business sensibly, for example to answer questions, deal with complaints and keep our website secure.</li>
</ul>

<h2>Who we share it with</h2>
<p>We only share your information with services that help us run the business, and only as much as they need:</p>
<ul>
  <li><strong>Netlify:</strong> hosts this website and receives the forms you submit on it.</li>
  <li><strong>Our booking system:</strong> stores the bookings made through our online booking form so we can manage your clean.</li>
  <li><strong>Our invoicing software:</strong> used to create quotes and invoices.</li>
  <li><strong>WhatsApp:</strong> if you choose to message us there.</li>
  <li><strong>Google Fonts:</strong> our website loads its fonts from Google, which receives your IP address when the page loads.</li>
  <li><strong>AI assistance:</strong> job applications may be reviewed with the help of an AI tool to summarise and score them. A person at SN Cleaning Services makes every hiring decision.</li>
  <li><strong>Our cleaners:</strong> receive the address and details they need to do your clean.</li>
</ul>
<p>Some of these providers may process data outside the UK. Where they do, they are required to protect it to the standard UK law expects.</p>

<h2>How long we keep it</h2>
<p>We keep enquiry details for as long as we need them to deal with your request. We keep customer and booking records while you use our services and afterwards for as long as we need them for tax and accounting purposes. We keep application details for as long as the recruitment process needs them. After that we delete them.</p>

<h2>Your rights</h2>
<p>Under UK data protection law you can ask us to:</p>
<ul>
  <li>give you a copy of the personal information we hold about you;</li>
  <li>correct information that is wrong;</li>
  <li>delete your information, where we don't need to keep it;</li>
  <li>restrict or object to how we use it.</li>
</ul>
<p>Email <a href="mailto:${EMAIL}">${EMAIL}</a> and we will reply within one month. If you are unhappy with how we have handled your information, you can complain to the Information Commissioner's Office (ICO) at ico.org.uk.</p>

<h2>Cookies</h2>
<p>See our <a href="/cookies-policy/">Cookies Policy</a> for how this website uses cookies and similar technology.</p>

<h2>Changes to this policy</h2>
<p>We may update this policy from time to time. The date at the top shows when it was last changed.</p>
`
  },

  'cookies-policy': {
    title: 'Cookies Policy',
    metaDescription: 'Which cookies and similar technology the SN Cleaning Services website uses, and how to control them.',
    updated: UPDATED,
    content: `
<p>Cookies are small files a website saves in your browser. This page explains what our website uses and why.</p>

<h2>Cookies we set</h2>
<p>Our website does not set advertising or analytics cookies, and we do not track you across other websites.</p>
<p>To make pages load faster, the site stores a small note in your browser's session storage once the booking form has been pre-loaded. It contains no personal information and is cleared when you close the browser tab.</p>

<h2>Cookies set by other services</h2>
<ul>
  <li><strong>Booking form:</strong> our online booking form is embedded from our booking system. It may use cookies or browser storage that it needs to work, for example to keep your answers while you fill it in.</li>
  <li><strong>Google Fonts:</strong> our fonts load from Google's servers. Google receives your IP address but does not set cookies for this.</li>
  <li><strong>Links to other sites:</strong> if you click through to WhatsApp or Google reviews, those sites use their own cookies under their own policies.</li>
</ul>

<h2>How to control cookies</h2>
<p>You can block or delete cookies in your browser settings. If you block the ones the booking form needs, the form may not work, but you can still reach us by phone, email or WhatsApp.</p>

<h2>Questions</h2>
<p>Email <a href="mailto:${EMAIL}">${EMAIL}</a>. For how we use personal information, see our <a href="/privacy-policy/">Privacy Policy</a>.</p>
`
  },

  'terms-and-conditions': {
    title: 'Terms and Conditions',
    metaDescription: 'The terms for using the SN Cleaning Services website and for quotes and bookings with our cleaning team in London and Essex.',
    updated: UPDATED,
    content: `
<p>These terms cover your use of sncleaningservices.co.uk and the quotes and bookings you make with SN Cleaning Services ("we", "us"). By using the website or booking a clean, you agree to them. Questions: <a href="mailto:${EMAIL}">${EMAIL}</a>.</p>

<h2>Prices and quotes</h2>
<ul>
  <li>Prices on this website are "from" prices. Your exact price depends on the size and condition of the property and the service you choose.</li>
  <li>The price shown by our booking form, or the quote we send you, is the price for the job as described. If the property or the work needed is very different from the description, we will talk to you before doing extra work.</li>
</ul>

<h2>Bookings</h2>
<ul>
  <li>A booking is confirmed when you receive our confirmation. Any specific arrangements for your booking, such as access, timings and payment, are set out in that confirmation.</li>
  <li>Please make sure we can get into the property at the booked time, and that the electricity and hot water are on.</li>
  <li>If you need to change or cancel a booking, tell us as early as you can.</li>
</ul>

<h2>Our work and re-cleans</h2>
<ul>
  <li>Our cleaners are our own trained team. They are insured and DBS-checked.</li>
  <li>If anything we cleaned is not right, tell us and we will come back and put it right: within <strong>72 hours</strong> for end of tenancy cleaning, and within <strong>24 hours</strong> for other services.</li>
  <li>We clean; we cannot repair damage, stains that are permanent, or normal wear and tear.</li>
</ul>

<h2>Using this website</h2>
<ul>
  <li>We try to keep the information on this site accurate and up to date, but it is general information and may change.</li>
  <li>The content, text and images on this site belong to SN Cleaning Services and may not be copied without our permission.</li>
  <li>Links to other websites are provided for convenience; we are not responsible for their content.</li>
</ul>

<h2>Your statutory rights</h2>
<p>Nothing in these terms affects your legal rights as a consumer, including your right to have services carried out with reasonable care and skill under the Consumer Rights Act 2015.</p>

<h2>Law</h2>
<p>These terms are governed by the law of England and Wales.</p>

<h2>Personal information</h2>
<p>How we handle your information is explained in our <a href="/privacy-policy/">Privacy Policy</a>.</p>
`
  }
};
