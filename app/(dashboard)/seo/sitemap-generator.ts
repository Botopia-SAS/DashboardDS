export function generateSitemap(domain: string) {
  const pages = [
    "",
    "dashboard",
    "classes",
    "collections",
    "instructors",
    "locations",
    "online-courses",
    "packages",
    "products",
  ];

  const urls = pages
    .map(
      (page) => `
      <url>
        <loc>${domain}/${page}</loc>
        <priority>${page === "" ? "1.0" : "0.8"}</priority>
      </url>
    `
    )
    .join("");

  return `<?xml version="1.0" encoding="UTF-8"?>
    <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
      ${urls}
    </urlset>`;
}
