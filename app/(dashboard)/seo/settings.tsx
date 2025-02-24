"use client";
import { useState, useEffect } from "react";
import MetaForm from "./meta-form";
import RobotsForm from "./robots-form";
import OpenGraphForm from "./open-graph";
import { saveSEOSettings, fetchSEOSettings } from "./seo-service";

export default function SEOSettings() {
  // Estados para los valores del formulario
  const [metaTitle, setMetaTitle] = useState("");
  const [metaDescription, setMetaDescription] = useState("");
  const [robotsTxt, setRobotsTxt] = useState("User-agent: *\nDisallow:");
  const [sitemapUrl, setSitemapUrl] = useState("");
  const [ogTitle, setOgTitle] = useState("");
  const [ogImage, setOgImage] = useState("");

  // Estado de carga
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadSEOSettings() {
      const settings = await fetchSEOSettings();
      setMetaTitle(settings.metaTitle || "");
      setMetaDescription(settings.metaDescription || "");
      setRobotsTxt(settings.robotsTxt || "User-agent: *\nDisallow:");
      setSitemapUrl(settings.sitemapUrl || "");
      setOgTitle(settings.ogTitle || "");
      setOgImage(settings.ogImage || "");
      setIsLoading(false);
    }
    loadSEOSettings();
  }, []);

  const [, setMessage] = useState("");

  const handleSave = async () => {
    const success = await saveSEOSettings({
      metaTitle,
      metaDescription,
      robotsTxt,
      sitemapUrl,
      ogTitle,
      ogImage,
    });

    if (success) {
      setMessage("✅ SEO settings saved successfully!");
      setTimeout(() => setMessage(""), 3000); // Borra el mensaje en 3 segundos
    } else {
      setMessage("❌ Error saving settings. Try again.");
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">SEO Settings</h1>

      {/* Mostrar loading mientras se cargan los datos */}
      {isLoading ? (
        <p className="text-center text-gray-500">Loading SEO settings...</p>
      ) : (
        <>
          <MetaForm
            metaTitle={metaTitle}
            setMetaTitle={setMetaTitle}
            metaDescription={metaDescription}
            setMetaDescription={setMetaDescription}
          />
          <RobotsForm robotsTxt={robotsTxt} setRobotsTxt={setRobotsTxt} />
          <OpenGraphForm
            ogTitle={ogTitle}
            setOgTitle={setOgTitle}
            ogImage={ogImage}
            setOgImage={setOgImage}
          />
          <div>
            <label htmlFor="sitemapUrl" className="block text-sm font-medium">
              Sitemap URL
            </label>
            <input
              id="sitemapUrl"
              type="text"
              value={sitemapUrl || ""}
              onChange={(e) => {
                if (e.target.value !== sitemapUrl)
                  setSitemapUrl(e.target.value);
              }}
              placeholder="Enter sitemap URL"
              className="w-full p-2 border rounded"
            />
          </div>
          <button
            onClick={handleSave}
            className="bg-blue-500 text-white px-4 py-2 rounded mt-4"
          >
            Save Settings
          </button>
        </>
      )}
    </div>
  );
}
