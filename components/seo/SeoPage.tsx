"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import SeoTab from "@/components/custom ui/SeoTab";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Loader from "@/components/custom ui/Loader";

interface SeoPageProps {
  entityType: "DrivingClass" | "OnlineCourse" | "Location";
  entityId: string;
  apiEndpoint: string;
  backUrl: string;
  entityLabel: string;
}

export default function SeoPage({
  entityType,
  entityId,
  apiEndpoint,
  backUrl,
  entityLabel,
}: SeoPageProps) {
  const router = useRouter();
  const [entityData, setEntityData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchEntityData = async () => {
      try {
        const response = await fetch(apiEndpoint);
        if (response.ok) {
          const responseData = await response.json();
          // Extract the actual data from the API response
          // Handle both { success: true, data: ... } and direct data formats
          const actualData = responseData.success && responseData.data
            ? responseData.data
            : responseData;
          setEntityData(actualData);
        } else {
          console.error("Failed to fetch entity data");
        }
      } catch (error) {
        console.error("Error fetching entity data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (entityId) {
      fetchEntityData();
    }
  }, [entityId, apiEndpoint]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader />
      </div>
    );
  }

  if (!entityData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <p className="text-red-500 text-lg">
          {entityLabel} not found
        </p>
        <Button onClick={() => router.back()} variant="outline">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Go Back
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          onClick={() => router.push(backUrl)}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to {entityLabel}
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-gray-900">SEO Settings</h1>
          <p className="text-gray-600 mt-1">{entityData.title}</p>
        </div>
      </div>

      {/* SEO Content */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <SeoTab
          entityType={entityType}
          entityId={entityId}
          entityData={entityData}
        />
      </div>
    </div>
  );
}
