import { NextRequest, NextResponse } from "next/server";
import { connectToDB } from "@/lib/mongoDB";
import User from "@/lib/models/users";

export async function GET(req: NextRequest) {
  try {
    await connectToDB();
    // Lee los roles desde la query, por defecto solo "user"
    const { searchParams } = new URL(req.url);
    const rolesParam = searchParams.get("roles");
    const roles = rolesParam ? rolesParam.split(",") : ["user"];
    const users = await User.find({
      role: { $regex: new RegExp(`^(${roles.join("|")})$`, "i") }
    });
    return NextResponse.json(users, { status: 200 });
  } catch {
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 });
  }
}
