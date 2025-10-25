import { connectToDB } from "@/lib/mongoDB";
import Session from "@/lib/modals/Session";
import { NextResponse } from "next/server";

interface HeatmapEvent {
  x: number;
  y: number;
  value: number;
  pathname: string;
  event_type: string;
  timestamp?: string | null;
}

interface HeatmapRawEvent {
  x: number;
  y: number;
  eventType: string;
  timestamp?: string;
}

interface HeatmapPage {
  url: string;
  heatmap?: HeatmapRawEvent[];
  timestamp?: string;
}

interface HeatmapSession {
  userId?: string;
  pages?: HeatmapPage[];
  startTimestamp?: string;
  endTimestamp?: string;
  ipAddress?: string;
}

export async function GET(req: Request) {
  await connectToDB();

  // Obtén los parámetros de fecha del query string
  const { searchParams } = new URL(req.url);
  const start = searchParams.get('start');
  const end = searchParams.get('end');
  const startDate = start ? new Date(start) : null;
  const endDate = end ? new Date(end) : null;

  const sessions: HeatmapSession[] = await Session.find({});

  const heatmap: HeatmapEvent[] = [];
  const totalEvents = { value: 0 };
  const sessionDurations: number[] = [];
  const usersSet = new Set<string>();
  const eventsByTypeMap: Record<string, number> = {};

  sessions.forEach((session) => {
    if (session.ipAddress) usersSet.add(session.ipAddress);
    if (session.startTimestamp && session.endTimestamp) {
      const start = new Date(session.startTimestamp).getTime();
      const end = new Date(session.endTimestamp).getTime();
      if (end > start) {
        sessionDurations.push((end - start) / 1000 / 60); // minutos
      }
    }
    if (session.pages && session.pages.length > 0) {
      session.pages.forEach((page) => {
        if (page.heatmap && page.heatmap.length > 0) {
          page.heatmap.forEach((event) => {
            const eventTimestamp = event.timestamp || page.timestamp || null;
            if (eventTimestamp) {
              const ts = new Date(eventTimestamp).getTime();
              if (
                (!startDate || ts >= startDate.getTime()) &&
                (!endDate || ts <= endDate.getTime())
              ) {
                heatmap.push({
                  x: event.x,
                  y: event.y,
                  value: 1,
                  pathname: page.url.replace(/^https?:\/\/[^/]+/, ""),
                  event_type: event.eventType,
                  timestamp: eventTimestamp,
                });
                totalEvents.value++;
                if (!eventsByTypeMap[event.eventType]) eventsByTypeMap[event.eventType] = 0;
                eventsByTypeMap[event.eventType]++;
              }
            }
          });
        }
      });
    }
  });

  const avgSession = sessionDurations.length > 0 ? (sessionDurations.reduce((a, b) => a + b, 0) / sessionDurations.length).toFixed(2) : 0;
  const eventsByType = Object.entries(eventsByTypeMap).map(([event_type, count]) => ({ event_type, count }));

  return NextResponse.json({
    success: true,
    heatmap,
    eventsByType,
    users: usersSet.size,
    totalEvents: totalEvents.value,
    avgSession,
  });
} 