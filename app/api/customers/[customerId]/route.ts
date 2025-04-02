import User from "@/lib/modals/user.modal";
import Payment from "@/lib/models/Payments";
import { connectToDB } from "@/lib/mongoDB";
import { createClerkClient } from "@clerk/backend";
import { NextRequest, NextResponse } from "next/server";

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
    const customerId = req.nextUrl.pathname.split("/").pop();
    if (!customerId) {
      return NextResponse.json(
        { error: "Customer ID is required" },
        { status: 400 }
      );
    }

    const bdUser = await User.findOne({ _id: customerId }).exec();

    if (!bdUser) {
      return NextResponse.json(
        { error: "Customer not found" },
        { status: 404 }
      );
    }
    const payment = await Payment.findOne({ user_id: bdUser._id }).exec();
    const user = {
      ...bdUser._doc,
      payedAmount: payment.amount || 0,
      method: payment.method,
    };
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
    const customerId = req.nextUrl.pathname.split("/").pop();
    if (!customerId) {
      return NextResponse.json(
        { error: "Customer ID is required" },
        { status: 400 }
      );
    }

    const user = await clerk.users.getUser(customerId as string);
    if (!user) {
      return NextResponse.json(
        { error: "Customer not found" },
        { status: 404 }
      );
    }

    const data = await req.json();
    console.log(data);
    await clerk.users.updateUser(customerId as string, {
      firstName: data.firstName,
      lastName: data.lastName,
      publicMetadata: {
        role: "user",
        ssnLast4: data.ssnLast4,
        hasLicense: data.hasLicense,
        licenseNumber: data.licenseNumber,
        birthDate: data.birthDate,
        middleName: data.middleName,
      },
    });
    return NextResponse.json({ message: "Customer updated" }, { status: 200 });
  } catch (error) {
    console.error("Error updating customer:", error);
    return NextResponse.json(
      { error: "❌ Error updating customer" },
      { status: 500 }
    );
  }
}
