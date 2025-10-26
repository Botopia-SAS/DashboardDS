import { NextResponse } from "next/server";
import User from "@/lib/models/User";
import { connectToDB } from "@/lib/mongoDB";

export async function GET() {
  try {

    await connectToDB();

    // Count total users
    const userCount = await User.countDocuments();

    // Check for admin user specifically
    const adminUser = await User.findOne({ email: "admin@drivingschool.com" });

    // Get all users (without passwords)
    const allUsers = await User.find({}, { password: 0 }).limit(10);

    return NextResponse.json({
      status: "Database connection successful",
      totalUsers: userCount,
      adminUserExists: !!adminUser,
      adminUserEmail: adminUser?.email || "Not found",
      allUsers: allUsers.map(user => ({
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        createdAt: user.createdAt
      })),
      instructions: {
        correctEmail: "admin@drivingschool.com",
        correctPassword: "admin123",
        createAdminUrl: "/api/init-admin"
      }
    });

  } catch (error) {
    console.error("[DEBUG] Database error:", error);
    
    return NextResponse.json({
      status: "Database connection failed",
      error: error instanceof Error ? error.message : "Unknown error",
      possibleCauses: [
        "MongoDB not running",
        "Incorrect MONGODB_URI in .env.local",
        "Network connection issues",
        "Database authentication problems"
      ],
      solution: "Check your .env.local file and ensure MongoDB is running"
    }, { status: 500 });
  }
} 