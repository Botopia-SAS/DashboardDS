"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { Card, CardContent } from "@/components/ui/card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Menu, X } from "lucide-react"; // Íconos de menú
import ActiveUsersCard from "@/components/ui/ActiveUsersCard";
import InactiveUsersCard from "@/components/ui/InactiveUsersCard";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { usePathname } from "next/navigation";

function ConsolePage() {
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();

  const Heatmap = dynamic(() => import("@/components/Heatmap"), { ssr: false });
  // ✅ Corrección
  const [heatmapData, setHeatmapData] = useState<
    { x: number; y: number; value: number; pathname: string }[]
  >([]);
  const [eventsByType, setEventsByType] = useState<
    { event_type: string; count: number }[]
  >([]);
  const [stats, setStats] = useState({
    users: 0,
    totalEvents: 0,
    avgSession: 0,
  });
  const [loading, setLoading] = useState(true);
  const [selectedPage, setSelectedPage] = useState("");

  const pageImages: Record<string, string> = {
    "/": "/images/home.png",
    "/Lessons": "/images/lessons.png",
    "/OnlineCourses": "/images/OnlineCourses.png",
    "/Packages": "/images/packages.png",
    "/Classes": "/images/Classes.png",
    "/Location": "/images/location.png",
    "/FAQ": "/images/faq.png",
    // You can add more routes and images here if you add more pages
  };

  useEffect(() => {
    setLoading(true);
    fetch("/api/heatmap")
      .then((res) => res.json())
      .then((data) => {
        //console.log("🚀 Datos recibidos de API:", data);

        if (data.success) {
          setHeatmapData(data.heatmap || []);
          setEventsByType(data.eventsByType || []);
          setStats({
            users: data.users || 0,
            totalEvents: data.totalEvents || 0,
            avgSession: data.avgSession || 0,
          });

          const uniquePages: string[] = [
            ...new Set(
              (data.heatmap as { pathname: string }[]).map((d) => d.pathname)
            ),
          ];
          //console.log("📝 Páginas detectadas:", uniquePages);

          if (uniquePages.length > 0 && !selectedPage) {
            setSelectedPage(uniquePages[0]);
          }
        } else {
          console.error("❌ Error en API:", data.error);
        }
      })
      .catch((err) => console.error("Error fetching heatmap data:", err))
      .finally(() => setLoading(false));
  }, [selectedPage]);

  return (
    <div>
      <div className="p-6">
        {/* Mostrar Back to Console solo si NO estamos en /console */}
        {pathname !== "/console" && (
          <div className="flex items-center mb-4">
            <Link href="/console">
              <Button variant="ghost" size="sm" className="flex items-center gap-1">
                <ArrowLeft className="w-4 h-4" /> Back to Console
              </Button>
            </Link>
            <h1 className="text-xl font-semibold flex-1 text-center">Console Dashboard</h1>
          </div>
        )}
        {/* 🔹 MENÚ SUPERIOR */}
        <div className="flex justify-between items-center bg-gray-800 text-white px-5 py-3 rounded-lg shadow-md">
          <h1 className="text-xl font-semibold text-white">Console Dashboard</h1>
          <div className="flex gap-6 items-center">
            <Link
              href="/console/user"
              className="px-4 py-2 rounded-lg hover:bg-gray-700"
            >
              Users
            </Link>
            <Link
              href="/console"
              className="px-4 py-2 rounded-lg hover:bg-gray-700"
            >
              Analytics
            </Link>
            <Link
              href="/console/faq"
              className="px-4 py-2 rounded-lg hover:bg-gray-700"
            >
              FAQ
            </Link>
            <Link
              href="/console/contact"
              className="px-4 py-2 rounded-lg hover:bg-gray-700"
            >
              Contact
            </Link>
          </div>
        </div>
      </div>
      {/* Active Users (row 1) */}
      <div className="p-6">
        <ActiveUsersCard language="en" />
      </div>
      {/* Inactive Users (row 2) */}
      <div className="p-6">
        <InactiveUsersCard language="en" />
      </div>
      {/* Metrics (row 3, 3 columns) */}
      <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent>
            <h2 className="text-lg font-semibold">Unique Users</h2>
            <p className="text-3xl font-bold">{stats.users}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <h2 className="text-lg font-semibold">Total Events</h2>
            <p className="text-3xl font-bold">{stats.totalEvents}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <h2 className="text-lg font-semibold">Average Session Time</h2>
            <p className="text-3xl font-bold">{stats.avgSession} min</p>
          </CardContent>
        </Card>
      </div>
      {/* Stats Section and events by type chart */}
      <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="col-span-3">
          <CardContent>
            <h2 className="text-xl font-bold">Events by Type</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={eventsByType}>
                <XAxis dataKey="event_type" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
      {/* Page selector and preview with heatmap below everything */}
      <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="col-span-3">
          <CardContent>
            <h2 className="text-xl font-bold">Select Page</h2>
            {heatmapData.length > 0 ? (
              <select
                className="mt-2 p-2 border rounded w-full"
                value={selectedPage}
                onChange={(e) => setSelectedPage(e.target.value)}
              >
                {[...new Set(heatmapData.map((d) => d.pathname))].map(
                  (page, index) => (
                    <option key={`${page}-${index}`} value={page}>
                      {page || "Unnamed Page"}
                    </option>
                  )
                )}
              </select>
            ) : (
              <p className="text-gray-500">No pages available.</p>
            )}
          </CardContent>
        </Card>
        <Card className="col-span-3 relative">
          <CardContent>
            <h2 className="text-xl font-bold">Preview with Heatmap</h2>
            {selectedPage ? (
              <div className="relative w-full h-[1400px] border overflow-y-auto bg-gray-50">
                <Image
                  src={pageImages[selectedPage] || "/images/default.png"}
                  alt={`Preview of ${selectedPage}`}
                  className="w-full block"
                  fill
                  sizes="100vw"
                  priority
                />
                {/* Heatmap over the image */}
                {!loading && heatmapData.length > 0 && (
                  <div
                    className="absolute top-0 left-0 w-full h-full pointer-events-none z-10"
                    style={{ height: '1400px' }}
                  >
                    <Heatmap
                      data={heatmapData.filter((d) => d.pathname === selectedPage)}
                    />
                  </div>
                )}
              </div>
            ) : (
              <p className="text-gray-500">
                Select a page to see the preview.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default ConsolePage;
