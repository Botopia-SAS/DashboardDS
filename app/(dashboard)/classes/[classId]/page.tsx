"use client";

import { useEffect, useState } from "react";
import Loader from "@/components/custom ui/Loader";
import CustomForm from "@/components/classes/ClassesForm";

// Definir el tipo de datos de una Driving Class
type DrivingClassType = {
  _id: string;
  title: string;
  alsoKnownAs: string[];
  length: number;
  price: number;
  overview: string;
  objectives: string[]; // ✅ Nuevo campo
  contact: string;
  buttonLabel: string;
  image?: string;
};

const ClassDetails = ({ params }: { params: { classId: string } }) => {
  const [loading, setLoading] = useState(true);
  const [classDetails, setClassDetails] = useState<DrivingClassType | null>(null);

  useEffect(() => {
    const fetchClassDetails = async () => {
      try {
        const { classId } = params; // Obtener el ID de la clase

        if (!classId) {
          console.error("❌ No classId provided, skipping fetch.");
          setLoading(false);
          return;
        }

        console.log("🔍 Fetching class details for ID:", classId);
        const res = await fetch(`/api/classes/${classId}`);

        if (!res.ok) {
          console.error("❌ Failed to fetch class details. Status:", res.status);
          throw new Error(`Failed to fetch: ${res.status}`);
        }

        const data = await res.json();
        console.log("✅ Class details fetched successfully:", data);
        setClassDetails(data);
      } catch (err) {
        console.error("[classId_GET] Error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchClassDetails();
  }, [params]);

  if (loading) return <Loader />;
  if (!classDetails) return <p className="text-center text-red-500">Class not found</p>;

  return <CustomForm initialData={classDetails} />;
};

export default ClassDetails;
