import Order from "@/lib/models/Order";
import TicketClass from "@/lib/models/TicketClass";
import { NextRequest, NextResponse } from "next/server";

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