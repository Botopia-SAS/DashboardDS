import Order from "@/lib/models/Order";
import User from "@/lib/models/User";
import { NextRequest } from "next/server";
import dbConnect from "@/lib/dbConnect";

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

// Function to get serialized orders
async function getSerializedOrders() {
  const orders = await Order.find({
    $or: [
      { orderType: { $exists: true, $ne: "ticket_class" } },
      { items: { $exists: true, $ne: [] } },
      { orderNumber: { $exists: true, $ne: "" } }
    ]
  }).lean();

  const userIds = Array.from(new Set(orders.map((o: any) => o.userId?.toString?.() ?? o.user_id?.toString?.()))).filter(Boolean);
  const usersArr = await User.find({ _id: { $in: userIds } })
    .select('firstName lastName email phoneNumber')
    .lean();
  const usersMap = Object.fromEntries(usersArr.map((u: any) => [u._id.toString(), u]));

  return orders.map((order: any) => {
    const userId = order.userId?.toString?.() ?? order.user_id?.toString?.();
    const user = usersMap[userId];
    return {
      _id: order._id?.toString?.() ?? '',
      orderNumber: order.orderNumber ?? '',
      estado: order.estado ?? order.status ?? '',
      createdAt: order.createdAt ? new Date(order.createdAt).toISOString() : '',
      total: order.total ?? 0,
      user: user
        ? {
            firstName: user.firstName || '-',
            lastName: user.lastName || '-',
            email: user.email || '-',
            phoneNumber: user.phoneNumber || undefined,
          }
        : { firstName: '-', lastName: '-', email: '-', phoneNumber: undefined },
      items: Array.isArray(order.items)
        ? order.items.map((item: any) => ({
            id: item.id,
            title: item.title,
            price: item.price,
            quantity: item.quantity,
            _id: item._id?.toString?.() ?? '',
          }))
        : [],
      __v: order.__v ?? 0,
    };
  });
}

// SSE endpoint for real-time order updates
export async function GET(request: NextRequest) {
  await dbConnect();

  // Set up MongoDB Change Stream to watch for order changes
  const changeStream = Order.watch([
    {
      $match: {
        operationType: { $in: ['insert', 'update', 'replace', 'delete'] }
      }
    }
  ]);

  // Handle change stream events
  changeStream.on('change', async (change) => {
    try {

      const orders = await getSerializedOrders();
      sendToAllClients({ orders, timestamp: new Date().toISOString() });
    } catch (error) {
      console.error('❌ Error processing order change:', error);
    }
  });

  // Create SSE response
  const stream = new ReadableStream({
    start(controller) {
      connections.add(controller);

      // Send initial data
      getSerializedOrders().then(orders => {
        const message = `data: ${JSON.stringify({ orders, timestamp: new Date().toISOString() })}\n\n`;
        controller.enqueue(new TextEncoder().encode(message));

      });

      // Clean up on close
      request.signal.addEventListener('abort', () => {
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
