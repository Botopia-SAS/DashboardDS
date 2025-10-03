import Instructor from "@/lib/models/Instructor";
import { NextRequest } from "next/server";
import dbConnect from "@/lib/dbConnect";
import { broadcastNotification } from "@/lib/notifications";

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

// Function to get pending driving lessons
async function getPendingLessons() {
  const instructors = await Instructor.find({
    schedule_driving_lesson: { $exists: true, $not: { $size: 0 } }
  }).lean();

  const pendingRequests = [];

  for (const instructor of instructors as any[]) {
    if (instructor.schedule_driving_lesson) {
      for (const event of instructor.schedule_driving_lesson) {
        // Filtrar solo lecciones con status 'pending' y paymentMethod 'local'
        if (event.status === 'pending' && event.studentId && event.paymentMethod === 'local') {
          pendingRequests.push({
            requestId: event._id?.toString() || `${instructor._id}-${event.date}-${event.start}`,
            lessonId: event._id?.toString() || `${instructor._id}-${event.date}-${event.start}`,
            studentId: event.studentId,
            date: event.date,
            hour: event.start,
            endHour: event.end,
            classType: event.classType || 'driving lesson',
            requestDate: event.createdAt || new Date().toISOString(),
            status: event.status,
            instructorId: instructor._id,
            paymentMethod: event.paymentMethod
          });
        }
      }
    }
  }

  console.log(`📊 SSE: Found ${pendingRequests.length} pending local driving lessons`);
  return pendingRequests;
}

// SSE endpoint for real-time driving lesson updates
export async function GET(request: NextRequest) {
  await dbConnect();

  // Set up MongoDB Change Stream to watch for ANY Instructor changes
  // No filter - detect all changes and then check for pending lessons
  const changeStream = Instructor.watch();

  // Handle change stream events
  changeStream.on('change', async (change) => {
    try {
      console.log('🚗 Driving lesson change detected:', change.operationType);

      // Check if any lesson status changed to "pending"
      const lessons = await getPendingLessons();
      console.log(`📊 Found ${lessons.length} pending lessons after change`);

      // Send to driving lessons SSE clients
      sendToAllClients({
        type: 'driving-lessons',
        action: 'lessons_updated',
        lessons,
        timestamp: new Date().toISOString()
      });
      console.log(`📡 Sent to ${lessons.length} SSE clients`);

      // ALWAYS broadcast to global notification system (not just when > 0)
      // This ensures the counter updates even when going from 1 to 0
      await broadcastNotification('driving-lessons', {
        action: 'lessons_updated',
        count: lessons.length,
        lessons,
        timestamp: new Date().toISOString()
      });
      console.log(`✅ Global notification broadcast complete (count: ${lessons.length})`);
    } catch (error) {
      console.error('❌ Error processing driving lesson change:', error);
    }
  });

  // Create SSE response
  const stream = new ReadableStream({
    start(controller) {
      connections.add(controller);

      // Send initial data
      getPendingLessons().then(lessons => {
        const message = `data: ${JSON.stringify({
          type: 'driving-lessons',
          action: 'initial',
          lessons,
          timestamp: new Date().toISOString()
        })}\n\n`;
        controller.enqueue(new TextEncoder().encode(message));
        console.log('✅ Driving lessons SSE stream established');
      });

      // Clean up on close
      request.signal.addEventListener('abort', () => {
        connections.delete(controller);
        changeStream.close();
        console.log('🔌 Driving lessons SSE connection closed');
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
