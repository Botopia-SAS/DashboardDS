import { addConnection, removeConnection } from "@/lib/notifications";

export async function GET() {
  console.log('🔌 New SSE connection request');

  // Create a new SSE stream
  const stream = new ReadableStream({
    start(controller) {
      // Add this connection to the set
      addConnection(controller);
      console.log('➕ SSE connection added');
      
      // Send initial connection message
      const data = JSON.stringify({
        type: 'connection',
        data: { status: 'connected' },
        timestamp: new Date().toISOString()
      });
      
      controller.enqueue(`data: ${data}\n\n`);
      
      console.log('✅ SSE connection established');

      // Ping cada 30 segundos para mantener la conexión viva
      const pingInterval = setInterval(() => {
        try {
          const pingMessage = {
            type: 'ping',
            data: { timestamp: new Date().toISOString() },
            timestamp: new Date().toISOString()
          };
          controller.enqueue(`data: ${JSON.stringify(pingMessage)}\n\n`);
        } catch (error) {
          console.error('❌ Error sending ping:', error);
          clearInterval(pingInterval);
          removeConnection(controller);
        }
      }, 30000);
      
      // Store controller for cleanup
      const controllerWithCleanup = controller as ReadableStreamDefaultController & { 
        _cleanup?: () => void;
        _pingInterval?: NodeJS.Timeout;
      };
      controllerWithCleanup._cleanup = () => {
        clearInterval(pingInterval);
        removeConnection(controller);
      };
      controllerWithCleanup._pingInterval = pingInterval;
    },
    cancel(controller) {
      // Remove connection when client disconnects
      const controllerWithCleanup = controller as ReadableStreamDefaultController & { 
        _cleanup?: () => void;
        _pingInterval?: NodeJS.Timeout;
      };
      if (controllerWithCleanup._pingInterval) {
        clearInterval(controllerWithCleanup._pingInterval);
      }
      removeConnection(controller);
      console.log('🔌 SSE connection closed');
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET',
      'Access-Control-Allow-Headers': 'Cache-Control',
    },
  });
}
