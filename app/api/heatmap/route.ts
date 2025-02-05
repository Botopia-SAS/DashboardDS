import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
  try {
    // Obtener todos los datos relevantes de la tabla heatmap_data
    const { data, error } = await supabase
      .from("heatmap_data")
      .select("id, x, y, pathname, event_type, screen_width, screen_height, device, device_model, browser, user_id, timestamp, key_pressed, time_spent");

    if (error) {
      console.error("❌ Error al obtener datos del heatmap:", error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    console.log("📊 Datos crudos desde Supabase:", data);

    // Formatear datos para el heatmap
    const heatmap = data.map((entry) => ({
      id: entry.id,
      x: Number(entry.x) || 0,
      y: Number(entry.y) || 0,
      value: 1, // Valor fijo ya que no hay una columna específica de valor en la tabla
      pathname: entry.pathname || "/", // Evita undefined o null
      event_type: entry.event_type || "unknown",
      screen_width: entry.screen_width || 0,
      screen_height: entry.screen_height || 0,
      device: entry.device || "unknown",
      device_model: entry.device_model || "unknown",
      browser: entry.browser || "unknown",
      user_id: entry.user_id || "anonymous",
      timestamp: entry.timestamp || "unknown",
      key_pressed: entry.key_pressed || "none",
      time_spent: entry.time_spent || 0,
    }));

    // Calcular estadísticas
    const users = new Set(data.map((entry) => entry.user_id)).size;
    const totalEvents = data.length;
    const avgSession =
      data.reduce((sum, entry) => sum + (entry.time_spent || 0), 0) /
      (users || 1); // Evitar división por 0

    // Agrupar eventos por tipo
    const eventsByType = heatmap.reduce((acc: { [key: string]: number }, entry) => {
      acc[entry.event_type] = (acc[entry.event_type] || 0) + 1;
      return acc;
    }, {});

    console.log("📊 Datos formateados:", { heatmap, users, totalEvents, avgSession, eventsByType });

    return NextResponse.json({
      success: true,
      heatmap,
      users,
      totalEvents,
      avgSession: Math.round(avgSession),
      eventsByType: Object.entries(eventsByType).map(([event_type, count]) => ({
        event_type,
        count,
      })),
    });
  } catch (err) {
    console.error("🔥 Error inesperado en API Heatmap:", err);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}
