import dbConnect from '@/lib/dbConnect';
import ResumenSeccion from '@/lib/models/ResumenSeccion';
import Session, { ISession } from '@/lib/modals/Session';
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

  if (period === 'day') {
    // --- Lógica en tiempo real desde 'sessions' ---
    const query = {
      startTimestamp: { $gte: dateRange.start, $lte: dateRange.end }
    };
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

    sessions.forEach((session: ISession) => {
      // Estadísticas por hora y día
      const startHour = new Date(session.startTimestamp).getHours();
      const startDay = new Date(session.startTimestamp).getDay();
      hourlyStats[startHour]++;
      dailyStats[startDay]++;

      // Estadísticas de dispositivos, navegadores y SO
      if (session.userAgent) {
        let device = 'Desktop', os = 'Unknown', browser = 'Other';
        if (/android/i.test(session.userAgent)) device = 'Mobile';
        if (/iphone|ipad|ipod/i.test(session.userAgent)) device = 'Mobile';
        if (/windows/i.test(session.userAgent)) os = 'Windows';
        else if (/macintosh|mac os x/i.test(session.userAgent)) os = 'Mac';
        else if (/linux/i.test(session.userAgent)) os = 'Linux';
        else if (/android/i.test(session.userAgent)) os = 'Android';
        else if (/iphone|ipad|ipod/i.test(session.userAgent)) os = 'iOS';
        if (/chrome/i.test(session.userAgent)) browser = 'Chrome';
        else if (/firefox/i.test(session.userAgent)) browser = 'Firefox';
        else if (/safari/i.test(session.userAgent) && !/chrome/i.test(session.userAgent)) browser = 'Safari';
        else if (/edge/i.test(session.userAgent)) browser = 'Edge';
        else if (/opera|opr/i.test(session.userAgent)) browser = 'Opera';
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
      const pages = (session.pages as any[]) || [];
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

  // --- Lógica para week, month, custom: usar resumen diario ---
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
          lastVisit: null,
          clicks: 0,
          scrolls: 0,
          moves: 0
        };
        stats.visits++;
        stats.totalTime += page.duration;
        stats.clicks += page.events?.click || 0;
        stats.scrolls += page.events?.scroll || 0;
        stats.moves += page.events?.move || 0;
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
    lastVisit: stats.lastVisit,
    clicks: stats.clicks,
    scrolls: stats.scrolls,
    moves: stats.moves
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
      os: [],
      countries: Array.from(countryStats.entries()).map(([country, count]) => ({ country, count })) || [],
      cities: Array.from(cityStats.entries()).map(([city, count]) => ({ city, count })) || [],
      hourlyDistribution: hourlyStats || [],
      dailyDistribution: dailyStats || []
    }
  });
} 