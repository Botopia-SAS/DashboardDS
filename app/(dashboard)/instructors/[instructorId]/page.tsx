"use client";

import { useEffect, useState } from "react";
import Loader from "@/components/custom ui/Loader";
import InstructorForm from "@/components/instructors/InstructorForm";

type InstructorType = {
  id: string;
  name: string;
  photo: string;
  certifications?: string;
  experience?: string;
  schedule?: {
    date: string;
    slots: {
      start: string;
      end: string;
    }[];
  }[];
};

const InstructorDetails = ({ params }: { params: Promise<{ instructorId?: string }> }) => {
  const [loading, setLoading] = useState(true);
  const [instructorDetails, setInstructorDetails] = useState<InstructorType | null>(null);

  useEffect(() => {
    const fetchInstructorDetails = async () => {
      try {
        const resolvedParams = await params;
        const instructorId = resolvedParams?.instructorId;

        if (!instructorId) {
          console.error("❌ No instructorId provided, skipping fetch.");
          setLoading(false);
          return;
        }

        console.log("🔍 Fetching instructor details for ID:", instructorId);
        const res = await fetch(`/api/instructors/${instructorId}`);

        if (!res.ok) {
          console.error("❌ Failed to fetch instructor details. Status:", res.status);
          throw new Error(`Failed to fetch: ${res.status}`);
        }

        const data = await res.json();
        console.log("✅ Instructor details fetched successfully:", data);

        // 🔹 Verifica si photo es una string completa
        console.log("📸 Foto recibida:", data.photo);

        // ✅ Asegurar que `photo` es un string válido
        if (typeof data.photo !== "string" || !data.photo.startsWith("http")) {
          console.warn("⚠️ Invalid photo URL detected. Using default.");
          data.photo = "/default-avatar.png"; // Imagen por defecto
        }

        setInstructorDetails(data);
      } catch (err) {
        console.error("[instructorId_GET] Error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchInstructorDetails();
  }, [params]);

  if (loading) return <Loader />;
  if (!instructorDetails) return <p className="text-center text-red-500">Instructor not found</p>;

  return <InstructorForm initialData={instructorDetails} />;
};

export default InstructorDetails;
