"use client";

import Link from "next/link";
import { useEffect, useState, useRef, useLayoutEffect } from "react";
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
import ActiveUsersCard from "@/components/ui/ActiveUsersCard";
import InactiveUsersCard from "@/components/ui/InactiveUsersCard";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { usePathname } from "next/navigation";
import DashboardHeader from "@/components/layout/DashboardHeader";

function ConsolePage() {
  const pathname = usePathname();

  const Heatmap = dynamic(() => import("@/components/Heatmap"), { ssr: false });
  const [heatmapData, setHeatmapData] = useState<
    {
      x: number;
      y: number;
      value: number;
      pathname: string;
      event_type?: string;
      screenWidth?: number;
      screenHeight?: number;
    }[]
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

  const containerRef = useRef<HTMLDivElement | null>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const [imageNatural, setImageNatural] = useState({ width: 1920, height: 1080 });
  const [imageRenderedSize, setImageRenderedSize] = useState({ width: 1920, height: 1080 });

  const pageImages: Record<string, string> = {
    "/": "/images/home.png",
    "/Lessons": "/images/lessons.png",
    "/OnlineCourses": "/images/OnlineCourses.png",
    "/Packages": "/images/packages.png",
    "/Classes": "/images/Classes.png",
    "/Location": "/images/location.png",
    "/FAQ": "/images/faq.png",
    "/Book-Now": "/images/book-now.png",
    // You can add more routes and images here if you add more pages
  };

  // El tamaño del canvas y heatmap será el natural de la imagen
  const baseWidth = imageNatural.width;
  const baseHeight = imageNatural.height;

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

  useLayoutEffect(() => {
    if (!containerRef.current) return;
    const updateSize = () => {
      // const maxWidth = Math.min(containerRef.current!.offsetWidth, 1400);
      // const aspect = imageNatural.height / imageNatural.width;
      // No need to update containerSize since we're not using it anymore
    };
    updateSize();
    const resizeObserver = new window.ResizeObserver(updateSize);
    resizeObserver.observe(containerRef.current);

    // Detectar cambios de zoom usando solo eventos automáticos
    const handleZoomChange = () => {
      updateSize();
    };
    
    // Usar eventos nativos del navegador - sin polling
    window.addEventListener('resize', updateSize);
    window.addEventListener('orientationchange', updateSize);
    
    // Detectar zoom usando eventos de media query
    const mediaQuery = window.matchMedia('(min-resolution: 1dppx)');
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleZoomChange);
    } else {
      // Fallback para navegadores antiguos
      mediaQuery.addListener(handleZoomChange);
    }

    // --- NUEVO: Observer para la imagen ---
    let imgResizeObserver: ResizeObserver | null = null;
    if (imgRef.current) {
      imgResizeObserver = new window.ResizeObserver(() => {
        setImageRenderedSize({
          width: imgRef.current?.offsetWidth || baseWidth,
          height: imgRef.current?.offsetHeight || baseHeight,
        });
      });
      imgResizeObserver.observe(imgRef.current);
      // Inicializa el tamaño
      setImageRenderedSize({
        width: imgRef.current.offsetWidth || baseWidth,
        height: imgRef.current.offsetHeight || baseHeight,
      });
    }

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', updateSize);
      window.removeEventListener('orientationchange', updateSize);
      
      // Limpiar el listener de media query
      const mediaQuery = window.matchMedia('(min-resolution: 1dppx)');
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', handleZoomChange);
      } else {
        // Fallback para navegadores antiguos
        mediaQuery.removeListener(handleZoomChange);
      }
      
      if (imgResizeObserver && imgRef.current) imgResizeObserver.disconnect();
    };
  }, [imageNatural, selectedPage]);

  return (
    <div className="w-full">
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
      
      <DashboardHeader title="Console Dashboard">
        <div className="flex gap-2 sm:gap-6 items-center flex-wrap">
          <Link
            href="/console/analytics"
            className="px-2 sm:px-4 py-2 text-sm rounded-lg hover:bg-gray-700"
          >
            Analytics
          </Link>
          <Link
            href="/console/faq"
            className="px-2 sm:px-4 py-2 text-sm rounded-lg hover:bg-gray-700"
          >
            FAQ
          </Link>
          <Link
            href="/console/contact"
            className="px-2 sm:px-4 py-2 text-sm rounded-lg hover:bg-gray-700"
          >
            Contact
          </Link>
        </div>
      </DashboardHeader>

      {/* Active Users (row 1) */}
      <div className="mb-6">
        <ActiveUsersCard language="en" />
      </div>
      
      {/* Inactive Users (row 2) */}
      <div className="mb-6">
        <InactiveUsersCard language="en" />
      </div>
      {/* Metrics (row 3, 3 columns) */}
      <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-6">
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
      <div className="mb-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
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
      <div className="mb-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
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
              <div
                className="relative w-full border bg-gray-50 overflow-y-auto"
                style={{ height: 800 }}
              >
                <div
                  className="relative w-full"
                  style={{ width: '100%' }}
                >
                  <div
                    ref={containerRef}
                    className="relative w-full"
                    style={{ width: '100%', height: 'auto', aspectRatio: `${baseWidth} / ${baseHeight}` }}
                  >
                    <Image
                      ref={imgRef}
                      src={pageImages[selectedPage] || "/images/default.png"}
                      alt={`Preview of ${selectedPage}`}
                      className="w-full h-auto object-contain object-top block"
                      width={baseWidth}
                      height={baseHeight}
                      onLoadingComplete={img => setImageNatural({ width: img.naturalWidth, height: img.naturalHeight })}
                      priority
                    />
                    {/* Heatmap over the image */}
                    {!loading && heatmapData.length > 0 && (
                      <div
                        className="absolute top-0 left-0 w-full h-full pointer-events-none z-10"
                        style={{ width: '100%', height: '100%' }}
                      >
                        <Heatmap
                          data={
                            heatmapData
                              .filter(
                                (d) =>
                                  d.pathname === selectedPage &&
                                  (d.event_type === 'click' || d.event_type === 'move') &&
                                  typeof d.x === 'number' &&
                                  typeof d.y === 'number'
                              )
                              .map((d) => {
                                const screenWidth = d.screenWidth ?? imageNatural.width;
                                const screenHeight = d.screenHeight ?? imageNatural.height;
                                const relX = d.x / screenWidth;
                                const relY = d.y / screenHeight;
                                // Usa el tamaño real de la imagen renderizada (actualizado con observer)
                                const scaledWidth = imageRenderedSize.width;
                                const scaledHeight = imageRenderedSize.height;
                                return {
                                  x: Math.round(relX * scaledWidth),
                                  y: Math.round(relY * scaledHeight),
                                  value: d.value || 1,
                                };
                              })
                          }
                        />
                      </div>
                    )}
                  </div>
                </div>
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
