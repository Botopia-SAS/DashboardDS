"use client";
import { useState, useEffect } from "react";
import MetaForm from "./meta-form";
import RobotsForm from "./robots-form";
import OpenGraphForm from "./open-graph";
import { saveSEOSettings, fetchSEOSettings } from "./seo-service";

export default function SEOSettings() {
  const [metaTitle, setMetaTitle] = useState("");
  const [metaDescription, setMetaDescription] = useState("");
  const [robotsTxt, setRobotsTxt] = useState("User-agent: *\nDisallow:");
  const [sitemapUrl, setSitemapUrl] = useState("");
  const [ogTitle, setOgTitle] = useState("");
  const [ogImage, setOgImage] = useState("");

  useEffect(() => {
    async function loadSEOSettings() {
      const settings = await fetchSEOSettings();
      if (settings) {
        setMetaTitle(settings.metaTitle || "");
        setMetaDescription(settings.metaDescription || "");
        setRobotsTxt(settings.robotsTxt || "User-agent: *\nDisallow:");
        setSitemapUrl(settings.sitemapUrl || "");
        setOgTitle(settings.ogTitle || ""); // ✅ Evita error de undefined
        setOgImage(settings.ogImage || ""); // ✅ Evita error de undefined
      }
    }
    loadSEOSettings();
  }, []);

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
      alert("SEO settings saved successfully!");
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">SEO Settings</h1>
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
        className="bg-blue-500 text-white px-4 py-2 rounded mt-4"
      >
        Save Settings
      </button>
    </div>
  );
}
