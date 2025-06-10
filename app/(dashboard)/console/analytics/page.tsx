"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { format, subDays, subMonths } from "date-fns";
import { CalendarIcon, Users, Clock, Globe, Monitor, ArrowLeft } from "lucide-react";

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

// Define tipos para los eventos de heatmap
interface HeatmapEvent {
  x: number;
  y: number;
  value: number;
  pathname: string;
  event_type: string;
  timestamp?: string;
}

interface HeatmapResponse {
  success: boolean;
  heatmap: HeatmapEvent[];
}

// Define tipos para los datos de analytics
interface AnalyticsDevice { device: string; count: number; }
interface AnalyticsBrowser { browser: string; count: number; }
interface AnalyticsOS { os: string; count: number; }
interface AnalyticsPage { url: string; uniqueUsers: number; visits: number; totalTime: number; avgTime?: number; lastVisit?: string; }
interface AnalyticsCountry { country: string; count: number; }
interface AnalyticsCity { city: string; count: number; }
interface AnalyticsData {
  totalSessions: number;
  pages: AnalyticsPage[];
  devices: AnalyticsDevice[];
  browsers: AnalyticsBrowser[];
  os: AnalyticsOS[];
  countries: AnalyticsCountry[];
  cities: AnalyticsCity[];
  hourlyDistribution: number[];
  dailyDistribution: number[];
}

