import Order from "@/lib/models/Order";
import TicketClass from "@/lib/models/TicketClass";
import User from "@/lib/models/User";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  try {
    // Filtrar órdenes que no son de certificados/tickets
    // Excluir órdenes que solo tienen user_id, course_id, fee y status (órdenes de certificados)
    const orders = await Order.find({
      $or: [
        { orderType: { $exists: true, $ne: "ticket_class" } }, // Órdenes con orderType diferente a ticket_class
        { items: { $exists: true, $ne: [] } }, // Órdenes que tienen items
        { orderNumber: { $exists: true, $ne: "" } } // Órdenes con número de orden válido
      ]
    }).lean();
    const userIds = Array.from(new Set(orders.map((o) => o.user_id?.toString?.()))).filter(Boolean);
    const usersArr = await User.find({ _id: { $in: userIds } })
      .select('firstName lastName email phoneNumber')
      .lean();
    const usersMap = Object.fromEntries(usersArr.map((u) => [u._id.toString(), u]));

    const serialized = orders.map((order) => {
      const userId = order.user_id?.toString?.();
      const user = usersMap[userId];
      return {
        _id: order._id?.toString?.() ?? '',
        orderNumber: order.orderNumber ?? '',
        estado: order.status ?? '',
        createdAt: order.createdAt ? new Date(order.createdAt).toISOString() : '',
        total: 0,
        user: user
          ? {
              firstName: user.firstName || '-',
              lastName: user.lastName || '-',
              email: user.email || '-',
              phoneNumber: user.phoneNumber || undefined,
            }
          : { firstName: '-', lastName: '-', email: '-', phoneNumber: undefined },
        items: [],
        __v: order.__v ?? 0,
      };
    });

    return NextResponse.json(serialized, { status: 200 });
  } catch (error) {
    return NextResponse.json({ message: "Error fetching orders", error }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const { user_id, classId, status } = await req.json();
  const dbClass = await TicketClass.findOne({ _id: classId }).exec();
  if (!dbClass) {
    return NextResponse.json({ message: "Class not found" }, { status: 404 });
  }
  const order = new Order({
    user_id,
    course_id: dbClass.classId,
    status,
  });
  await order.save();
  return NextResponse.json(order, { status: 201 });
}