// Serves photos and clips uploaded in the website editor before they are published.
import { getStore } from "@netlify/blobs";
export default async (req) => {
  const u = new URL(req.url);
  const file = decodeURIComponent(u.searchParams.get("f") || u.pathname.split("/").pop() || "");
  if (!/^[a-z0-9][a-z0-9-]*\.(webp|jpg|jpeg|png|svg|gif|mp4|webm)$/.test(file)) return new Response("Not found", { status: 404 });
  const res = await getStore({ name: "sn-editor", consistency: "strong" }).getWithMetadata(`img/${file}`, { type: "arrayBuffer" });
  if (!res) return new Response("Not found", { status: 404 });
  return new Response(res.data, { headers: { "content-type": res.metadata?.type || "image/webp", "cache-control": "private, max-age=3600" } });
};
