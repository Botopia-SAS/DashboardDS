import Order from "@/lib/models/Order";
import TicketClass from "@/lib/models/TicketClass";
import User from "@/lib/models/users";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  try {
    const orders = await Order.find({}).lean();
    const userIds = Array.from(new Set(orders.map((o) => o.userId?.toString?.() ?? o.user_id?.toString?.()))).filter(Boolean);
    const usersArr = await User.find({ _id: { $in: userIds } })
      .select('firstName lastName email phoneNumber')
      .lean();
    const usersMap = Object.fromEntries(usersArr.map((u) => [u._id.toString(), u]));

    const serialized = orders.map((order) => {
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
          ? order.items.map((item) => ({
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