import User from "@/lib/modals/user.modal";
import Order from "@/lib/models/Order";
import Payment from "@/lib/models/Payments";
import TicketClass from "@/lib/models/TicketClass";
import { connectToDB } from "@/lib/mongoDB";
import { createClerkClient } from "@clerk/backend";
import { NextRequest, NextResponse } from "next/server";
import _ from "lodash";

export const dynamic = "force-dynamic";

const clerk = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });

export async function DELETE(req: NextRequest) {
  try {
    await connectToDB();
    const customerId = req.nextUrl.pathname.split("/").pop();
    if (!customerId) {
      return NextResponse.json(
        { error: "Customer ID is required" },
        { status: 400 }
      );
    }
    const dbUser = await User.findOne({ _id: customerId }).exec();
    const user = await clerk.users.getUser(dbUser.clerkId);
    if (!user) {
      return NextResponse.json(
        { error: "Customer not found" },
        { status: 404 }
      );
    }
    await clerk.users.deleteUser(dbUser.clerkId);
    await User.deleteOne({ _id: customerId }).exec();
    return NextResponse.json({ message: "Customer deleted" }, { status: 200 });
  } catch (error) {
    console.error("Error deleting customer:", error);
    return NextResponse.json(
      { error: "❌ Error deleting customer" },
      { status: 500 }
    );
  }
}
export async function GET(req: NextRequest) {
  try {
    await connectToDB();
    const customerId = req.nextUrl.pathname.split("/").pop();
    if (!customerId) {
      return NextResponse.json(
        { error: "Customer ID is required" },
        { status: 400 }
      );
    }

    const user = await User.findOne({ _id: customerId }).exec();

    if (!user) {
      return NextResponse.json(
        { error: "Customer not found" },
        { status: 404 }
      );
    }
    return NextResponse.json(user, { status: 200 });
  } catch (error) {
    console.error("Error deleting customer:", error);
    return NextResponse.json(
      { error: "❌ Error deleting customer" },
      { status: 500 }
    );
  }
}
export async function PATCH(req: NextRequest) {
  try {
    await connectToDB();
    const customerId = req.nextUrl.pathname.split("/").pop();
    if (!customerId) {
      return NextResponse.json(
        { error: "Customer ID is required" },
        { status: 400 }
      );
    }
    const user = await User.findOne({ _id: customerId });
    if (!user) {
      return NextResponse.json(
        { error: "Customer not found" },
        { status: 404 }
      );
    }

    const data = await req.json();
    console.log(data);

    const allowedFields = [
      "firstName",
      "lastName",
      "middleName",
      "email",
      "ssnLast4",
      "hasLicense",
      "licenseNumber",
      "birthDate",
      "streetAddress",
      "apartmentNumber",
      "city",
      "state",
      "zipCode",
      "phoneNumber",
      "sex",
      "howDidYouHear",
    ];
    const userData = _.pick(data, allowedFields);

    // Actualizamos el usuario manteniendo su fecha de creación original
    const updatedUser = await User.findByIdAndUpdate(
      customerId,
      {
        $set: {
          ...userData,
          updatedAt: new Date(), // Solo actualizamos la fecha de actualización
        },
      },
      { new: true, runValidators: true }
    );

    if (data.registerForCourse) {
      const order = await Order.create({
        user_id: user._id,
        course_id: data.courseId,
        fee: data.fee || 50,
        status: data.payedAmount === data.fee ? "paid" : "pending",
      });
      console.log(data.payedAmount);
      console.log(order.fee);
      if (data.payedAmount === order.fee) {
        console.log("CUMPLIÓ");
        await Payment.create({
          user_id: user._id,
          amount: data.payedAmount,
          method: data.method || "Other",
          order: order._id,
        });
      }

      await TicketClass.findByIdAndUpdate(
        data.courseId,
        { $addToSet: { students: user._id } }, // Evita duplicados
        { new: true }
      );
      console.log("SE REGISTRA");
    }

    return NextResponse.json(
      {
        message: "Customer updated",
        user: updatedUser, // Devolvemos el usuario actualizado que incluye createdAt
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error updating customer:", error);
    return NextResponse.json(
      { error: "❌ Error updating customer" },
      { status: 500 }
    );
  }
}
