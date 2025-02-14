import { NextResponse } from "next/server";

export async function GET() {
  const seoSettings = {
    metaTitle: "Driving School - Learn to Drive",
    metaDescription:
      "Best driving school to learn safe and professional driving.",
    robotsTxt: "User-agent: *\nDisallow: /dashboard/\nAllow: /",
    sitemapUrl: "https://example.com/sitemap.xml",
  };

  return NextResponse.json(seoSettings);
}
