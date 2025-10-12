import { NextRequest } from "next/server";
import { io } from "@/lib/socket";

export async function GET() {
  return new Response(JSON.stringify({ message: "Socket.IO server is running" }), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
    },
  });
}

export async function POST(req: NextRequest) {
  try {
    const { type, data } = await req.json();
    
    // Emit notification to all connected clients
    io.emit('notification', { type, data, timestamp: new Date().toISOString() });
    
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: "Failed to emit notification" }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
      },
    });
  }
}
