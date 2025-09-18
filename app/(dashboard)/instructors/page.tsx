"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";

import { columns } from "@/components/instructors/InstructorsColumns";
import { DataTable } from "@/components/custom ui/DataTable";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import Loader from "@/components/custom ui/Loader";
import GlobalNotifications from "@/components/ui/GlobalNotifications";

const Instructors = () => {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [instructors, setInstructors] = useState([]);

  const getInstructors = async () => {
    try {
      const res = await fetch("/api/instructors", {
        method: "GET",
      });
      const data = await res.json();
      setInstructors(data);
      setLoading(false);
    } catch (err) {
      console.log("[instructors_GET]", err);
    }
  };

  useEffect(() => {
    getInstructors();
  }, []);

  return loading ? <Loader /> : (
    <div className="px-10 py-5">
      <div className="flex items-center justify-between">
        <p className="text-heading2-bold">Instructors</p>
        <p className="text-grey-1">All Instructors</p>
        <div className="flex items-center gap-3">
          <Button className="bg-blue-1 text-white" onClick={() => router.push("/instructors/new")}>
            <Plus className="h-4 w-4 mr-2" />
            Add Instructor
          </Button>
          <div className="bg-gray-800 p-2 rounded-lg">
            <GlobalNotifications iconColor="text-white" />
          </div>
        </div>
      </div>
      <Separator className="bg-grey-1 my-4" />
      <DataTable columns={columns} data={instructors} searchKey="name" />
    </div>
  );
};

export default Instructors;
