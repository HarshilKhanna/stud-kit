import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ortBrowserBundle = path.join(
  __dirname,
  "node_modules",
  "onnxruntime-web",
  "dist",
  "ort.min.js",
);

/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // ONNX / IMG.LY are browser-only; keep them out of RSC server bundles (Next 14)
    serverComponentsExternalPackages: [
      "@imgly/background-removal",
      "onnxruntime-web",
    ],
  },
  images: {
    domains: [
      "images.unsplash.com",
      "firebasestorage.googleapis.com",
    ],
  },

  webpack(config, { isServer }) {
    config.ignoreWarnings = [
      ...(config.ignoreWarnings ?? []),
      {
        module: /onnxruntime-web[\\/]dist[\\/]ort\.min\.js/,
        message: /Critical dependency: require function is used in a way/,
      },
    ];

    if (!isServer) {
      // ESM *.mjs bundles (ort.bundle / webgpu / wasm) contain `import.meta` and fail
      // Next’s production minifier ("from Terser"). The legacy UMD `ort.min.js` does not.
      // Admin uses CPU/WASM only; default + webgpu dynamic imports can all resolve here.
      config.resolve.alias = {
        ...config.resolve.alias,
        "onnxruntime-web$": ortBrowserBundle,
        "onnxruntime-web/webgpu": ortBrowserBundle,
        "onnxruntime-web/wasm": ortBrowserBundle,
      };
    }
    return config;
  },
};

export default nextConfig;