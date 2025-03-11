import { createClerkClient } from "@clerk/backend";
import { NextRequest, NextResponse } from "next/server";

const clerk = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });

export async function GET() {
  try {
    const users = await clerk.users.getUserList();
    const res = users.data
      .filter((user) => user.publicMetadata.role === "user")
      .map((user) => {
        return {
          id: user.id,
          email: user.emailAddresses[0].emailAddress,
          role: user.publicMetadata.role,
          name: user.fullName,
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
    const data = await req.json();
    const user = await clerk.users.createUser({
      emailAddress: [data.email],
      password: data.password,
      firstName: data.firstName,
      lastName: data.lastName,
      publicMetadata: {
        role: "user",
        ssnLast4: data.ssnLast4,
        hasLicense: data.hasLicense,
        licenseNumber: data.licenseNumber,
      },
    });
    return NextResponse.json(user, { status: 201 });
  } catch (error) {
    console.log("Error creando usuario:", error);
    return NextResponse.json(":(", {status: 500});
  }
}
