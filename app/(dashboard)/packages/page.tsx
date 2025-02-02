"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { columns } from "@/components/packages/PackageColumns"; // 📌 Definir columnas de la tabla
import { DataTable } from "@/components/custom ui/DataTable";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import Loader from "@/components/custom ui/Loader";

const PackagesDashboard = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [packages, setPackages] = useState([]);

  const fetchPackages = async () => {
    try {
      const res = await fetch("/api/packages");
      const data = await res.json();
      setPackages(data);
    } catch (err) {
      console.error("[GET_PACKAGES_ERROR]", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPackages();
  }, []);

  return loading ? <Loader /> : (
    <div className="px-10 py-5">
      <div className="flex items-center justify-between">
        <p className="text-heading2-bold">Packages</p>
        <p className="text-grey-1">All available packages</p>
        <Button className="bg-blue-1 text-white" onClick={() => router.push("/packages/new")}>
          <Plus className="h-4 w-4 mr-2" />
          Create Package
        </Button>
      </div>
      <Separator className="bg-grey-1 my-4" />
      <DataTable columns={columns} data={packages} searchKey="title" />
    </div>
  );
};

export default PackagesDashboard;
