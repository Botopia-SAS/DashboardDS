import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '../../../../lib/dbConnect';
import Session from '../../../../lib/modals/Session';
import ResumenSeccion from '../../../../lib/models/ResumenSeccion';

function getBrowser(userAgent: string): string {
  if (!userAgent) return 'Unknown';
  if (userAgent.includes('Chrome')) return 'Chrome';
  if (userAgent.includes('Safari')) return 'Safari';
  if (userAgent.includes('Firefox')) return 'Firefox';
  if (userAgent.includes('Edge')) return 'Edge';
  return 'Other';
}

function getDevice(userAgent: string): string {
  if (!userAgent) return 'Unknown';
  if (/mobile/i.test(userAgent)) return 'Mobile';
  if (/android/i.test(userAgent)) return 'Mobile';
  if (/iPad|iPhone|iPod/.test(userAgent)) return 'Mobile';
  return 'Desktop';
}

function getHour(date: Date): string {
  return date.getHours().toString().padStart(2, '0');
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const secret = searchParams.get('secret');
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  await dbConnect();
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  const yesterday = new Date(today);
  yesterday.setUTCDate(today.getUTCDate() - 1);

  const sessions = await Session.find({
    startTimestamp: {
      $gte: yesterday,
      $lt: today
    }
  }).lean();

  if (!sessions.length) {
    return NextResponse.json({ message: 'No sessions found for yesterday.' });
  }

  const uniqueIPs = new Set();
  const uniqueUsers = new Set();
  const devices: Record<string, number> = {};
  const browsers: Record<string, number> = {};
  const countries: Record<string, number> = {};
  const cities: Record<string, number> = {};
  const sessionsByHour: Record<string, number> = {};
  let totalClicks = 0, totalScrolls = 0, totalMoves = 0, totalSessionDuration = 0;

  const resumenSesiones = sessions.map((session: typeof Session extends { prototype: infer T } ? T : never, idx: number) => {
    uniqueIPs.add(session.ipAddress);
    uniqueUsers.add(session.userId);
    const browser = getBrowser(session.userAgent);
    const device = getDevice(session.userAgent);
    devices[device] = (devices[device] || 0) + 1;
    browsers[browser] = (browsers[browser] || 0) + 1;
    if (session.geolocation) {
      countries[session.geolocation.country] = (countries[session.geolocation.country] || 0) + 1;
      cities[session.geolocation.city] = (cities[session.geolocation.city] || 0) + 1;
    }
    const hour = getHour(new Date(session.startTimestamp));
    sessionsByHour[hour] = (sessionsByHour[hour] || 0) + 1;
    const sessionStart = new Date(session.startTimestamp);
    const sessionEnd = session.endTimestamp ? new Date(session.endTimestamp) : new Date(session.lastActive || session.startTimestamp);
    const sessionDuration = (sessionEnd.getTime() - sessionStart.getTime()) / 1000;
    totalSessionDuration += sessionDuration;
    const pages = (session.pages || []).map((page: typeof session.pages[0], i: number, arr: typeof session.pages) => {
      const pageStart = new Date(page.timestamp);
      let pageEnd: Date;
      let duration: number;
      if (typeof page.duration === 'number' && page.duration > 0) {
        duration = page.duration;
        pageEnd = new Date(pageStart.getTime() + duration * 1000);
      } else if (i < arr.length - 1) {
        pageEnd = new Date(arr[i + 1].timestamp);
        duration = (pageEnd.getTime() - pageStart.getTime()) / 1000;
      } else {
        pageEnd = sessionEnd;
        duration = (pageEnd.getTime() - pageStart.getTime()) / 1000;
      }
      let scroll = 0, click = 0, move = 0;
      (page.heatmap || []).forEach((ev: typeof page.heatmap[0]) => {
        if (ev.eventType === 'scroll') scroll++;
        if (ev.eventType === 'click') click++;
        if (ev.eventType === 'move') move++;
      });
      totalScrolls += scroll;
      totalClicks += click;
      totalMoves += move;
      return {
        url: page.url,
        pageStart,
        pageEnd,
        duration,
        events: { scroll, click, move }
      };
    });
    return {
      sessionNumber: idx + 1,
      sessionId: session.sessionId,
      userId: session.userId,
      ip: session.ipAddress,
      browser,
      device,
      country: session.geolocation?.country || 'Unknown',
      city: session.geolocation?.city || 'Unknown',
      vpn: session.geolocation?.vpn || false,
      latitude: session.geolocation?.latitude || 0,
      longitude: session.geolocation?.longitude || 0,
      sessionStart,
      sessionEnd,
      sessionDuration,
      pages
    };
  });

  const resumen = {
    date: yesterday.toISOString().slice(0, 10),
    totalSessions: sessions.length,
    uniqueIPs: uniqueIPs.size,
    uniqueUsers: uniqueUsers.size,
    devices,
    browsers,
    countries,
    cities,
    sessionsByHour,
    totalClicks,
    totalScrolls,
    totalMoves,
    avgSessionDuration: Math.round(totalSessionDuration / sessions.length),
    sessions: resumenSesiones
  };

  await ResumenSeccion.create(resumen);
  await Session.deleteMany({
    startTimestamp: {
      $gte: yesterday,
      $lt: today
    }
  });
  return NextResponse.json({ message: 'Resumen diario generado y sesiones eliminadas.' });
} 