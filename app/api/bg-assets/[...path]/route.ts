import { NextRequest } from "next/server";

const ASSET_BASE =
  "https://staticimgly.com/@imgly/background-removal-data/1.7.0/dist/";

export async function GET(
  _req: NextRequest,
  ctx: { params: { path?: string[] } }
) {
  const parts = ctx.params.path ?? [];
  const key = parts.length ? parts.join("/") : "resources.json";
  const upstreamUrl = `${ASSET_BASE}${key}`;

  try {
    const upstream = await fetch(upstreamUrl, {
      method: "GET",
      // Keep route responsive and let CDN/browser cache do most work
      cache: "force-cache",
    });

    if (!upstream.ok) {
      return new Response(`Asset fetch failed: ${upstream.status}`, {
        status: upstream.status,
      });
    }

    const contentType =
      upstream.headers.get("content-type") || "application/octet-stream";

    // Stream through — buffering with arrayBuffer() hits Vercel’s ~4.5 MB
    // serverless response limit on large WASM chunks, which surfaces in the
    // browser as TypeError: Failed to fetch.
    const body = upstream.body;
    if (!body) {
      const bytes = await upstream.arrayBuffer();
      return new Response(bytes, {
        status: 200,
        headers: {
          "content-type": contentType,
          "cache-control": "public, max-age=31536000, immutable",
        },
      });
    }

    return new Response(body, {
      status: 200,
      headers: {
        "content-type": contentType,
        "cache-control": "public, max-age=31536000, immutable",
      },
    });
  } catch (err) {
    console.error("[bg-assets] proxy failed", err);
    return new Response("Asset proxy error", { status: 500 });
  }
}

