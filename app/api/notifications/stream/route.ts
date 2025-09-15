import { NextRequest } from "next/server";

// Store active SSE connections
const connections = new Set<ReadableStreamDefaultController>();

export async function GET(req: NextRequest) {
  // Create a new SSE stream
  const stream = new ReadableStream({
    start(controller) {
      // Add this connection to the set
      connections.add(controller);
      
      // Send initial connection message
      const data = JSON.stringify({
        type: 'connection',
        data: { message: 'Connected to notifications stream' },
        timestamp: new Date().toISOString()
      });
      
      controller.enqueue(`data: ${data}\n\n`);
      
      console.log('New SSE connection established');
    },
    cancel() {
      // Remove connection when client disconnects
      connections.delete(controller);
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

// Function to broadcast to all connected clients
export function broadcastNotification(type: string, data: any) {
  const notification = JSON.stringify({
    type,
    data,
    timestamp: new Date().toISOString()
  });

  const message = `data: ${notification}\n\n`;
  
  // Send to all connected clients
  connections.forEach(controller => {
    try {
      controller.enqueue(message);
    } catch (error) {
      console.error('Error sending SSE message:', error);
      // Remove dead connections
      connections.delete(controller);
    }
  });
  
  console.log(`Broadcasted notification to ${connections.size} clients:`, type);
}
