"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation"; // ✅ Importamos useParams()
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
  objectives: string[];
  contact: string;
  buttonLabel: string;
  image?: string;
  headquarters?: string[];
  classType?: string;
};

const ClassDetails = () => {
  const [loading, setLoading] = useState(true);
  const [classDetails, setClassDetails] = useState<DrivingClassType | null>(null);
  const params = useParams(); // ✅ Obtén los parámetros correctamente
  const [classId, setClassId] = useState<string | null>(null);

  useEffect(() => {
    // ✅ Espera a que params esté disponible antes de extraer classId
    const fetchParams = async () => {
      const { classId } = await params; // ✅ Espera la promesa
      if (typeof classId === 'string') {
        setClassId(classId);
      } else {
        console.error("Invalid classId:", classId);
      }
    };

    fetchParams();
  }, [params]);

  useEffect(() => {
    const fetchClassDetails = async () => {
      if (!classId) return; // ⏳ Esperar hasta que classId tenga valor

      try {

        const res = await fetch(`/api/classes/${classId}`);

        if (!res.ok) {
          console.error("❌ Failed to fetch class details. Status:", res.status);
          throw new Error(`Failed to fetch: ${res.status}`);
        }

        const data = await res.json();

        // Extract the actual class data from the API response
        const classData = data.success ? data.data : data;
        setClassDetails(classData);
      } catch (err) {
        console.error("[classId_GET] Error:", err);
      } finally {
        setLoading(false);
      }
    };

    if (classId) fetchClassDetails();
  }, [classId]); // ✅ Llamar el fetch solo cuando `classId` esté disponible

  if (loading) return <Loader />;
  if (!classDetails) return <p className="text-center text-red-500">Class not found</p>;

  return <CustomForm initialData={classDetails} />;
};

export default ClassDetails;
