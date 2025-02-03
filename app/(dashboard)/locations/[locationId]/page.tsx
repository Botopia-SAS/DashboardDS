"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Loader from "@/components/custom ui/Loader";
import LocationsForm from "@/components/locations/LocationsForm";

type LocationType = {
  _id: string;
  title: string;
  description: string;
  zone: string;
  locationImage?: string;
  instructors: { name: string; image?: string | null }[];
};

const LocationDetails = () => {
  const params = useParams(); // ✅ Usamos useParams() para acceder correctamente
  const [loading, setLoading] = useState(true);
  const [locationDetails, setLocationDetails] = useState<LocationType | null>(null);

  useEffect(() => {
    const fetchLocationDetails = async () => {
      try {
        const locationId = params.locationId as string;

        if (!locationId) {
          console.error("❌ No locationId provided, skipping fetch.");
          setLoading(false);
          return;
        }

        console.log("🔍 Fetching location details for ID:", locationId);
        const res = await fetch(`/api/locations/${locationId}`);

        if (!res.ok) {
          console.error("❌ Failed to fetch location details. Status:", res.status);
          throw new Error(`Failed to fetch: ${res.status}`);
        }

        const data = await res.json();
        console.log("✅ Location details fetched successfully:", data);
        setLocationDetails(data);
      } catch (err) {
        console.error("[locationId_GET] Error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchLocationDetails();
  }, [params?.locationId]); // ✅ Ahora el efecto depende de params.locationId correctamente

  if (loading) return <Loader />;
  if (!locationDetails) return <p className="text-center text-red-500">Location not found</p>;

  return <LocationsForm initialData={locationDetails} />;
};

export default LocationDetails;
