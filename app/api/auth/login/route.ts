import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import Admin from "@/lib/modals/admin.modal";
import { connectToDB } from "@/lib/mongoDB";

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    console.log("[LOGIN] Attempting login for email:", email);

    if (!email || !password) {
      console.log("[LOGIN] Missing email or password");
      return NextResponse.json(
        { message: "Email and password are required" },
        { status: 400 }
      );
    }

    console.log("[LOGIN] Connecting to database...");
    await connectToDB();
    console.log("[LOGIN] Database connected successfully");

    // Find admin in MongoDB - search by exact email
    console.log("[LOGIN] Looking for admin with email:", email.toLowerCase());
    const admin = await Admin.findOne({ email: email.toLowerCase() });
    
    console.log("[LOGIN] Admin found:", !!admin);
    console.log("[LOGIN] Admin data (without password):", admin ? {
      id: admin._id,
      email: admin.email,
      role: admin.role
    } : null);
    
    if (!admin) {
      console.log("[LOGIN] Admin not found in database");
      
      // Check if any admins exist for debugging
      const adminCount = await Admin.countDocuments();
      console.log("[LOGIN] Total admins in database:", adminCount);
      
      if (adminCount === 0) {
        return NextResponse.json(
          { message: "No admins found in database. Please create an admin first." },
          { status: 401 }
        );
      }
      
      // Show available emails for debugging (without passwords)
      const availableAdmins = await Admin.find({}, { email: 1 }).limit(5);
      console.log("[LOGIN] Available admins in database:", availableAdmins);
      
      return NextResponse.json(
        { 
          message: "Admin not found with this email",
          availableEmails: availableAdmins.map(u => u.email)
        },
        { status: 401 }
      );
    }

    console.log("[LOGIN] Verifying password...");
    // Verify password using bcrypt, fallback to plain text for dev
    let isPasswordValid = false;
    try {
      isPasswordValid = await bcrypt.compare(password, admin.password);
    } catch (e) {
      isPasswordValid = false;
    }
    if (!isPasswordValid) {
      // Fallback: plain text comparison (TEMPORAL, solo para desarrollo)
      isPasswordValid = password === admin.password;
      if (isPasswordValid) {
        console.warn("[LOGIN] WARNING: Password matched in plain text. This is insecure and should only be used for development!");
      }
    }
    console.log("[LOGIN] Password valid:", isPasswordValid);

    if (!isPasswordValid) {
      console.log("[LOGIN] Invalid password for admin:", email);
      return NextResponse.json(
        { message: "Invalid password" },
        { status: 401 }
      );
    }

    // Return admin data (without password)
    const adminData = {
      id: admin._id.toString(),
      email: admin.email,
      role: admin.role || "admin",
    };

    console.log("[LOGIN] Login successful for admin:", adminData.email);

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