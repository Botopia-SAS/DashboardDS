import { NextRequest } from "next/server";
import { broadcastNotification } from "./stream/route";

export async function POST(req: NextRequest) {
  try {
    const { type, data } = await req.json();
    
    // Broadcast notification to all SSE clients
    broadcastNotification(type, data);
    
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    console.error('Error emitting notification:', error);
    return new Response(JSON.stringify({ error: "Failed to emit notification" }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
      },
    });
  }
}
