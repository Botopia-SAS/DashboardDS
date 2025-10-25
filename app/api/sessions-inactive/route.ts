import { connectToDB } from "@/lib/mongoDB";
import Session from "@/lib/modals/Session";
import { NextRequest, NextResponse } from "next/server";

// Store active SSE connections for inactive sessions
const inactiveConnections = new Set<ReadableStreamDefaultController>();

// Function to send data to all connected clients
function sendToAllClients(data: any) {
  const message = `data: ${JSON.stringify(data)}\n\n`;
  inactiveConnections.forEach(controller => {
    try {
      controller.enqueue(new TextEncoder().encode(message));
    } catch (error) {
      // Remove dead connections
      inactiveConnections.delete(controller);
    }
  });
}

// Function to get inactive sessions
async function getInactiveSessions() {
  return await Session.find({ sessionActive: false })
    .sort({ lastActive: -1 });
}

// SSE endpoint for real-time updates
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const isSSE = url.searchParams.get('sse') === 'true';

  if (isSSE) {
    await connectToDB();

    // Set up MongoDB Change Stream for inactive sessions
    const changeStream = Session.watch([
      {
        $match: {
          $or: [
            { 'updateDescription.updatedFields.sessionActive': { $eq: false } },
            { operationType: { $in: ['insert', 'update', 'replace'] } }
          ]
        }
      }
    ]);

    // Handle change stream events
    changeStream.on('change', async (change) => {
      try {
        const inactiveSessions = await getInactiveSessions();
        sendToAllClients({ inactiveSessions });
      } catch (error) {
        console.error('Error processing change stream:', error);
      }
    });

    // Create SSE response
    const stream = new ReadableStream({
      start(controller) {
        inactiveConnections.add(controller);
        
        // Send initial data
        getInactiveSessions().then(inactiveSessions => {
          const message = `data: ${JSON.stringify({ inactiveSessions })}\n\n`;
          controller.enqueue(new TextEncoder().encode(message));
        });

        // No enviar keep-alive automático - solo datos reales cuando cambien
        // Esto reduce significativamente las peticiones innecesarias
        console.log('✅ Sessions inactive stream established - no automatic keep-alive');

        // Clean up on close
        request.signal.addEventListener('abort', () => {
          inactiveConnections.delete(controller);
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
  const inactiveSessions = await getInactiveSessions();
  return NextResponse.json({ inactiveSessions });
} 