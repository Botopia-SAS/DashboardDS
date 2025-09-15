import { NextRequest } from "next/server";
import { addConnection, removeConnection } from "@/lib/notifications";

export async function GET(req: NextRequest) {
  // Create a new SSE stream
  const stream = new ReadableStream({
    start(controller) {
      // Add this connection to the set
      addConnection(controller);
      
      // Send initial connection message
      const data = JSON.stringify({
        type: 'connection',
        data: { message: 'Connected to notifications stream' },
        timestamp: new Date().toISOString()
      });
      
      controller.enqueue(`data: ${data}\n\n`);
      
      console.log('New SSE connection established');
      
      // Store controller for cleanup
      (controller as any)._cleanup = () => removeConnection(controller);
    },
    cancel(controller) {
      // Remove connection when client disconnects
      removeConnection(controller);
      console.log('SSE connection closed');
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Cache-Control',
    },
  });
}
