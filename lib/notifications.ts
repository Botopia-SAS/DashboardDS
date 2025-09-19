// Store active SSE connections
const connections = new Set<ReadableStreamDefaultController>();

// Function to add a connection
export function addConnection(controller: ReadableStreamDefaultController) {
  connections.add(controller);
  console.log(`📊 Total SSE connections: ${connections.size}`);
}

// Function to remove a connection
export function removeConnection(controller: ReadableStreamDefaultController) {
  connections.delete(controller);
  console.log(`📊 Total SSE connections: ${connections.size}`);
}

// Function to broadcast to all connected clients
export function broadcastNotification(type: string, data: any) {
  if (connections.size === 0) {
    console.log('📡 No SSE connections to broadcast to');
    return;
  }

  const message = `data: ${JSON.stringify({
    type,
    data,
    timestamp: new Date().toISOString()
  })}\n\n`;
  
  // Track connections to remove
  const connectionsToRemove: ReadableStreamDefaultController[] = [];
  
  // Send to all connected clients
  connections.forEach(controller => {
    try {
      // Check if the controller is still usable
      if (controller.desiredSize !== null && controller.desiredSize >= 0) {
        controller.enqueue(message);
      } else {
        // Controller is closed, mark for removal
        connectionsToRemove.push(controller);
      }
    } catch {
      // Si hay cualquier error, marcar la conexión para eliminación
      connectionsToRemove.push(controller);
    }
  });
  
  // Remove dead connections
  connectionsToRemove.forEach(controller => {
    connections.delete(controller);
  });

  if (connectionsToRemove.length > 0) {
    console.log(`🧹 Removed ${connectionsToRemove.length} dead connections`);
  }
  
  console.log(`📡 Broadcasted to ${connections.size} active connections: ${type}`);
}
