import { connectToDB } from "@/lib/mongoDB";
import Session from "@/lib/modals/Session";
import { NextRequest, NextResponse } from "next/server";

// Store active SSE connections
const connections = new Set<ReadableStreamDefaultController>();

// Function to send data to all connected clients
function sendToAllClients(data: any) {
  const message = `data: ${JSON.stringify(data)}\n\n`;
  connections.forEach(controller => {
    try {
      controller.enqueue(new TextEncoder().encode(message));
    } catch (error) {
      // Remove dead connections
      connections.delete(controller);
    }
  });
}

// Function to get active sessions
async function getActiveSessions() {
  const now = new Date();
  const THRESHOLD = 30 * 1000; // 30 segundos

  // Encuentra todas las sesiones activas
  const sessions = await Session.find({ sessionActive: true });

  // Marca como inactivas las que no han tenido actividad reciente
  await Promise.all(
    sessions.map(async (session) => {
      if (
        session.lastActive &&
        now.getTime() - new Date(session.lastActive).getTime() > THRESHOLD
      ) {
        session.sessionActive = false;
        session.endTimestamp = session.lastActive;
        await session.save();
      }
    })
  );

  // Devuelve solo las sesiones realmente activas
  return await Session.find({ sessionActive: true });
}

// SSE endpoint for real-time updates
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const isSSE = url.searchParams.get('sse') === 'true';

  if (isSSE) {
    await connectToDB();

    // Set up MongoDB Change Stream
    const changeStream = Session.watch([
      {
        $match: {
          $or: [
            { 'updateDescription.updatedFields.sessionActive': { $exists: true } },
            { 'updateDescription.updatedFields.lastActive': { $exists: true } },
            { operationType: { $in: ['insert', 'update', 'replace'] } }
          ]
        }
      }
    ]);

    // Handle change stream events
    changeStream.on('change', async (change) => {
      try {
        const activeSessions = await getActiveSessions();
        sendToAllClients({ activeSessions });
      } catch (error) {
        console.error('Error processing change stream:', error);
      }
    });

    // Create SSE response
    const stream = new ReadableStream({
      start(controller) {
        connections.add(controller);
        
        // Send initial data
        getActiveSessions().then(activeSessions => {
          const message = `data: ${JSON.stringify({ activeSessions })}\n\n`;
          controller.enqueue(new TextEncoder().encode(message));
        });

        // Send keep-alive every 30 seconds
        const keepAliveInterval = setInterval(() => {
          try {
            controller.enqueue(new TextEncoder().encode(': keep-alive\n\n'));
          } catch (error) {
            clearInterval(keepAliveInterval);
            connections.delete(controller);
          }
        }, 30000);

        // Clean up on close
        request.signal.addEventListener('abort', () => {
          clearInterval(keepAliveInterval);
          connections.delete(controller);
          changeStream.close();
        });
      }
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Cache-Control'
      }
    });
  }

  // Fallback for regular GET requests (non-SSE)
  await connectToDB();
  const activeSessions = await getActiveSessions();
  return NextResponse.json({ activeSessions });
} 