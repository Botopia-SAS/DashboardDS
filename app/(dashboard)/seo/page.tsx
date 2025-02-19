"use client";
import { useState, useEffect } from "react";

export default function SEOSettings() {
  const [metaTitle, setMetaTitle] = useState("");
  const [metaDescription, setMetaDescription] = useState("");
  const [robotsTxt, setRobotsTxt] = useState("User-agent: *\nDisallow:");
  const [sitemapUrl, setSitemapUrl] = useState("");

  useEffect(() => {
    async function fetchSEOSettings() {
      const res = await fetch("/api/seo");
      const data = await res.json();
      setMetaTitle(data.metaTitle);
      setMetaDescription(data.metaDescription);
      setRobotsTxt(data.robotsTxt);
      setSitemapUrl(data.sitemapUrl);
    }
    fetchSEOSettings();
  }, []);

  const handleSave = async () => {
    const res = await fetch("/api/seo/save", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        metaTitle,
        metaDescription,
        robotsTxt,
        sitemapUrl,
      }),
    });

    if (res.ok) {
      alert("SEO settings saved successfully!");
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">SEO Settings</h1>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium">Meta Title</label>
          <input
            type="text"
            value={metaTitle}
            onChange={(e) => setMetaTitle(e.target.value)}
            placeholder="Enter meta title"
            className="w-full p-2 border rounded"
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Meta Description</label>
          <input
            type="text"
            value={metaDescription}
            onChange={(e) => setMetaDescription(e.target.value)}
            placeholder="Enter meta description"
            className="w-full p-2 border rounded"
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Robots.txt</label>
          <textarea
            className="w-full p-2 border rounded"
            value={robotsTxt}
            onChange={(e) => setRobotsTxt(e.target.value)}
            rows={4}
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Sitemap URL</label>
          <input
            type="text"
            value={sitemapUrl}
            onChange={(e) => setSitemapUrl(e.target.value)}
            placeholder="Enter sitemap URL"
            className="w-full p-2 border rounded"
          />
        </div>
        <button
          onClick={handleSave}
          className="bg-blue-500 text-white px-4 py-2 rounded"
        >
          Save Settings
        </button>
      </div>
    </div>
  );
}
