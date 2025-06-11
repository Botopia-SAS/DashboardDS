import Order from "@/lib/models/Order";
import TicketClass from "@/lib/models/TicketClass";
import User from "@/lib/models/users";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  try {
    const orders = await Order.find({})
      .populate({ path: 'user_id', select: 'firstName lastName email' })
      .lean();
    // Asegura que el usuario siempre tenga nombre, apellido y correo aunque esté null
    const ordersWithUser = orders.map(order => ({
      ...order,
      user: {
        firstName: order.user_id?.firstName || '-',
        lastName: order.user_id?.lastName || '-',
        email: order.user_id?.email || '-',
      }
    }));
    return NextResponse.json(ordersWithUser, { status: 200 });
  } catch (error) {
    return NextResponse.json({ message: 'Error fetching orders', error }, { status: 500 });
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