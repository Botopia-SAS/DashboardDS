import { Server as NetServer } from "http";
import { NextApiResponse } from "next";
import { Server as SocketIOServer } from "socket.io";

export type NextApiResponseServerIO = NextApiResponse & {
  socket: {
    server: NetServer & {
      io: SocketIOServer;
    };
  };
};

// Use globalThis to persist Socket.IO instance across hot reloads in development
declare global {
  var socketIO: SocketIOServer | undefined;
}

// Lazy initialization - only create server when actually accessed
const getSocketIOServer = (): SocketIOServer => {
  if (!global.socketIO) {
    try {
      global.socketIO = new SocketIOServer(3001, {
        cors: {
          origin: "http://localhost:3000",
          methods: ["GET", "POST"],
        },
      });

      console.log("✓ Socket.IO server initialized on port 3001");

      // Handle cleanup on process termination
      global.socketIO.on("connection", (socket) => {
        console.log("Client connected:", socket.id);

        socket.on("disconnect", () => {
          console.log("Client disconnected:", socket.id);
        });
      });
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'code' in error && error.code === 'EADDRINUSE') {
        console.log("⚠ Port 3001 already in use, reusing existing connection");
        // Return existing instance if port is in use
        if (global.socketIO) {
          return global.socketIO;
        }
      }
      throw error;
    }
  }

  return global.socketIO;
};

// Export a getter function instead of calling immediately
export const getIO = () => getSocketIOServer();

// For backward compatibility, create a proxy that lazily initializes
export const io = new Proxy({} as SocketIOServer, {
  get: (target, prop) => {
    const server = getSocketIOServer();
    const value = server[prop as keyof SocketIOServer];
    return typeof value === 'function' ? value.bind(server) : value;
  }
});

export const config = {
  api: {
    bodyParser: {
      sizeLimit: "1mb",
    },
  },
};

// Global instance to emit events from anywhere in the app
export const socketServer = io;

// Notification events
export const emitNotification = (type: 'new_request' | 'request_accepted' | 'request_declined', data: Record<string, unknown>) => {
  io.emit('notification', { type, data, timestamp: new Date().toISOString() });
};

export const emitPendingRequestsUpdate = () => {
  io.emit('pending_requests_update');
};
