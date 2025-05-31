import { connectToDB } from "@/lib/mongoDB";
import Session from "@/lib/modals/Session";
import { NextResponse } from "next/server";

// Función para parsear userAgent
function parseUserAgent(ua = "") {
  let device = "Desktop";
  let os = "Unknown";
  let browser = "Other";
  if (/android/i.test(ua)) device = "Mobile";
  if (/iphone|ipad|ipod/i.test(ua)) device = "Mobile";
  if (/windows/i.test(ua)) os = "Windows";
  else if (/macintosh|mac os x/i.test(ua)) os = "Mac";
  else if (/linux/i.test(ua)) os = "Linux";
  else if (/android/i.test(ua)) os = "Android";
  else if (/iphone|ipad|ipod/i.test(ua)) os = "iOS";
  if (/chrome/i.test(ua)) browser = "Chrome";
  else if (/firefox/i.test(ua)) browser = "Firefox";
  else if (/safari/i.test(ua) && !/chrome/i.test(ua)) browser = "Safari";
  else if (/edge/i.test(ua)) browser = "Edge";
  else if (/opera|opr/i.test(ua)) browser = "Opera";
  return { device, os, browser };
}

export async function GET(request: Request) {
  await connectToDB();

  const { searchParams } = new URL(request.url);
  const period = searchParams.get('period') || 'day'; // day, week, month, custom
  const startDate = searchParams.get('startDate');
  const endDate = searchParams.get('endDate');

  // Calcular el rango de fechas basado en el período
  let dateRange = { start: new Date(), end: new Date() };
  if (period === 'day') {
    dateRange.start.setHours(0, 0, 0, 0);
  } else if (period === 'week') {
    dateRange.start.setDate(dateRange.start.getDate() - 7);
  } else if (period === 'month') {
    dateRange.start.setMonth(dateRange.start.getMonth() - 1);
  } else if (period === 'custom' && startDate && endDate) {
    dateRange.start = new Date(startDate);
    dateRange.end = new Date(endDate);
  }

  // Consulta base
  const query = {
    startTimestamp: { $gte: dateRange.start, $lte: dateRange.end }
  };

  // Obtener todas las sesiones en el rango de fechas
  const sessions = await Session.find(query);

  // Estadísticas de páginas
  const pageStats = new Map();
  const deviceStats = new Map();
  const browserStats = new Map();
  const osStats = new Map();
  const countryStats = new Map();
  const cityStats = new Map();
  const hourlyStats = new Array(24).fill(0);
  const dailyStats = new Array(7).fill(0);

  sessions.forEach(session => {
    // Estadísticas por hora y día
    const startHour = new Date(session.startTimestamp).getHours();
    const startDay = new Date(session.startTimestamp).getDay();
    hourlyStats[startHour]++;
    dailyStats[startDay]++;

    // Estadísticas de dispositivos, navegadores y SO
    if (session.userAgent) {
      const { device, os, browser } = parseUserAgent(session.userAgent);
      deviceStats.set(device, (deviceStats.get(device) || 0) + 1);
      browserStats.set(browser, (browserStats.get(browser) || 0) + 1);
      osStats.set(os, (osStats.get(os) || 0) + 1);
    }

    // Estadísticas de ubicación
    if (session.geolocation) {
      const { country, city } = session.geolocation;
      if (country) countryStats.set(country, (countryStats.get(country) || 0) + 1);
      if (city) cityStats.set(city, (cityStats.get(city) || 0) + 1);
    }

    // Estadísticas de páginas
    const pages = (session.pages as Array<{
      url: string;
      referrer?: string;
      timestamp: Date;
      duration?: number;
      heatmap?: any[];
    }>) || [];

    pages.forEach((page, idx) => {
      const url = page.url.replace(/^https?:\/\/[^/]+/, "");
      let duration = page.duration || 0;
      const pageTimestamp = new Date(page.timestamp).getTime();
      // Si duration es 0 o no existe
      if (!duration || duration === 0) {
        if (idx < pages.length - 1) {
          // No es la última página: usar diferencia con la siguiente
          const nextTimestamp = new Date(pages[idx + 1].timestamp).getTime();
          if (nextTimestamp > pageTimestamp) {
            duration = nextTimestamp - pageTimestamp;
          }
        } else {
          // Es la última página: usar endTimestamp o lastActive
          let end = session.endTimestamp ? new Date(session.endTimestamp).getTime() : undefined;
          if (!end && session.lastActive) {
            end = new Date(session.lastActive).getTime();
          }
          if (end && end > pageTimestamp) {
            duration = end - pageTimestamp;
          }
        }
      }
      // Si duration sigue siendo 0, lo dejamos en 0
      const stats = pageStats.get(url) || {
        visits: 0,
        totalTime: 0,
        uniqueUsers: new Set(),
        lastVisit: null
      };
      stats.visits++;
      stats.totalTime += duration;
      if (session.userId) stats.uniqueUsers.add(session.userId);
      if (!stats.lastVisit || new Date(page.timestamp) > new Date(stats.lastVisit)) {
        stats.lastVisit = page.timestamp;
      }
      pageStats.set(url, stats);
    });
  });

  // Convertir las estadísticas de páginas a un formato más amigable
  const pagesData = Array.from(pageStats.entries()).map(([url, stats]) => ({
    url,
    visits: stats.visits,
    totalTime: stats.totalTime,
    avgTime: stats.visits > 0 ? stats.totalTime / stats.visits : 0,
    uniqueUsers: stats.uniqueUsers.size,
    lastVisit: stats.lastVisit
  })).sort((a, b) => b.visits - a.visits);

  return NextResponse.json({
    success: true,
    data: {
      period,
      dateRange: {
        start: dateRange.start,
        end: dateRange.end
      },
      totalSessions: sessions.length,
      pages: pagesData || [],
      devices: Array.from(deviceStats.entries()).map(([device, count]) => ({ device, count })) || [],
      browsers: Array.from(browserStats.entries()).map(([browser, count]) => ({ browser, count })) || [],
      os: Array.from(osStats.entries()).map(([os, count]) => ({ os, count })) || [],
      countries: Array.from(countryStats.entries()).map(([country, count]) => ({ country, count })) || [],
      cities: Array.from(cityStats.entries()).map(([city, count]) => ({ city, count })) || [],
      hourlyDistribution: hourlyStats || [],
      dailyDistribution: dailyStats || []
    }
  });
} 