"use client";

import { useParams } from "next/navigation";
import SeoPage from "@/components/seo/SeoPage";

export default function LocationSeoPage() {
  const params = useParams();
  const locationId = params.locationId as string;

  return (
    <SeoPage
      entityType="Location"
      entityId={locationId}
      apiEndpoint={`/api/locations/${locationId}`}
      backUrl={`/locations/${locationId}`}
      entityLabel="Location"
    />
  );
}
