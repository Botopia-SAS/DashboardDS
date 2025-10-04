"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import ImageUpload from "@/components/custom ui/ImageUpload";
import toast from "react-hot-toast";
import { Separator } from "@/components/ui/separator";

interface SeoTabProps {
  entityType: "DrivingClass" | "OnlineCourse" | "Location" | "DrivingLessons" | "General";
  entityId?: string; // Optional para "General" o "DrivingLessons"
  entityData?: any; // Datos de la entidad para auto-generar SEO
}

interface SeoData {
  metaTitle: string;
  metaDescription: string;
  metaKeywords: string;
  metaImage: string;
}

const SeoTab: React.FC<SeoTabProps> = ({ entityType, entityId, entityData }) => {
  const [seoData, setSeoData] = useState<SeoData>({
    metaTitle: "",
    metaDescription: "",
    metaKeywords: "",
    metaImage: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);

  // Función para auto-generar SEO basado en los datos de la entidad
  const generateSeoFromEntity = (data: any, type: string): SeoData => {
    let generatedSeo: SeoData = {
      metaTitle: "",
      metaDescription: "",
      metaKeywords: "",
      metaImage: data?.image || data?.locationImage || "",
    };

    if (type === "DrivingClass") {
      // Auto-generar para Driving Class
      const title = data?.title || "";
      const headquarters = data?.headquarters || [];
      const length = data?.length || "";
      const alsoKnownAs = data?.alsoKnownAs || [];
      const price = data?.price || "";
      const overview = data?.overview || "";

      const location = headquarters.length > 0 ? headquarters[0] : "Palm Beach County";

      generatedSeo.metaTitle = `${title} - ${location} | Florida Traffic School - $${price}`;

      let description = "";
      if (overview && overview.length > 50) {
        description = `${overview.substring(0, 140)}... ${length} hour course available in ${headquarters.slice(0, 2).join(", ")}. Call now to register!`;
      } else {
        description = `Florida-approved ${title}. ${length} hour${length > 1 ? 's' : ''} of professional instruction. Avoid points, satisfy court orders. Available in ${headquarters.slice(0, 3).join(", ")}. Affordable pricing at $${price}.`;
      }
      generatedSeo.metaDescription = description.substring(0, 320);

      const keywords = [
        title,
        ...alsoKnownAs.slice(0, 3),
        ...headquarters.slice(0, 3).map((h: string) => `${title} ${h}`),
        `Florida Driving School`,
        `BDI Class ${location}`,
        `Traffic School ${location}`,
        `${length} Hour Class`
      ].filter(Boolean).join(", ");

      generatedSeo.metaKeywords = keywords;
    }
    else if (type === "OnlineCourse") {
      // Auto-generar para Online Course
      const title = data?.title || "";
      const description = data?.description || "";
      const courseType = data?.type || "Course";

      generatedSeo.metaTitle = `${title} - Florida Online ${courseType} | Approved Driver Education`;

      let fullDescription = "";
      if (description && description.length > 100) {
        fullDescription = `${description.substring(0, 150)}... Complete the course online at your own pace. Florida-approved and available 24/7.`;
      } else {
        fullDescription = `${description}. Complete ${title} online at your convenience. Florida state-approved online course. Study at your own pace, 24/7 access, instant certificate upon completion.`;
      }
      generatedSeo.metaDescription = fullDescription.substring(0, 320);

      generatedSeo.metaKeywords = `${title} Online, Florida Online ${courseType}, ${title}, Online Driver Education, Florida Driving Course, Online Traffic School, ${courseType} Online Florida, Approved Online Course`;
    }
    else if (type === "Location") {
      // Auto-generar para Location
      const title = data?.title || "";
      const zone = data?.zone || "";
      const description = data?.description || "";

      generatedSeo.metaTitle = `${title} Driving School - ${zone} | Florida Traffic School & Driving Lessons`;

      let fullDescription = description;
      if (fullDescription.length < 120) {
        fullDescription = `${description}. Professional driving instruction located in ${zone}. Experienced instructors, flexible schedules, and comprehensive driving courses available. Get your Florida driver's license with confidence.`;
      } else {
        fullDescription = `${description.substring(0, 140)} Located in ${zone}. Book your driving lesson today!`;
      }
      generatedSeo.metaDescription = fullDescription;

      generatedSeo.metaKeywords = `${title} Driving School, ${zone} Traffic School, Driving Lessons ${zone}, Florida Driving School, ${title}, Driving Instructor ${zone}, Traffic School ${zone}, Learn to Drive ${zone}`;
    }

    return generatedSeo;
  };

  // Fetch SEO data on mount
  useEffect(() => {
    const fetchSeoData = async () => {
      if (!entityId && entityType !== "General" && entityType !== "DrivingLessons") {
        setIsFetching(false);
        return;
      }

      try {
        setIsFetching(true);
        const params = new URLSearchParams({
          entityType,
          ...(entityId && { entityId }),
        });

        const res = await fetch(`/api/seo?${params}`);
        if (res.ok) {
          const data = await res.json();
          if (data && data._id) {
            // Si hay datos guardados, usarlos
            setSeoData({
              metaTitle: data.metaTitle || "",
              metaDescription: data.metaDescription || "",
              metaKeywords: data.metaKeywords || "",
              metaImage: data.metaImage || "",
            });
          } else if (entityData) {
            // Si no hay datos guardados pero hay entityData, auto-generar
            const generated = generateSeoFromEntity(entityData, entityType);
            setSeoData(generated);
          }
        } else if (entityData) {
          // Si no existe SEO, auto-generar desde entityData
          const generated = generateSeoFromEntity(entityData, entityType);
          setSeoData(generated);
        }
      } catch (error) {
        console.error("Error fetching SEO data:", error);
        // En caso de error, intentar auto-generar si hay entityData
        if (entityData) {
          const generated = generateSeoFromEntity(entityData, entityType);
          setSeoData(generated);
        }
      } finally {
        setIsFetching(false);
      }
    };

    fetchSeoData();
  }, [entityType, entityId, entityData]);

  const handleSave = async () => {
    if (!entityId && entityType !== "General" && entityType !== "DrivingLessons") {
      toast.error("Please save the main form first before adding SEO data");
      return;
    }

    try {
      setIsLoading(true);

      const payload = {
        ...seoData,
        entityType,
        ...(entityId && { entityId }),
      };

      const res = await fetch("/api/seo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error("Failed to save SEO data");
      }

      toast.success("SEO data saved successfully");
    } catch (error) {
      console.error("Error saving SEO data:", error);
      toast.error("Failed to save SEO data");
    } finally {
      setIsLoading(false);
    }
  };

  if (isFetching) {
    return (
      <div className="flex items-center justify-center p-10">
        <p className="text-gray-500">Loading SEO data...</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 bg-gray-50 rounded-lg">
      <div>
        <h3 className="text-lg font-semibold mb-2">SEO Settings</h3>
        <p className="text-sm text-gray-600">
          Optimize your content for search engines. These settings control how this page appears in search results.
        </p>
      </div>

      <Separator className="bg-gray-300" />

      {/* SEO Title */}
      <div>
        <label className="block text-sm font-medium mb-2">
          SEO Title <span className="text-gray-500">(Recommended: 50-60 characters)</span>
        </label>
        <Input
          placeholder="e.g., 4-Hour BDI Traffic Ticket Class - Palm Beach County | Avoid Points"
          value={seoData.metaTitle}
          onChange={(e) => setSeoData({ ...seoData, metaTitle: e.target.value })}
          maxLength={100}
        />
        <p className="text-xs text-gray-500 mt-1">
          {seoData.metaTitle.length}/100 characters
        </p>
      </div>

      {/* SEO Description */}
      <div>
        <label className="block text-sm font-medium mb-2">
          SEO Description <span className="text-gray-500">(Recommended: 150-160 characters)</span>
        </label>
        <Textarea
          placeholder="Florida-approved 4-Hour BDI Class. Avoid points, satisfy court orders, and prevent insurance rate increases. In-person & online traffic school in Palm Beach County."
          value={seoData.metaDescription}
          onChange={(e) => setSeoData({ ...seoData, metaDescription: e.target.value })}
          maxLength={320}
          rows={4}
        />
        <p className="text-xs text-gray-500 mt-1">
          {seoData.metaDescription.length}/320 characters
        </p>
      </div>

      {/* SEO Keywords */}
      <div>
        <label className="block text-sm font-medium mb-2">
          SEO Keywords <span className="text-gray-500">(Comma-separated)</span>
        </label>
        <Input
          placeholder="4-Hour BDI Class West Palm Beach, BDI Course Wellington FL, Basic Driver Improvement Palm Beach Gardens, Florida Traffic Ticket Class, BDI Driving School"
          value={seoData.metaKeywords}
          onChange={(e) => setSeoData({ ...seoData, metaKeywords: e.target.value })}
        />
        <p className="text-xs text-gray-500 mt-1">
          Use keywords that people might search for when looking for this content
        </p>
      </div>

      {/* SEO Image */}
      <div>
        <label className="block text-sm font-medium mb-2">
          SEO Image <span className="text-gray-500">(Used in social media sharing)</span>
        </label>
        <ImageUpload
          value={seoData.metaImage ? [seoData.metaImage] : []}
          onChange={(url) => setSeoData({ ...seoData, metaImage: url })}
          onRemove={() => setSeoData({ ...seoData, metaImage: "" })}
        />
        <p className="text-xs text-gray-500 mt-1">
          Recommended size: 1200x630px for optimal display on social media platforms
        </p>
      </div>

      {/* Save Button */}
      <div className="flex justify-end pt-4">
        <Button
          type="button"
          onClick={handleSave}
          disabled={isLoading}
          className="bg-blue-600 hover:bg-blue-700"
        >
          {isLoading ? "Saving..." : "Save SEO Settings"}
        </Button>
      </div>
    </div>
  );
};

export default SeoTab;
