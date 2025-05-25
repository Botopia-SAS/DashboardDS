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

function ConsolePage() {
  const [menuOpen, setMenuOpen] = useState(false);

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
    // Puedes agregar más rutas e imágenes aquí si agregas más páginas
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
        {/* 🔹 MENÚ SUPERIOR */}
        <div className="flex justify-between items-center bg-gray-800 text-white px-5 py-3 rounded-lg shadow-md">
          <h1 className="text-xl font-semibold">Console Dashboard</h1>

          {/* 🔹 Menú Desktop */}
          <div className="hidden md:flex gap-6">
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
          </div>

          {/* 🔹 Menú Mobile (Hamburguesa) */}
          <div className="md:hidden">
            <button onClick={() => setMenuOpen(!menuOpen)}>
              {menuOpen ? (
                <X className="w-8 h-8" />
              ) : (
                <Menu className="w-8 h-8" />
              )}
            </button>
          </div>
        </div>

        {/* 🔹 Menú Mobile Desplegable */}
        {menuOpen && (
          <div className="md:hidden bg-gray-800 text-white p-4 rounded-lg mt-2 shadow-md">
            <Link
              href="/dashboard/console/users"
              className="block w-full text-left px-4 py-2 hover:bg-gray-700 rounded-lg"
              onClick={() => setMenuOpen(false)}
            >
              Users
            </Link>
            <Link
              href="/dashboard/console/analytics"
              className="block w-full text-left px-4 py-2 hover:bg-gray-700 rounded-lg"
              onClick={() => setMenuOpen(false)}
            >
              Analytics
            </Link>
            <Link
              href="/dashboard/console/faq"
              className="block w-full text-left px-4 py-2 hover:bg-gray-700 rounded-lg"
              onClick={() => setMenuOpen(false)}
            >
              FAQ
            </Link>
          </div>
        )}
      </div>
      <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Selector de página */}
        <Card className="col-span-3">
          <CardContent>
            <h2 className="text-xl font-bold">Seleccionar Página</h2>
            {heatmapData.length > 0 ? (
              <select
                className="mt-2 p-2 border rounded w-full"
                value={selectedPage}
                onChange={(e) => setSelectedPage(e.target.value)}
              >
                {[...new Set(heatmapData.map((d) => d.pathname))].map(
                  (page, index) => (
                    <option key={`${page}-${index}`} value={page}>
                      {page || "Página sin nombre"}
                    </option>
                  )
                )}
              </select>
            ) : (
              <p className="text-gray-500">No hay páginas disponibles.</p>
            )}
          </CardContent>
        </Card>

        {/* Contenedor de Heatmap y Vista Previa */}
        <Card className="col-span-3 relative">
          <CardContent>
            <h2 className="text-xl font-bold">Vista Previa con Heatmap</h2>
            {selectedPage ? (
              <div className="relative w-full h-[700px] border overflow-y-auto bg-gray-50">
                {/* Imagen de vista previa (tamaño real, no fill) */}
                {/* Usamos <img> en vez de <Image> porque necesitamos scroll y tamaño natural para el heatmap. */}
                <img
                  src={pageImages[selectedPage] || "/images/default.png"}
                  alt={`Vista previa de ${selectedPage}`}
                  className="w-full block"
                  style={{ position: "relative", zIndex: 0 }}
                />
                {/* Heatmap sobre la imagen */}
                {!loading && heatmapData.length > 0 && (
                  <div
                    className="absolute top-0 left-0 w-full h-full pointer-events-none z-10"
                    style={{}}
                  >
                    <Heatmap
                      data={heatmapData.filter((d) => d.pathname === selectedPage)}
                    />
                  </div>
                )}
              </div>
            ) : (
              <p className="text-gray-500">
                Selecciona una página para ver la vista previa.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Stats Section */}
        <div className="grid gap-4">
          <ActiveUsersCard />
          <InactiveUsersCard />
          <Card>
            <CardContent>
              <h2 className="text-lg font-semibold">Usuarios Únicos</h2>
              <p className="text-3xl font-bold">{stats.users}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent>
              <h2 className="text-lg font-semibold">Total de Eventos</h2>
              <p className="text-3xl font-bold">{stats.totalEvents}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent>
              <h2 className="text-lg font-semibold">
                Tiempo Promedio de Sesión
              </h2>
              <p className="text-3xl font-bold">{stats.avgSession} min</p>
            </CardContent>
          </Card>
        </div>

        {/* Events Breakdown */}
        <Card className="col-span-3">
          <CardContent>
            <h2 className="text-xl font-bold">Eventos por Tipo</h2>
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
    </div>
  );
}

export default ConsolePage;
