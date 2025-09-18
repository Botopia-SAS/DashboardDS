"use client";
import { useState, useEffect } from "react";
import NotificationBar from "@/components/layout/NotificationBar";

export default function SEOSettings() {
  // Estados para los valores del formulario
  const [metaTitle, setMetaTitle] = useState("");
  const [metaDescription, setMetaDescription] = useState("");
  const [robotsTxt, setRobotsTxt] = useState("User-agent: *\nDisallow:");
  const [sitemapUrl, setSitemapUrl] = useState("");

  // Estado de carga
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchSEOSettings() {
      try {
        const res = await fetch("/api/seo");
        if (!res.ok) throw new Error("Failed to fetch SEO settings");
        const data = await res.json();
        
        setMetaTitle(data.metaTitle || "");
        setMetaDescription(data.metaDescription || "");
        setRobotsTxt(data.robotsTxt || "User-agent: *\nDisallow:");
        setSitemapUrl(data.sitemapUrl || "");

      } catch (error) {
        console.error("❌ Error fetching SEO settings:", error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchSEOSettings();
  }, []);

  const handleSave = async () => {
    try {
      const res = await fetch("/api/seo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          metaTitle,
          metaDescription,
          robotsTxt,
          sitemapUrl,
        }),
      });

      if (!res.ok) throw new Error("Failed to save SEO settings");

      alert("✅ SEO settings saved successfully!");
    } catch (error) {
      console.error("❌ Error saving SEO settings:", error);
      alert("❌ Failed to save SEO settings. Please try again.");
    }
  };

  return (
    <div className="p-6">
      <NotificationBar variant="dark" />
      <h1 className="text-2xl font-bold mb-4">SEO Settings</h1>

      {/* Mostrar mensaje de carga antes de renderizar */}
      {isLoading ? (
        <p className="text-center text-gray-500">Loading SEO settings...</p>
      ) : (
        <div className="space-y-4">
          {/* Meta Title */}
          <div>
            <label htmlFor="metaTitle" className="block text-sm font-medium">
              Meta Title
            </label>
            <input
              id="metaTitle"
              type="text"
              value={metaTitle || ""}
              onChange={(e) => {
                if (e.target.value !== metaTitle) setMetaTitle(e.target.value);
              }}
              placeholder="Enter meta title"
              className="w-full p-2 border rounded"
            />
          </div>

          {/* Meta Description */}
          <div>
            <label htmlFor="metaDescription" className="block text-sm font-medium">
              Meta Description
            </label>
            <input
              id="metaDescription"
              type="text"
              value={metaDescription || ""}
              onChange={(e) => {
                if (e.target.value !== metaDescription) setMetaDescription(e.target.value);
              }}
              placeholder="Enter meta description"
              className="w-full p-2 border rounded"
            />
          </div>

          {/* Robots.txt */}
          <div>
            <label htmlFor="robotsTxt" className="block text-sm font-medium">
              Robots.txt
            </label>
            <textarea
              id="robotsTxt"
              className="w-full p-2 border rounded"
              value={robotsTxt || ""}
              onChange={(e) => {
                if (e.target.value !== robotsTxt) setRobotsTxt(e.target.value);
              }}
              rows={4}
            />
          </div>

          {/* Sitemap URL */}
          <div>
            <label htmlFor="sitemapUrl" className="block text-sm font-medium">
              Sitemap URL
            </label>
            <input
              id="sitemapUrl"
              type="text"
              value={sitemapUrl || ""}
              onChange={(e) => {
                if (e.target.value !== sitemapUrl) setSitemapUrl(e.target.value);
              }}
              placeholder="Enter sitemap URL"
              className="w-full p-2 border rounded"
            />
          </div>

          {/* Botón para guardar */}
          <button
            onClick={handleSave}
            className="bg-blue-500 text-white px-4 py-2 rounded"
          >
            Save Settings
          </button>
        </div>
      )}
    </div>
  );
}
