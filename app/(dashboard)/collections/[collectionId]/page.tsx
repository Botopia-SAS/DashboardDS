"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation"; // ✅ Importamos `useParams`
import Loader from "@/components/custom ui/Loader";
import CollectionForm from "@/components/collections/CollectionForm";

type ProductType = {
  id: string;
  name: string;
  price: number;
};

// Define el tipo correcto para CollectionType
type CollectionType = {
  id: string;
  name: string;
  _id: string;
  title: string;
  description: string;
  image: string;
  price: number;
  products: ProductType;
};

const CollectionDetails = () => {
  const [loading, setLoading] = useState(true);
  const [collectionDetails, setCollectionDetails] = useState<CollectionType | null>(null);

  const params = useParams(); // ✅ Usa `useParams()` para obtener los parámetros correctamente
  const collectionId = params?.collectionId as string; // ✅ Asegurar que collectionId es una string

  useEffect(() => {
    const fetchCollectionDetails = async () => {
      try {
        if (!collectionId) {
          console.error("❌ No collectionId provided, skipping fetch.");
          setLoading(false);
          return;
        }

        console.log("🔍 Fetching collection details for ID:", collectionId);
        const res = await fetch(`/api/collections/${collectionId}`); // ✅ Usa la URL correcta

        if (!res.ok) {
          console.error("❌ Failed to fetch collection details. Status:", res.status);
          throw new Error(`Failed to fetch: ${res.status}`);
        }

        const data = await res.json();
        console.log("✅ Collection details fetched successfully:", data);
        setCollectionDetails(data);
      } catch (err) {
        console.error("[collectionId_GET] Error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchCollectionDetails();
  }, [collectionId]); // ✅ Se ejecuta solo cuando `collectionId` cambia

  if (loading) return <Loader />;
  if (!collectionDetails) return <p className="text-center text-red-500">Collection not found</p>;

  return <CollectionForm initialData={collectionDetails} />;
};

export default CollectionDetails;
