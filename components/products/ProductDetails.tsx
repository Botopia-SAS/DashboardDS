"use client"; // 🔹 Es un Client Component

import Loader from '@/components/custom ui/Loader';
import ProductForm from '@/components/products/ProductForm';
import React, { useEffect, useState } from 'react';

// ✅ Definir tipo correctamente
type ProductType = {
  _id: string;
  title: string;
  description: string;
  media: string[];
  price: number;
};

const ProductDetails = ({ productId }: { productId: string }) => {
  const [loading, setLoading] = useState(true);
  const [productDetails, setProductDetails] = useState<ProductType | null>(null);

  useEffect(() => {
    const getProductDetails = async () => {
      if (!productId) {
        console.error("⚠ No productId provided, skipping fetch.");
        setLoading(false);
        return;
      }

      try {
        const res = await fetch(`/api/products/${productId}`);

        if (!res.ok) {
          console.error("❌ Failed to fetch product details. Status:", res.status);
          throw new Error(`Failed to fetch: ${res.status}`);
        }

        const data = await res.json();

        setProductDetails(data);
      } catch (err) {
        console.error("[productId_GET] Error:", err);
      } finally {
        setLoading(false);
        console.log("⏳ Loading state set to false.");
      }
    };

    getProductDetails();
  }, [productId]); // ✅ Usar `productId` en vez de `params.productId`

  if (loading) return <Loader />;
  if (!productDetails) return <p className="text-center text-red-500">Product not found</p>;

  return <ProductForm initialData={productDetails} />;
};

export default ProductDetails;
