export function generateSitemap(domain: string) {
  return `<?xml version="1.0" encoding="UTF-8"?>
    <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
      <url>
        <loc>${domain}/</loc>
        <priority>1.0</priority>
      </url>
      <url>
        <loc>${domain}/dashboard</loc>
        <priority>0.8</priority>
      </url>
    </urlset>`;
}
