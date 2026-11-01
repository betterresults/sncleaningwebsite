// Website editor API for /admin (SN Cleaning Services).
// Sign in: Netlify Identity (invite only). Env vars: GITHUB_TOKEN, GITHUB_REPO (owner/name), GITHUB_BRANCH.
// Drafts and draft photos live in Netlify Blobs, so saving never triggers a deploy.
// Publish = one commit with everything in content/editor/ (and new photos) = one deploy.
import { getStore } from "@netlify/blobs";

const GH = "https://api.github.com";
const REPO = process.env.GITHUB_REPO || "betterresults/sncleaningwebsite";
const BRANCH = process.env.GITHUB_BRANCH || "main";
const DIR = "content/editor/";
const UPLOADS = "public/images/uploads/";

const json = (status, body) => new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json", "cache-control": "no-store" } });
const store = () => getStore({ name: "sn-editor", consistency: "strong" });
const MIME = { svg: "image/svg+xml", jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png", gif: "image/gif", webp: "image/webp", mp4: "video/mp4", webm: "video/webm" };
const safeKey = (k) => /^[a-z0-9][a-z0-9_-]*(--[a-z0-9_-]+)*$/.test(k) && k.length < 160;
const safeSlug = (s) => /^[a-z0-9][a-z0-9-]*$/.test(s) && s.length < 120 && s !== "_template";
const safeImg = (f) => /^[a-z0-9][a-z0-9-]*\.(webp|jpg|jpeg|png|svg|gif|mp4|webm)$/.test(f);

async function gh(path, opts = {}) {
  const r = await fetch(`${GH}/repos/${REPO}/${path}`, {
    ...opts,
    headers: { authorization: `Bearer ${process.env.GITHUB_TOKEN}`, accept: "application/vnd.github+json", "x-github-api-version": "2022-11-28", "user-agent": "sn-editor", ...(opts.headers || {}) }
  });
  const body = r.status === 204 ? {} : await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(body.message || `GitHub error ${r.status}`);
  return body;
}
async function identityUser(req) {
  const h = req.headers.get("authorization") || "";
  if (!h.startsWith("Bearer ")) return null;
  try {
    const r = await fetch(`${new URL(req.url).origin}/.netlify/identity/user`, { headers: { authorization: h } });
    return r.ok ? await r.json() : null;
  } catch { return null; }
}
async function head() {
  const ref = await gh(`git/ref/heads/${BRANCH}`);
  const commit = await gh(`git/commits/${ref.object.sha}`);
  const tree = await gh(`git/trees/${commit.tree.sha}?recursive=1`);
  return { sha: ref.object.sha, treeSha: commit.tree.sha, tree: tree.tree };
}
const text = async (sha) => Buffer.from((await gh(`git/blobs/${sha}`)).content, "base64").toString("utf8");

async function loadContent() {
  const { sha, tree } = await head();
  const out = { site: { theme: {} }, pages: {}, html: {}, posts: [], bodies: {} };
  const files = tree.filter((t) => t.type === "blob" && t.path.startsWith(DIR) && /\.(json|html)$/.test(t.path));
  await Promise.all(files.map(async (t) => {
    const rel = t.path.slice(DIR.length);
    const body = await text(t.sha);
    if (rel === "site.json") out.site = JSON.parse(body);
    else if (rel === "pages.json") out.pages = JSON.parse(body);
    else if (rel === "posts.json") out.posts = JSON.parse(body);
    else if (rel.startsWith("pages/")) out.html[rel.slice(6, -5)] = body;
    else if (rel.startsWith("posts/")) out.bodies[rel.slice(6, -5)] = body;
  }));
  const images = tree.filter((t) => t.type === "blob" && /^public\/images\//.test(t.path) && !/^public\/images\/(_r|favicon)\//.test(t.path) && /\.(webp|jpe?g|png|svg|gif)$/i.test(t.path))
    .map((t) => "/" + t.path.slice(7));
  return { sha, content: out, images };
}

async function publish(draft, message) {
  const { sha, treeSha, tree } = await head();
  const entries = [];
  const put = (path, content) => entries.push({ path, mode: "100644", type: "blob", content });
  put(DIR + "site.json", JSON.stringify(draft.site || { theme: {} }, null, 1) + "\n");
  put(DIR + "pages.json", JSON.stringify(draft.pages || {}, null, 1) + "\n");
  put(DIR + "posts.json", JSON.stringify(draft.posts || [], null, 1) + "\n");
  const keepPages = new Set(), keepPosts = new Set();
  for (const [k, html] of Object.entries(draft.html || {})) {
    if (!safeKey(k)) throw new Error(`Bad page ${k}`);
    put(`${DIR}pages/${k}.html`, html); keepPages.add(`${DIR}pages/${k}.html`);
  }
  for (const p of draft.posts || []) {
    if (!safeSlug(p.slug)) throw new Error(`Bad post address ${p.slug}`);
    put(`${DIR}posts/${p.slug}.html`, (draft.bodies || {})[p.slug] || ""); keepPosts.add(`${DIR}posts/${p.slug}.html`);
  }
  for (const t of tree) {
    if (t.type !== "blob") continue;
    if (t.path.startsWith(`${DIR}pages/`) && t.path.endsWith(".html") && !keepPages.has(t.path)) entries.push({ path: t.path, mode: "100644", type: "blob", sha: null });
    if (t.path.startsWith(`${DIR}posts/`) && t.path.endsWith(".html") && !keepPosts.has(t.path)) entries.push({ path: t.path, mode: "100644", type: "blob", sha: null });
  }
  // new photos that the published content actually uses
  const used = JSON.stringify(draft);
  const s = store();
  for (const f of (draft.images || []).filter((f) => safeImg(f) && used.includes(`/images/uploads/${f}`))) {
    const data = await s.get(`img/${f}`, { type: "arrayBuffer" });
    if (!data) continue;
    const blob = await gh("git/blobs", { method: "POST", body: JSON.stringify({ content: Buffer.from(data).toString("base64"), encoding: "base64" }) });
    entries.push({ path: UPLOADS + f, mode: "100644", type: "blob", sha: blob.sha });
  }
  const newTree = await gh("git/trees", { method: "POST", body: JSON.stringify({ base_tree: treeSha, tree: entries }) });
  if (newTree.sha === treeSha) return { sha, unchanged: true };
  const commit = await gh("git/commits", { method: "POST", body: JSON.stringify({ message: message || "Update website from editor", tree: newTree.sha, parents: [sha] }) });
  await gh(`git/refs/heads/${BRANCH}`, { method: "PATCH", body: JSON.stringify({ sha: commit.sha }) });
  return { sha: commit.sha };
}

export default async (req) => {
  if (req.method !== "POST") return json(405, { error: "Method not allowed" });
  let body;
  try { body = await req.json(); } catch { return json(400, { error: "Bad request" }); }
  const user = await identityUser(req);
  if (!user) return json(401, { error: "Please sign in again" });
  if (!process.env.GITHUB_TOKEN) return json(500, { error: "GitHub connection is not set up yet." });
  const { action } = body;
  try {
    const s = store();
    if (action === "load") {
      const [live, draft] = await Promise.all([loadContent(), s.get("draft", { type: "json" })]);
      return json(200, { ...live, draft: draft || null, user: user.email });
    }
    if (action === "saveDraft") {
      if (!body.draft || !body.draft.site || !body.draft.pages) throw new Error("Draft is incomplete");
      const draft = { ...body.draft, savedAt: new Date().toISOString(), savedBy: user.email };
      await s.setJSON("draft", draft);
      return json(200, { savedAt: draft.savedAt });
    }
    if (action === "discardDraft") { await s.delete("draft"); return json(200, { ok: true }); }
    if (action === "uploadImage") {
      const base = String(body.name || "image").toLowerCase().replace(/\.[a-z0-9]+$/, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 50) || "image";
      const ext = /^(webp|jpg|jpeg|png|svg|gif|mp4|webm)$/.test(body.ext) ? body.ext : "webp";
      const b64 = String(body.data || "").replace(/^data:[^,]+,/, "");
      if (b64.length > 5_800_000) throw new Error("This file is too large");
      const file = `${base}-${Date.now().toString(36)}.${ext}`;
      const buf = Buffer.from(b64, "base64");
      await s.set(`img/${file}`, buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength), { metadata: { type: MIME[ext] } });
      return json(200, { file });
    }
    if (action === "publish") {
      const draft = await s.get("draft", { type: "json" });
      if (!draft) return json(400, { error: "There is nothing to publish" });
      const res = await publish(draft, body.message);
      await s.delete("draft");
      return json(200, res);
    }
    return json(400, { error: "Unknown action" });
  } catch (e) {
    return json(500, { error: e.message });
  }
};
