/**
 * Runs automatically after every successful deploy (Netlify invokes it by filename).
 * Tells Bing and the other IndexNow search engines (and the AI search tools that
 * use Bing) which pages changed today, so they are crawled straight away.
 * Pages changed today = sitemap entries whose lastmod is today.
 */
const SITE = 'https://sncleaningservices.co.uk';
const KEY = '21f03f4e28f898c5bc0cf0764aaf4051'; // also served at /<KEY>.txt

exports.handler = async () => {
  try {
    const xml = await (await fetch(`${SITE}/sitemap.xml`, { headers: { 'cache-control': 'no-cache' } })).text();
    const today = new Date().toISOString().slice(0, 10);
    const urls = [...xml.matchAll(/<url>\s*<loc>([^<]+)<\/loc>\s*<lastmod>([^<]+)<\/lastmod>/g)]
      .filter((m) => m[2] === today)
      .map((m) => m[1])
      .slice(0, 10000);
    if (!urls.length) return { statusCode: 200, body: 'Nothing changed today' };
    const r = await fetch('https://api.indexnow.org/indexnow', {
      method: 'POST',
      headers: { 'content-type': 'application/json; charset=utf-8' },
      body: JSON.stringify({ host: 'sncleaningservices.co.uk', key: KEY, keyLocation: `${SITE}/${KEY}.txt`, urlList: urls })
    });
    console.log(`IndexNow: sent ${urls.length} URL(s), status ${r.status}`);
    return { statusCode: 200, body: `Sent ${urls.length}` };
  } catch (e) {
    console.error('IndexNow failed', e.message);
    return { statusCode: 200, body: 'IndexNow failed' };
  }
};
