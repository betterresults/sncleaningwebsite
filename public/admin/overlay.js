/*
 * Website editor overlay. Shared by the server (Express, at build time) and the
 * visual editor in the browser, so the preview always matches the live site.
 *
 * Templates mark parts that must stay locked (Supabase content, forms, maps)
 * with <!--sb:name--> ... <!--/sb-->. A page edited in the editor is stored as
 * the inside of <main> with those parts collapsed to <!--@sb:name--> and filled
 * back in from the fresh page on every build.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.EdOverlay = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var MAIN_OPEN = '<main>';
  var MAIN_CLOSE = '</main>';

  function hash(str) {
    var h = 5381;
    str = String(str || '');
    for (var i = 0; i < str.length; i++) h = ((h << 5) + h + str.charCodeAt(i)) | 0;
    return (h >>> 0).toString(36);
  }

  function splitMain(html) {
    var a = html.indexOf(MAIN_OPEN);
    var b = html.lastIndexOf(MAIN_CLOSE);
    if (a < 0 || b < a) return null;
    return { before: html.slice(0, a + MAIN_OPEN.length), main: html.slice(a + MAIN_OPEN.length, b), after: html.slice(b) };
  }

  // Locked parts in order, with a key that stays the same between builds.
  var RE_REGION = /<!--sb:([a-z0-9-]+)-->([\s\S]*?)<!--\/sb-->/g;
  function regions(main) {
    var out = [], seen = {}, m;
    RE_REGION.lastIndex = 0;
    while ((m = RE_REGION.exec(main))) {
      seen[m[1]] = (seen[m[1]] || 0) + 1;
      out.push({ key: seen[m[1]] > 1 ? m[1] + '.' + seen[m[1]] : m[1], html: m[0], start: m.index, end: m.index + m[0].length });
    }
    return out;
  }
  function collapse(main) {
    var parts = regions(main), out = '', pos = 0;
    parts.forEach(function (r) { out += main.slice(pos, r.start) + '<!--@sb:' + r.key + '-->'; pos = r.end; });
    return out + main.slice(pos);
  }
  function expand(saved, freshMain) {
    var map = {};
    regions(freshMain).forEach(function (r) { map[r.key] = r.html; });
    return String(saved).replace(/<!--@sb:([a-z0-9.-]+)-->/g, function (m, k) { return map[k] || ''; });
  }

  // The design of the page itself, without its locked parts: used to notice when
  // the page template changed after it was edited.
  function baseHash(html) {
    var s = splitMain(html);
    return s ? hash(collapse(s.main).replace(/\s+/g, ' ').trim()) : '';
  }

  function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }

  function setMeta(html, attr, name, value) {
    var re = new RegExp('<meta\\s+' + attr + '="' + name.replace(/[:.]/g, '\\$&') + '"\\s+content="[^"]*"\\s*/?>', 'i');
    var tag = '<meta ' + attr + '="' + name + '" content="' + esc(value) + '" />';
    return re.test(html) ? html.replace(re, tag) : html.replace('</head>', '  ' + tag + '\n</head>');
  }

  function absolute(src, siteUrl) {
    if (!src) return src;
    if (/^https?:/.test(src)) return src;
    return siteUrl.replace(/\/$/, '') + (src.charAt(0) === '/' ? src : '/images/uploads/' + src);
  }

  function applySeo(html, seo, siteUrl) {
    if (!seo) return html;
    if (seo.title) {
      html = html.replace(/<title>[\s\S]*?<\/title>/, '<title>' + esc(seo.title) + '</title>');
      html = setMeta(html, 'property', 'og:title', seo.title);
      html = setMeta(html, 'name', 'twitter:title', seo.title);
    }
    if (seo.desc) {
      html = setMeta(html, 'name', 'description', seo.desc);
      html = setMeta(html, 'property', 'og:description', seo.desc);
      html = setMeta(html, 'name', 'twitter:description', seo.desc);
    }
    if (seo.ogImage) {
      var img = absolute(seo.ogImage, siteUrl || '');
      html = setMeta(html, 'property', 'og:image', img);
      html = setMeta(html, 'name', 'twitter:image', img);
    }
    if (seo.noindex && !/<meta name="robots" content="noindex/.test(html)) {
      html = html.replace(/<meta name="robots" content="[^"]*"\s*\/?>/i, '').replace('</head>', '  <meta name="robots" content="noindex, follow" />\n</head>');
    }
    return html;
  }

  function themeCss(theme) {
    var keys = Object.keys(theme || {}).filter(function (k) { return /^--[a-z0-9-]+$/.test(k) && theme[k]; });
    if (!keys.length) return '';
    var decl = keys.map(function (k) { return k + ':' + String(theme[k]).replace(/[;{}<]/g, ''); }).join(';');
    return ':root{' + decl + '}.is-home{' + decl + '}';
  }

  function applyTheme(html, theme) {
    var css = themeCss(theme);
    if (!css) return html;
    return html.replace('</head>', '<style id="ed-theme">' + css + '</style>\n</head>');
  }

  // page = { html, seo } from the editor; site = { theme }
  function apply(html, opts) {
    opts = opts || {};
    var page = opts.page || {};
    if (page.html != null) {
      var s = splitMain(html);
      if (s) html = s.before + expand(page.html, s.main) + s.after;
    }
    html = applySeo(html, page.seo, opts.siteUrl);
    html = applyTheme(html, (opts.site || {}).theme);
    return html;
  }

  // Page key from a URL path: "/" -> "home", "/blog/my-post/" -> "blog--my-post"
  function pageKey(p) {
    p = String(p || '/').split('?')[0].split('#')[0].replace(/\/+$/, '');
    return p === '' ? 'home' : p.replace(/^\//, '').replace(/\//g, '--');
  }

  return { hash: hash, splitMain: splitMain, regions: regions, collapse: collapse, expand: expand, baseHash: baseHash, apply: apply, applySeo: applySeo, applyTheme: applyTheme, themeCss: themeCss, pageKey: pageKey, esc: esc };
});
