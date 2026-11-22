import type { MetadataRoute } from "next";

const LAST_MODIFIED = new Date("2026-11-22T00:00:00.000Z");

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: "https://my-website-neon-ten-94.vercel.app",
      lastModified: LAST_MODIFIED,
      changeFrequency: "monthly",
      priority: 1,
    },
    {
      url: "https://my-website-neon-ten-94.vercel.app/certificates",
      lastModified: LAST_MODIFIED,
      changeFrequency: "monthly",
      priority: 0.8,
    },
  ];
}
