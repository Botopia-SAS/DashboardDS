import { connectToDB } from "@/lib/mongoDB";
import Session from "@/lib/modals/Session";
import { NextResponse } from "next/server";

interface HeatmapEvent {
  x: number;
  y: number;
  value: number;
  pathname: string;
  event_type: string;
}

export async function GET() {
  await connectToDB();

  // Obtén todas las sesiones
  const sessions = await Session.find({});

  // Extrae todos los eventos de heatmap de todas las páginas de todas las sesiones
  const heatmap: HeatmapEvent[] = [];
  const totalEvents = { value: 0 };
  const sessionDurations: number[] = [];
  const usersSet = new Set<string>();
  const eventsByTypeMap: Record<string, number> = {};

  sessions.forEach((session: any) => {
    if (session.userId) usersSet.add(session.userId);
    if (session.pages && session.pages.length > 0) {
      const sessionStart = session.pages[0].timestamp;
      const sessionEnd = session.pages[session.pages.length - 1].timestamp;
      if (sessionStart && sessionEnd) {
        sessionDurations.push((new Date(sessionEnd).getTime() - new Date(sessionStart).getTime()) / 1000 / 60); // minutos
      }
      session.pages.forEach((page: any) => {
        if (page.heatmap && page.heatmap.length > 0) {
          page.heatmap.forEach((event: any) => {
            heatmap.push({
              x: event.x,
              y: event.y,
              value: 1,
              pathname: page.url.replace(/^https?:\/\/[^/]+/, ""),
              event_type: event.eventType,
            });
            totalEvents.value++;
            if (!eventsByTypeMap[event.eventType]) eventsByTypeMap[event.eventType] = 0;
            eventsByTypeMap[event.eventType]++;
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