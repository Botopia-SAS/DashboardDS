interface SEOSettings {
  metaTitle: string;
  metaDescription: string;
  robotsTxt: string;
  sitemapUrl: string;
  ogTitle?: string;
  ogImage?: string;
}

// ✅ Función para guardar los ajustes de SEO
export async function saveSEOSettings(settings: SEOSettings): Promise<boolean> {
  if (!settings.metaTitle || !settings.metaDescription) {
    console.error("❌ Title and description are required for SEO.");
    return false;
  }

  try {
    const res = await fetch("/api/seo", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(settings),
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error("❌ Failed to save SEO settings:", errorText);
      return false;
    }

    return true;
  } catch (error) {
    console.error("❌ Error saving SEO settings:", error);
    return false;
  }
}

// ✅ Función para obtener los ajustes de SEO
export async function fetchSEOSettings(): Promise<SEOSettings> {
  try {
    const res = await fetch("/api/seo");

    if (!res.ok) {
      console.error(
        "❌ Error fetching SEO settings:",
        res.status,
        res.statusText
      );
      throw new Error(`Failed to fetch SEO settings: ${res.statusText}`);
    }

    return await res.json();
  } catch (error) {
    console.error("❌ Fetch SEO error:", error);
    return {
      metaTitle: "",
      metaDescription: "",
      robotsTxt: "User-agent: *\nDisallow:",
      sitemapUrl: "",
      ogTitle: "",
      ogImage: "",
    };
  }
}
