interface SEOSettings {
  metaTitle: string;
  metaDescription: string;
  robotsTxt: string;
  sitemapUrl: string;
  ogTitle?: string;
  ogImage?: string;
}

export async function saveSEOSettings(settings: SEOSettings) {
  if (!settings.metaTitle || !settings.metaDescription) {
    throw new Error("Title and description are required for SEO.");
  }

  const res = await fetch("/api/seo/save", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(settings),
  });

  if (!res.ok) throw new Error("Failed to save SEO settings.");
  return res.ok;
}

export async function fetchSEOSettings(): Promise<SEOSettings | null> {
  try {
    const res = await fetch("/api/seo/fetch");
    if (!res.ok) return null;
    return await res.json();
  } catch (error) {
    console.error("Error fetching SEO settings:", error);
    return null;
  }
}
