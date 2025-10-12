"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Plus } from "lucide-react";

import Loader from "@/components/custom ui/Loader";
import { Button } from "@/components/ui/button";
// import { Separator } from "@/components/ui/separator";
import { DataTable } from "@/components/custom ui/DataTable";
import { columns } from "@/components/products/ProductColumns";
import DashboardHeader from "@/components/layout/DashboardHeader";

const Products = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<ProductType[]>([]);
  const [error, setError] = useState<string | null>(null);

  const getProducts = async () => {
    try {
      const res = await fetch("/api/products");

      if (!res.ok) {
        throw new Error(`Error fetching products: ${res.status}`);
      }

      const data = await res.json();
      setProducts(data);
    } catch (err) {
      console.error("[products_GET] Error:", err);
      setError("Failed to load products.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getProducts();
  }, []);

  if (loading) return <Loader />;
  if (error) return <p className="text-red-500 text-center">{error}</p>;

  return (
    <div className="px-10 py-5">
      <DashboardHeader title="Driving Lessons">
        <p className="text-heading5 text-white">Total Driving Lessons: {products.length}</p>
        <Button className="bg-blue-1 text-white" onClick={() => router.push("/products/new")}>
          <Plus className="h-4 w-4 mr-2" />
          Create Driving Lessons
        </Button>
      </DashboardHeader>
      <DataTable columns={columns} data={products} searchKey="title" />
    </div>
  );
};

export default Products;
