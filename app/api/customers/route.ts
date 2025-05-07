import User from "@/lib/modals/user.modal";
import Order from "@/lib/models/Order";
import Payment from "@/lib/models/Payments";
import TicketClass from "@/lib/models/TicketClass";
import { connectToDB } from "@/lib/mongoDB";
import { createClerkClient } from "@clerk/backend";
import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
const clerk = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });
export async function GET() {
  try {
    await connectToDB();
    const users = await User.find();
    const res = users
      .filter((user) => user.role === "user")
      .map((user) => {
        return {
          id: user.id,
          email: user.email,
          role: "user",
          name: `${user.firstName} ${user.middleName ?? ""} ${user.lastName}`,
          midl: user.middleName,
          createdAt: user.createdAt, // Asegurando que la fecha de registro se envía en la respuesta
        };
      });
    return NextResponse.json(res);
  } catch (error) {
    console.error("Error obteniendo usuarios:", error);
    return NextResponse.json(
      { error: "❌ Error obteniendo usuarios" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    const data = await req.json();
    // Check if a user with this email already exists
    const existingUsers = await clerk.users.getUserList({
      emailAddress: [data.email],
    });

    if (existingUsers.totalCount > 0) {
      return NextResponse.json(
        { error: "Email already exists" },
        { status: 400 }
      );
    }

    // Create the new user
    const clerkUser = await clerk.users.createUser({
      emailAddress: [data.email],
      password: data.password,
      firstName: data.firstName,
      lastName: data.lastName,
    });
    const user = await User.create({
      clerkId: clerkUser.id,
      email: data.email,
      firstName: data.firstName,
      middleName: data.middleName,
      lastName: data.lastName,
      ssnLast4: data.ssnLast4,
      hasLicense: data.hasLicense,
      licenseNumber: data.licenseNumber,
      birthDate: data.birthDate,
      streetAddress: data.streetAddress,
      apartmentNumber: data.apartmentNumber,
      city: data.city,
      state: data.state,
      zipCode: data.zipCode,
      phoneNumber: data.phoneNumber,
      sex: data.sex,
      howDidYouHear: data.howDidYouHear,
      registeredBy: userId,
      role: "user",
      createdAt: new Date(), // Asegurando que la fecha de registro se establece explícitamente
    });
    if (data.courseId) {
      const order = await Order.create({
        user_id: user._id,
        course_id: data.courseId,
        fee: data.fee || 50,
        status: data.payedAmount === data.fee ? "paid" : "pending",
      });
      if (data.payedAmount === data.fee) {
        await Payment.create({
          user_id: user._id,
          amount: data.payedAmount,
          method: data.method,
          order: order._id,
        });
      }
      const course = await TicketClass.findOne({ _id: data.courseId });
      const students = course.students || [];
      students.push(user._id);
      await TicketClass.updateOne({ _id: data.courseId }, { students });
    }
    return NextResponse.json(user, { status: 201 });
  } catch (error) {
    console.log("Error creando usuario:", error);
    return NextResponse.json(
      { error: "❌ Error creando usuario" },
      { status: 500 }
    );
  }
}
