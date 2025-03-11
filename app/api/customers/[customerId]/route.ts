import { createClerkClient } from "@clerk/backend";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const clerk = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });

export async function DELETE(req: NextRequest) {
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
    await clerk.users.deleteUser(customerId as string);
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

    const user = await clerk.users.getUser(customerId as string);
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
    await clerk.users.updateUser(customerId as string, {
      firstName: data.firstName,
      lastName: data.lastName,
      publicMetadata: {
        role: "user",
        ssnLast4: data.ssnLast4,
        hasLicense: data.hasLicense,
        licenseNumber: data.licenseNumber,
      },
    });
    console.log(data)
    return NextResponse.json({ message: "Customer updated" }, { status: 200 });
  } catch (error) {
    console.error("Error updating customer:", error);
    return NextResponse.json(
      { error: "❌ Error updating customer" },
      { status: 500 }
    );
  }
}
