interface SEOSettings {
  metaTitle: string;
  metaDescription: string;
  robotsTxt: string;
  sitemapUrl: string;
  ogTitle?: string;
  ogImage?: string;
}

export async function saveSEOSettings(settings: SEOSettings) {
  const res = await fetch("/api/seo/save", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(settings),
  });

  return res.ok;
}

export async function fetchSEOSettings(): Promise<SEOSettings | null> {
  const res = await fetch("/api/seo/fetch");
  if (!res.ok) return null;
  return res.json();
}
