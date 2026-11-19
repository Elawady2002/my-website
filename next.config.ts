import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV !== "production";
const allowVercelLive = isDev || process.env.VERCEL_ENV === "preview";
const isVercelProd = process.env.VERCEL_ENV === "production";

const CONTENT_SECURITY_POLICY = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}${
    allowVercelLive ? " https://vercel.live" : ""
  }`,
  "style-src 'self' 'unsafe-inline'",
  `img-src 'self' data: blob:${allowVercelLive ? " https://vercel.live" : ""}`,
  "media-src 'self' blob:",
  "font-src 'self' data:",
  `connect-src 'self'${allowVercelLive ? " https://vercel.live" : ""}`,
  "worker-src 'self' blob:",
  `frame-src ${allowVercelLive ? "https://vercel.live" : "'none'"}`,
  "object-src 'none'",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  ...(isVercelProd ? ["upgrade-insecure-requests"] : []),
].join("; ");

const SECURITY_HEADERS = [
  { key: "X-DNS-Prefetch-Control", value: "on" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), browsing-topics=()",
  },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  {
    key: "Content-Security-Policy",
    value: CONTENT_SECURITY_POLICY,
  },
];

const IMMUTABLE_CACHE_HEADERS = [
  {
    key: "Cache-Control",
    value: "public, max-age=31536000, immutable",
  },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  cacheComponents: true,
  partialPrefetching: true,
  experimental: {
    inlineCss: true,
  },
  images: {
    formats: ["image/avif", "image/webp"],
    qualities: [75, 85],
    minimumCacheTTL: 31536000,
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: SECURITY_HEADERS,
      },
      {
        source: "/images/:path*",
        headers: IMMUTABLE_CACHE_HEADERS,
      },
      {
        source: "/videos/:path*",
        headers: IMMUTABLE_CACHE_HEADERS,
      },
    ];
  },
};

export default nextConfig;
