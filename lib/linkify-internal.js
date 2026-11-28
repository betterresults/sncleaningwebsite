// Safe internal links in area-page CMS text (Dana, 24 Nov 2026).
// CMS fields are escaped in the template, so a raw <a> would show as text.
// This helper escapes the text, then turns markdown [label](/internal-path/) into a real link.
// Only same-site paths starting with / are allowed (no protocols, queries, hashes or //).

const { visibleCopy } = require('./site-helpers');

const HREF = /^\/(?:[A-Za-z0-9._-]+\/)*[A-Za-z0-9._-]+\/?$/;

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function linkifyInternal(text) {
  if (text == null || text === '') return '';
  // Turn markdown into HTML first, then dehyphen only the text nodes.
  // Link targets and attributes are inside tags, so they stay hyphenated.
  const html = escapeHtml(String(text)).replace(/\[([^\]]+)\]\((\/[A-Za-z0-9/._-]*)\)/g, (match, label, href) => {
    if (!HREF.test(href)) return match;
    return `<a href="${href}">${label}</a>`;
  });
  return visibleCopy(html);
}

function applyLinkPhrases(text, phrases) {
  if (!text || !phrases || !phrases.length) return text;
  let out = text;
  for (const item of phrases) {
    const phrase = item && item.phrase;
    const href = item && item.href;
    if (!phrase || !href || !HREF.test(href)) continue;
    const already = `[${phrase}](${href})`;
    if (out.includes(already)) continue;
    const idx = out.indexOf(phrase);
    if (idx === -1) continue;
    out = out.slice(0, idx) + already + out.slice(idx + phrase.length);
  }
  return out;
}

function applyLinkPhrasesToPage(page, phrases) {
  if (!page || !phrases || !phrases.length) return page;
  const wrap = (t) => applyLinkPhrases(t, phrases);
  const next = {
    ...page,
    intro: wrap(page.intro),
    local_intro: wrap(page.local_intro),
    quick_answer: wrap(page.quick_answer)
  };
  if (Array.isArray(page.content_sections)) {
    next.content_sections = page.content_sections.map((c) => ({
      ...c,
      heading: c.heading,
      body: (c.body || []).map(wrap)
    }));
  }
  if (Array.isArray(page.faqs)) {
    next.faqs = page.faqs.map((f) => ({ ...f, question: f.question, answer: wrap(f.answer) }));
  }
  return next;
}

module.exports = { escapeHtml, linkifyInternal, applyLinkPhrases, applyLinkPhrasesToPage };
