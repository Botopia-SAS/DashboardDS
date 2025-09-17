"use client";

import useClassStore from "@/app/store/classStore";
import Loader from "@/components/custom ui/Loader";
import Navigation from "@/components/ticket/navigation-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeftIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface Class {
  _id: string;
  locationId: string;
  date: string;
  hour: string;
  classId: string;
  instructorId: string;
  students: string[];
  __v: number;
  locationName: string;
}

export default function Page() {
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(false);
  const { setClassId, classId } = useClassStore();
  const router = useRouter();
  useEffect(() => {
    setLoading(true);
    setClassId("");
    // Fetch all classes without filtering by type
    fetch(`/api/ticket/classes`)
      .then((res) => res.json())
      .then((data) => {
        setClasses(data);
        setLoading(false);
      })
      .catch((error) => console.error("Error fetching classes:", error));
  }, [setClassId]);
  if (loading) {
    return <Loader />;
  }
  const handleClick = (e: React.MouseEvent) => {
    if (classId === "") {
      e.preventDefault();
      alert("Please select a class");
    }
  };
  const navigate = () => {
    router.back();
  };
  return (
    <>
      <div className="p-6">
        <div className="flex justify-between items-center bg-gray-800 text-white px-5 py-3 rounded-lg shadow-md">
          <h1 className="text-xl font-semibold">Tickets</h1>
          <Button onClick={navigate} className="hover:scale-110">
            <ArrowLeftIcon size={16} />
          </Button>
        </div>
      </div>
      <div className="p-6">
        <Select onValueChange={(value) => setClassId(value)}>
          <SelectTrigger>
            <SelectValue placeholder="Select a class" />
          </SelectTrigger>
          <SelectContent className="bg-white">
            {classes.map((c) => (
              <SelectItem
                key={c?._id}
                value={c?._id}
                className="hover:bg-gray-100 cursor-pointer"
              >
                {new Date(c?.date).toLocaleString("en-US", {
                  weekday: "long",
                  timeZone: "UTC",
                })}
                , {new Date(c?.date).getUTCDate()}{" "}
                {new Date(c?.date).toLocaleString("en-US", {
                  month: "short",
                  timeZone: "UTC",
                })}{" "}
                {new Date(c?.date).getUTCFullYear()}{" "}
                {parseInt(c?.hour.split(":")[0]) > 11
                  ? `${c?.hour} p.m.`
                  : `${c?.hour} a.m.`}{" "}
                | {c?.locationName}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Card className="mt-4">
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-2">
              <Navigation
                href={`/ticket/date/class-records/${classId}`}
                title="View the Class Records"
                description="View the records of the selected class."
                onClick={handleClick}
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
