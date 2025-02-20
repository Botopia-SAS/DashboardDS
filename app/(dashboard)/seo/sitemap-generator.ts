export function generateSitemap(domain: string) {
  const pages = [
    { path: "", priority: "1.0", changefreq: "daily" },
    { path: "dashboard", priority: "0.8", changefreq: "weekly" },
    { path: "classes", priority: "0.8", changefreq: "weekly" },
    { path: "collections", priority: "0.7", changefreq: "weekly" },
    { path: "instructors", priority: "0.7", changefreq: "monthly" },
    { path: "locations", priority: "0.7", changefreq: "monthly" },
    { path: "online-courses", priority: "0.6", changefreq: "monthly" },
    { path: "packages", priority: "0.6", changefreq: "monthly" },
    { path: "products", priority: "0.6", changefreq: "monthly" },
  ];

  // Generar las URLs del sitemap
  const urls = pages
    .map(({ path, priority, changefreq }) => {
      const url = `${domain.replace(/\/$/, "")}/${path}`; // Evita barras duplicadas en la URL
      const lastmod = new Date().toISOString(); // Fecha en formato ISO

      return `
        <url>
          <loc>${url}</loc>
          <priority>${priority}</priority>
          <changefreq>${changefreq}</changefreq>
          <lastmod>${lastmod}</lastmod>
        </url>
      `.trim();
    })
    .join("");

  return `<?xml version="1.0" encoding="UTF-8"?>
    <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
      ${urls}
    </urlset>`.trim();
}
