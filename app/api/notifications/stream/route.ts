import { addConnection, removeConnection } from "@/lib/notifications";

export async function GET() {

  // Create a new SSE stream
  const stream = new ReadableStream({
    start(controller) {
      // Add this connection to the set
      addConnection(controller);

      // Send initial connection message
      const data = JSON.stringify({
        type: 'connection',
        data: { status: 'connected' },
        timestamp: new Date().toISOString()
      });
      
      controller.enqueue(`data: ${data}\n\n`);
      

      // No hacer ping automático - solo cuando haya actividad real
      // Esto reduce significativamente las peticiones innecesarias
      // La conexión SSE se mantiene viva naturalmente con las notificaciones reales
      

      // Store controller for cleanup
      const controllerWithCleanup = controller as ReadableStreamDefaultController & { 
        _cleanup?: () => void;
      };
      controllerWithCleanup._cleanup = () => {
        removeConnection(controller);
      };
    },
    cancel(controller) {
      // Remove connection when client disconnects
      const controllerWithCleanup = controller as ReadableStreamDefaultController & { 
        _cleanup?: () => void;
      };
      if (controllerWithCleanup._cleanup) {
        controllerWithCleanup._cleanup();
      }
      removeConnection(controller);

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