export default function AnalyticsPage() {
  const [period, setPeriod] = useState("day");
  const now = new Date();
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);

  const [dateRange, setDateRange] = useState({
    start: todayStart,
    end: now,
  });
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const pathname = usePathname();
  const [modalPage, setModalPage] = useState<string | null>(null);
  const [clickEvents, setClickEvents] = useState<HeatmapEvent[]>([]);
  const [clicksByPage, setClicksByPage] = useState<Record<string, number>>({});

  useEffect(() => {
    fetchData();
    // Obtener y filtrar clicks por página y periodo
    const start = dateRange.start.toISOString();
    const end = dateRange.end.toISOString();
    fetch(`/api/heatmap?start=${start}&end=${end}`)
      .then(res => res.json())
      .then((result: HeatmapResponse) => {
        if (result.success && result.heatmap) {
          const clicks: Record<string, number> = {};
          // Convertir el rango de fechas a UTC y cubrir todo el día
          const startUTC = new Date(dateRange.start);
          startUTC.setUTCHours(0, 0, 0, 0);
          const endUTC = new Date(dateRange.end);
          endUTC.setUTCHours(23, 59, 59, 999);

          result.heatmap.forEach((e) => {
            if (e.event_type === 'click' && e.timestamp) {
              const ts = new Date(e.timestamp).getTime();
              if (!isNaN(ts) && ts >= startUTC.getTime() && ts <= endUTC.getTime()) {
                const pageKey = e.pathname;
                if (pageKey) {
                  clicks[pageKey] = (clicks[pageKey] || 0) + 1;
                }
              }
            }
          });
          setClicksByPage(clicks);
        }
      });
    // eslint-disable-next-line
  }, [period, dateRange]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        period,
        startDate: dateRange.start.toISOString(),
        endDate: dateRange.end.toISOString(),
      });
      const response = await fetch(`/api/analytics?${params}`);
      const result = await response.json();
      if (result.success) {
        setData(result.data);
      }
    } catch {
      // Error silenciado
    } finally {
      setLoading(false);
    }
  };

  const handlePeriodChange = (value: string) => {
    setPeriod(value);
    const now = new Date();
    switch (value) {
      case "day":
        setDateRange({
          start: new Date(now.setHours(0, 0, 0, 0)),
          end: new Date(),
        });
        break;
      case "week":
        setDateRange({
          start: subDays(now, 7),
          end: new Date(),
        });
        break;
      case "month":
        setDateRange({
          start: subMonths(now, 1),
          end: new Date(),
        });
        break;
    }
  };

  const handleDateInput = (type: 'start' | 'end', value: string) => {
    setDateRange((prev) => ({
      ...prev,
      [type]: new Date(value)
    }));
  };

  const formatDuration = (ms: number) => {
    if (!ms || isNaN(ms)) return "0s";
    const totalSeconds = Math.floor(ms / 1000);
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    if (h > 0) return `${h}h ${m}m ${s}s`;
    if (m > 0) return `${m}m ${s}s`;
    return `${s}s`;
  };

  // Función para abrir el modal de eventos de click
  const handleShowClicks = async (pageUrl: string) => {
    // Buscar eventos de click para esa página
    try {
      const res = await fetch(`/api/heatmap`);
      const result: HeatmapResponse = await res.json();
      if (result.success && result.heatmap) {
        const clicks: HeatmapEvent[] = result.heatmap.filter((e: HeatmapEvent) => e.pathname === pageUrl && e.event_type === 'click');
        if (clicks.length > 0) {
          setClickEvents(clicks);
          setModalPage(pageUrl);
        }
      }
    } catch {
      // No mostrar modal si hay error
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Back to Console Button */}
      {pathname === "/console/analytics" && (
        <div className="flex items-center mb-4 relative">
          <Link href="/console">
            <Button variant="ghost" size="sm" className="flex items-center gap-1">
              <ArrowLeft className="w-4 h-4" /> Back to Console
            </Button>
          </Link>
          <div className="flex-1 flex justify-center absolute left-0 right-0 pointer-events-none">
            <h1 className="text-xl font-semibold text-center">Analytics</h1>
          </div>
        </div>
      )}
      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
        <Select key={pathname} value={period} onValueChange={handlePeriodChange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select period" />
          </SelectTrigger>
          <SelectContent className="bg-white">
            <SelectItem value="day">Today</SelectItem>
            <SelectItem value="week">Last week</SelectItem>
            <SelectItem value="month">Last month</SelectItem>
            <SelectItem value="custom">Custom</SelectItem>
          </SelectContent>
        </Select>
        {period === "custom" && (
          <div className="flex gap-2 items-center">
            <label className="flex items-center gap-2">
              <CalendarIcon className="h-4 w-4" />
              <input
                type="date"
                value={format(dateRange.start, "yyyy-MM-dd")}
                onChange={e => handleDateInput('start', e.target.value)}
                className="border rounded px-2 py-1"
              />
            </label>
            <span>-</span>
            <label className="flex items-center gap-2">
              <CalendarIcon className="h-4 w-4" />
              <input
                type="date"
                value={format(dateRange.end, "yyyy-MM-dd")}
                onChange={e => handleDateInput('end', e.target.value)}
                className="border rounded px-2 py-1"
              />
            </label>
          </div>
        )}
      </div>

      {/* Resumen */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent>
            <div className="flex flex-row items-center justify-between pb-2">
              <span className="text-sm font-medium">Total Sessions</span>
              <Users className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="text-2xl font-bold">{data?.totalSessions || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <div className="flex flex-row items-center justify-between pb-2">
              <span className="text-sm font-medium">Average Time</span>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="text-2xl font-bold">
              {data?.pages?.[0]?.avgTime ? formatDuration(data.pages[0].avgTime) : "0h 0m"}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <div className="flex flex-row items-center justify-between pb-2">
              <span className="text-sm font-medium">Devices</span>
              <Monitor className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="text-2xl font-bold">
              {data?.devices?.reduce((acc: number, curr: AnalyticsDevice) => acc + curr.count, 0) || 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <div className="flex flex-row items-center justify-between pb-2">
              <span className="text-sm font-medium">Countries</span>
              <Globe className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="text-2xl font-bold">{data?.countries?.length || 0}</div>
          </CardContent>
        </Card>
      </div>

      {/* Desglose de dispositivos, navegadores y SO */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent>
            <h3 className="text-md font-semibold mb-2">Devices</h3>
            <ul className="text-sm space-y-1">
              {data?.devices?.map((d: AnalyticsDevice, i: number) => (
                <li key={i} className="flex justify-between"><span>{d.device}</span><span className="font-bold">{d.count}</span></li>
              ))}
            </ul>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <h3 className="text-md font-semibold mb-2">Browsers</h3>
            <ul className="text-sm space-y-1">
              {data?.browsers?.map((b: AnalyticsBrowser, i: number) => (
                <li key={i} className="flex justify-between"><span>{b.browser}</span><span className="font-bold">{b.count}</span></li>
              ))}
            </ul>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <h3 className="text-md font-semibold mb-2">Operating Systems</h3>
            <ul className="text-sm space-y-1">
              {data?.os?.map((o: AnalyticsOS, i: number) => (
                <li key={i} className="flex justify-between">
                  <span>{
                    o.os === 'Mac' ? 'Apple (Mac)' :
                    o.os === 'iOS' ? 'Apple (iOS)' :
                    o.os
                  }</span>
                  <span className="font-bold">{o.count}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Hourly Distribution */}
        <Card>
          <CardContent>
            <h2 className="text-lg font-semibold mb-2">Sessions by Hour</h2>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data?.hourlyDistribution?.map((value: number, index: number) => ({
                  hour: `${index}:00`,
                  sessions: value
                }))}>
                  <XAxis dataKey="hour" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="sessions" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Device Distribution */}
        <Card>
          <CardContent>
            <h2 className="text-lg font-semibold mb-2">Devices</h2>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data?.devices}
                    dataKey="count"
                    nameKey="device"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    label
                  >
                    {data?.devices?.map((entry: AnalyticsDevice, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Pages */}
      <Card>
        <CardContent>
          <h2 className="text-lg font-semibold mb-2">Top Pages</h2>
          <div className="space-y-4">
            {data?.pages?.map((page: AnalyticsPage, index: number) => (
              <div
                key={index}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg cursor-default hover:bg-blue-50 transition"
              >
                <div className="space-y-1">
                  <p className="font-medium flex items-center gap-2">
                    {page.url}
                    <span className="text-xs bg-blue-100 text-blue-800 rounded-full px-2 py-0.5 ml-2">
                      {(typeof page.clicks === 'number' ? page.clicks : 0)} clicks
                    </span>
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-medium">{page.visits} visits</p>
                  <p className="text-sm text-gray-500">
                    {formatDuration(page.totalTime)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Locations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardContent>
            <h2 className="text-lg font-semibold mb-2">Countries</h2>
            <div className="space-y-4">
              {data?.countries?.slice(0, 5).map((country: AnalyticsCountry, index: number) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{getCountryFlag(country.country)}</span>
                    <span>{country.country}</span>
                  </div>
                  <span className="font-medium">{country.count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <h2 className="text-lg font-semibold mb-2">Cities</h2>
            <div className="space-y-4">
              {data?.cities?.slice(0, 5).map((city: AnalyticsCity, index: number) => (
                <div key={index} className="flex items-center justify-between">
                  <span>{city.city}</span>
                  <span className="font-medium">{city.count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Helper function to get country flag emoji
function getCountryFlag(country: string) {
  const flags: { [key: string]: string } = {
    'Colombia': '🇨🇴',
    'Mexico': '🇲🇽',
    'Argentina': '🇦🇷',
    'Spain': '🇪🇸',
    'United States': '🇺🇸',
    // Add more countries as needed
  };
  return flags[country] || '🌎';
}
