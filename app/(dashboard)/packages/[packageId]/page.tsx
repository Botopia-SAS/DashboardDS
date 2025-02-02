"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation"; // ✅ Importamos `useParams()`
import Loader from "@/components/custom ui/Loader";
import PackageForm from "@/components/packages/PackageForm";

const PackageDetails = () => {
  const { packageId } = useParams(); // ✅ Usamos `useParams()` para evitar problemas con `params`
  const [loading, setLoading] = useState(true);
  const [packageDetails, setPackageDetails] = useState(null);

  useEffect(() => {
    console.log("📌 Frontend packageId recibido:", packageId); // ✅ Depuración

    if (!packageId || packageId === "undefined") {
      console.error("❌ No packageId provided, skipping fetch.");
      setLoading(false);
      return;
    }

    const fetchPackageDetails = async () => {
      try {
        console.log(`📌 Fetching package: /api/packages/${packageId}`); // ✅ Ver la URL
        const res = await fetch(`/api/packages/${packageId}`);
        if (!res.ok) throw new Error("Failed to fetch package");
        const data = await res.json();
        setPackageDetails(data);
      } catch (err) {
        console.error("[GET_PACKAGE_ERROR]", err);
      } finally {
        setLoading(false);
      }
    };

    fetchPackageDetails();
  }, [packageId]); // ✅ Solo se ejecuta cuando cambia `packageId`

  if (loading) return <Loader />;
  if (!packageDetails) return <p className="text-center text-red-500">❌ Package not found</p>;

  return <PackageForm initialData={packageDetails} />;
};

export default PackageDetails;
