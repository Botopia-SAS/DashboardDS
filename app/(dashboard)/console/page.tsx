'use client';

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { Card, CardContent } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

const Heatmap = dynamic(() => import("@/components/Heatmap"), { ssr: false });

export default function Dashboard() {
  const [heatmapData, setHeatmapData] = useState<{ x: number; y: number; value: number; pathname: string }[]>([]);
  const [eventsByType, setEventsByType] = useState<{ event_type: string; count: number }[]>([]);
  const [stats, setStats] = useState({ users: 0, totalEvents: 0, avgSession: 0 });
  const [loading, setLoading] = useState(true);
  const [selectedPage, setSelectedPage] = useState("");

  const pageImages: Record<string, string> = {
    "/": "/images/home.png",  // La ruta de las imágenes
    "/Book-Now": "/images/book-now.png",
    "/Lessons": "/images/lessons.png",
    // Agregar más páginas y sus imágenes correspondientes
  };

  useEffect(() => {
    setLoading(true);
    fetch("/api/heatmap")
      .then((res) => res.json())
      .then((data) => {
        console.log("🚀 Datos recibidos de API:", data);

        if (data.success) {
          setHeatmapData(data.heatmap || []);
          setEventsByType(data.eventsByType || []);
          setStats({
            users: data.users || 0,
            totalEvents: data.totalEvents || 0,
            avgSession: data.avgSession || 0,
          });

          const uniquePages: string[] = [...new Set((data.heatmap as { pathname: string }[]).map((d) => d.pathname))];
          console.log("📝 Páginas detectadas:", uniquePages);

          if (uniquePages.length > 0 && !selectedPage) {
            setSelectedPage(uniquePages[0]);
          }
        } else {
          console.error("❌ Error en API:", data.error);
        }
      })
      .catch((err) => console.error("Error fetching heatmap data:", err))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    console.log("🔍 Página seleccionada:", selectedPage);
  }, [selectedPage]);

  return (
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
              {[...new Set(heatmapData.map((d) => d.pathname))].map((page, index) => (
                <option key={`${page}-${index}`} value={page}>
                  {page || "Página sin nombre"}
                </option>
              ))}
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
            <div className="relative w-full h-[700px] border overflow-hidden">
              {/* Imagen de vista previa */}
              <img
                src={pageImages[selectedPage] || "/images/default.png"} // Usa la imagen correspondiente
                alt={`Vista previa de ${selectedPage}`}
                className="absolute top-0 left-0 w-full h-full object-cover z-0"  // Asegura que la imagen esté en el fondo
              />

              {/* Heatmap sobre la imagen */}
              {!loading && heatmapData.length > 0 && (
                <div className="absolute top-0 left-0 w-full h-full pointer-events-none z-10 bg-transparent">
                  <Heatmap data={heatmapData.filter((d) => d.pathname === selectedPage)} />
                </div>
              )}
            </div>

          ) : (
            <p className="text-gray-500">Selecciona una página para ver la vista previa.</p>
          )}
        </CardContent>
      </Card>

      {/* Stats Section */}
      <div className="grid gap-4">
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
            <h2 className="text-lg font-semibold">Tiempo Promedio de Sesión</h2>
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
  );
}
