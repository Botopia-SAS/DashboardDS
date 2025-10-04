"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Menu, Settings } from "lucide-react";

import { columns as classesColumns } from "@/components/classes/ClassesColumns";
import { columns as onlineCoursesColumns } from "@/components/online-courses/OnlineCoursesColumns";
import { DataTable } from "@/components/custom ui/DataTable";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import Loader from "@/components/custom ui/Loader";
import DashboardHeader from "@/components/layout/DashboardHeader";
import ClassTypeManager from "@/components/classes/ClassTypeManager";
import SeoTab from "@/components/custom ui/SeoTab";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const DrivingClassesDashboard = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"classes" | "online">("classes");
  const [menuOpen, setMenuOpen] = useState(false);
  const [classes, setClasses] = useState([]);
  const [onlineCourses, setOnlineCourses] = useState([]);
  const [isClassTypeManagerOpen, setIsClassTypeManagerOpen] = useState(false);

  // 🔹 Obtener clases
  const getClasses = async () => {
    try {
      const res = await fetch("/api/classes", { method: "GET" });
      const data = await res.json();
      setClasses(data);
    } catch (err) {
      console.error("[classes_GET]", err);
    }
  };

  // 🔹 Obtener cursos en línea
  const getOnlineCourses = async () => {
    try {
      const res = await fetch("/api/online-courses", { method: "GET" });
      const data = await res.json();
      setOnlineCourses(data);
    } catch (err) {
      console.error("[onlineCourses_GET]", err);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      await Promise.all([getClasses(), getOnlineCourses()]);
      setLoading(false);
    };
    fetchData();
  }, []);

  return (
    <div className="px-5 py-5">
      {/* 🔹 MENÚ SUPERIOR */}
      <DashboardHeader title="Driving School Classes">
        {/* 🔹 Menú Desktop */}
        <div className="hidden md:flex gap-6">
          <button
            className={`px-4 py-2 rounded-lg transition-all ${
              activeTab === "classes" ? "bg-blue-500 text-white" : "text-gray-300 hover:bg-gray-700"
            }`}
            onClick={() => setActiveTab("classes")}
          >
            Classes
          </button>
          <button
            className={`px-4 py-2 rounded-lg transition-all ${
              activeTab === "online" ? "bg-blue-500 text-white" : "text-gray-300 hover:bg-gray-700"
            }`}
            onClick={() => setActiveTab("online")}
          >
            Online Courses
          </button>
        </div>

        {/* 🔹 Menú Mobile (Dropdown) */}
        <div className="relative md:hidden">
          <Menu
            className="w-8 h-8 cursor-pointer"
            onClick={() => setMenuOpen(!menuOpen)}
          />
          {menuOpen && (
            <div className="absolute top-10 right-0 bg-gray-900 text-white rounded-lg shadow-lg p-3 flex flex-col w-40">
              <button
                className="p-2 hover:bg-gray-700 rounded-lg"
                onClick={() => {
                  setActiveTab("classes");
                  setMenuOpen(false);
                }}
              >
                Classes
              </button>
              <button
                className="p-2 hover:bg-gray-700 rounded-lg"
                onClick={() => {
                  setActiveTab("online");
                  setMenuOpen(false);
                }}
              >
                Online Courses
              </button>
            </div>
          )}
        </div>
      </DashboardHeader>

      <Separator className="bg-gray-400 my-4" />

      {/* 🔹 CONTENIDO */}
      {loading ? (
        <Loader />
      ) : (
        <div className="mt-6">
          {activeTab === "classes" ? (
            <>
              <div className="flex items-center justify-between">
                <p className="text-lg font-bold text-gray-800">Driving Classes</p>
                <div className="flex gap-2">
                  <Button
                    className="bg-purple-600 hover:bg-purple-700 text-white"
                    onClick={() => setIsClassTypeManagerOpen(true)}
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    Manage Types
                  </Button>
                  <Button
                    className="bg-blue-500 text-white"
                    onClick={() => router.push("/classes/new")}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Create Class
                  </Button>

                  {/* SEO Button para página general de Driving Lessons */}
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button
                        variant="outline"
                        className="border-2 border-blue-500 text-blue-600 hover:bg-blue-50 font-semibold"
                      >
                        SEO
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>SEO Settings - Driving Lessons Page</DialogTitle>
                      </DialogHeader>
                      <SeoTab entityType="DrivingLessons" />
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
              <Separator className="bg-gray-400 my-4" />
              <DataTable columns={classesColumns} data={classes} searchKey="title" />
            </>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <p className="text-lg font-bold text-gray-800">Online Courses</p>
                <Button
                  className="bg-green-500 text-white"
                  onClick={() => router.push("/online-courses/new")}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Course
                </Button>
              </div>
              <Separator className="bg-gray-400 my-4" />
              {onlineCourses.length > 0 ? (
                <DataTable columns={onlineCoursesColumns} data={onlineCourses} searchKey="title" />
              ) : (
                <p className="text-gray-600">No courses available yet.</p>
              )}
            </>
          )}
        </div>
      )}

      {/* Class Type Manager Modal */}
      <ClassTypeManager
        isOpen={isClassTypeManagerOpen}
        onClose={() => setIsClassTypeManagerOpen(false)}
      />
    </div>
  );
};

export default DrivingClassesDashboard;
