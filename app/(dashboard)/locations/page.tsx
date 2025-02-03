"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";

import { columns } from "@/components/locations/LocationsColumns";
import { DataTable } from "@/components/custom ui/DataTable";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import Loader from "@/components/custom ui/Loader";

const Locations = () => {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [headquarters, setHeadquarters] = useState([]);

  const getHeadquarters = async () => {
    try {
      const res = await fetch("/api/locations", {
        method: "GET",
      });
      const data = await res.json();
      setHeadquarters(data);
      setLoading(false);
    } catch (err) {
      console.log("[headquarters_GET]", err);
    }
  };

  useEffect(() => {
    getHeadquarters();
  }, []);

  return loading ? <Loader /> : (
    <div className="px-10 py-5">
      <div className="flex items-center justify-between">
        <p className="text-heading2-bold">Locations</p>
        <p className="text-grey-1">All Locations</p>
        <Button className="bg-blue-1 text-white" onClick={() => router.push("/locations/new")}>
          <Plus className="h-4 w-4 mr-2" />
          Add Location
        </Button>
      </div>
      <Separator className="bg-grey-1 my-4" />
      <DataTable columns={columns} data={headquarters} searchKey="title" />
    </div>
  );
};

export default Locations;
