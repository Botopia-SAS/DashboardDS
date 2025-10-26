import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import Admin from "@/lib/models/Admin";
import { connectToDB } from "@/lib/mongoDB";

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();


    if (!email || !password) {

      return NextResponse.json(
        { message: "Email and password are required" },
        { status: 400 }
      );
    }


    await connectToDB();

    // Find admin in MongoDB - search by exact email

    const admin = await Admin.findOne({ email: email.toLowerCase() });
    

    if (!admin) {

      // Check if any admins exist for debugging
      const adminCount = await Admin.countDocuments();

      if (adminCount === 0) {
        return NextResponse.json(
          { message: "No admins found in database. Please create an admin first." },
          { status: 401 }
        );
      }
      
      // Show available emails for debugging (without passwords)
      const availableAdmins = await Admin.find({}, { email: 1 }).limit(5);

      return NextResponse.json(
        { 
          message: "Admin not found with this email",
          availableEmails: availableAdmins.map(u => u.email)
        },
        { status: 401 }
      );
    }


    // Verify password using bcrypt, fallback to plain text for dev
    let isPasswordValid = false;
    try {
      isPasswordValid = await bcrypt.compare(password, admin.password);
    } catch {
      isPasswordValid = false;
    }
    if (!isPasswordValid) {
      // Fallback: plain text comparison (TEMPORAL, solo para desarrollo)
      isPasswordValid = password === admin.password;
      if (isPasswordValid) {
        console.warn("[LOGIN] WARNING: Password matched in plain text. This is insecure and should only be used for development!");
      }
    }

    if (!isPasswordValid) {

      return NextResponse.json(
        { message: "Invalid password" },
        { status: 401 }
      );
    }

    // Return admin data (without password)
    const adminData = {
      id: (admin._id as any).toString(),
      email: admin.email,
      role: admin.role || "admin",
    };


    return NextResponse.json(
      {
        message: "Login successful",
        user: adminData,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[LOGIN] Error during login:", error);
    
    if (error instanceof Error) {
      console.error("[LOGIN] Error message:", error.message);
      console.error("[LOGIN] Error stack:", error.stack);
    }
    
    return NextResponse.json(
      { 
        message: "Database connection error. Check your MongoDB connection.",
        error: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
} 