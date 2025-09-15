// Store active SSE connections
const connections = new Set<ReadableStreamDefaultController>();

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

// Function to add a connection
export function addConnection(controller: ReadableStreamDefaultController) {
  connections.add(controller);
}

// Function to remove a connection
export function removeConnection(controller: ReadableStreamDefaultController) {
  connections.delete(controller);
}
