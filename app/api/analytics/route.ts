import dbConnect from '@/lib/dbConnect';
import ResumenSeccion from '@/lib/models/ResumenSeccion';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  await dbConnect();

  const { searchParams } = new URL(request.url);
  const period = searchParams.get('period') || 'day'; // day, week, month, custom
  const startDate = searchParams.get('startDate');
  const endDate = searchParams.get('endDate');

  // Calcular el rango de fechas basado en el período
  const dateRange: { start: Date; end: Date } = { start: new Date(), end: new Date() };
  if (period === 'day') {
    dateRange.start.setHours(0, 0, 0, 0);
    dateRange.end = new Date();
  } else if (period === 'week') {
    dateRange.start.setDate(dateRange.start.getDate() - 7);
    dateRange.start.setHours(0, 0, 0, 0);
    dateRange.end = new Date();
  } else if (period === 'month') {
    dateRange.start.setMonth(dateRange.start.getMonth() - 1);
    dateRange.start.setHours(0, 0, 0, 0);
    dateRange.end = new Date();
  } else if (period === 'custom' && startDate && endDate) {
    dateRange.start = new Date(startDate);
    dateRange.end = new Date(endDate);
  }

  // Buscar resúmenes diarios en el rango
  const startStr = dateRange.start.toISOString().slice(0, 10);
  const endStr = dateRange.end.toISOString().slice(0, 10);
  const resumenes = await ResumenSeccion.find({
    date: { $gte: startStr, $lte: endStr }
  }).lean();

  // Acumuladores globales
  let totalSessions = 0;
  const pageStats = new Map();
  const deviceStats = new Map();
  const browserStats = new Map();
  const countryStats = new Map();
  const cityStats = new Map();
  const hourlyStats = new Array(24).fill(0);
  const dailyStats = new Array(7).fill(0);

  resumenes.forEach((resumen: any) => {
    totalSessions += resumen.totalSessions || 0;
    // Devices
    Object.entries(resumen.devices || {}).forEach(([device, count]) => {
      deviceStats.set(device, (deviceStats.get(device) || 0) + (count as number));
    });
    // Browsers
    Object.entries(resumen.browsers || {}).forEach(([browser, count]) => {
      browserStats.set(browser, (browserStats.get(browser) || 0) + (count as number));
    });
    // Países
    Object.entries(resumen.countries || {}).forEach(([country, count]) => {
      countryStats.set(country, (countryStats.get(country) || 0) + (count as number));
    });
    // Ciudades
    Object.entries(resumen.cities || {}).forEach(([city, count]) => {
      cityStats.set(city, (cityStats.get(city) || 0) + (count as number));
    });
    // Horas
    Object.entries(resumen.sessionsByHour || {}).forEach(([hour, count]) => {
      const h = parseInt(hour, 10);
      if (!isNaN(h) && h >= 0 && h < 24) hourlyStats[h] += count as number;
    });
    // Páginas
    (resumen.sessions || []).forEach((session: any) => {
      (session.pages || []).forEach((page: any) => {
        const url = page.url;
        const stats = pageStats.get(url) || {
          visits: 0,
          totalTime: 0,
          uniqueUsers: new Set(),
          lastVisit: null
        };
        stats.visits++;
        stats.totalTime += page.duration;
        if (session.userId) stats.uniqueUsers.add(session.userId);
        if (!stats.lastVisit || new Date(page.pageStart) > new Date(stats.lastVisit)) {
          stats.lastVisit = page.pageStart;
        }
        pageStats.set(url, stats);
      });
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
      totalSessions,
      pages: pagesData || [],
      devices: Array.from(deviceStats.entries()).map(([device, count]) => ({ device, count })) || [],
      browsers: Array.from(browserStats.entries()).map(([browser, count]) => ({ browser, count })) || [],
      countries: Array.from(countryStats.entries()).map(([country, count]) => ({ country, count })) || [],
      cities: Array.from(cityStats.entries()).map(([city, count]) => ({ city, count })) || [],
      hourlyDistribution: hourlyStats || [],
      dailyDistribution: dailyStats || []
    }
  });
} 