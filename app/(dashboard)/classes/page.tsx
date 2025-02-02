"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";

import { columns } from "@/components/classes/ClassesColumns"; // 🔹 Asegúrate de definir las columnas
import { DataTable } from "@/components/custom ui/DataTable";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import Loader from "@/components/custom ui/Loader";

const DrivingClassesDashboard = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [classes, setClasses] = useState([]);

  const getClasses = async () => {
    try {
      const res = await fetch("/api/classes", { method: "GET" });
      const data = await res.json();
      setClasses(data);
      setLoading(false);
    } catch (err) {
      console.log("[classes_GET]", err);
      setLoading(false);
    }
  };

  useEffect(() => {
    getClasses();
  }, []);

  return loading ? (
    <Loader />
  ) : (
    <div className="px-10 py-5">
      <div className="flex items-center justify-between">
        <p className="text-heading2-bold">Driving Classes</p>
        <p className="text-grey-1">Manage your driving classes</p>
        <Button
          className="bg-blue-1 text-white"
          onClick={() => router.push("/classes/new")}
        >
          <Plus className="h-4 w-4 mr-2" />
          Create Class
        </Button>
      </div>
      <Separator className="bg-grey-1 my-4" />
      <DataTable columns={columns} data={classes} searchKey="title" />
    </div>
  );
};

export default DrivingClassesDashboard;
