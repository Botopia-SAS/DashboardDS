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

export const io = new SocketIOServer(3001, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
  },
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
export const emitNotification = (type: 'new_request' | 'request_accepted' | 'request_declined', data: any) => {
  io.emit('notification', { type, data, timestamp: new Date().toISOString() });
};

export const emitPendingRequestsUpdate = () => {
  io.emit('pending_requests_update');
};
