import type { MetadataRoute } from "next";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://skyvan.com.tr";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/tr", "/en", "/tr/", "/en/"],
        disallow: ["/admin", "/workshop", "/offers", "/offer", "/proposal", "/api"],
      },
    ],
    sitemap: `${SITE_URL.replace(/\/+$/g, "")}/sitemap.xml`,
  };
}
