import User from "@/lib/models/User";
import Order from "@/lib/models/Order";
import Payment from "@/lib/models/Payments";
import TicketClass from "@/lib/models/TicketClass";
import { connectToDB } from "@/lib/mongoDB";
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import sendEmail from "@/lib/sendEmail";

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
          birthDate: user.birthDate,
          firstName: user.firstName,
          lastName: user.lastName,
          middleName: user.middleName,
          licenseNumber: user.licenseNumber,
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
    await connectToDB();
    const data = await req.json();

    // Validar datos requeridos
    if (!data.email || !data.password || !data.firstName || !data.lastName) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Hashear la contraseña antes de guardar
    const hashedPassword = await bcrypt.hash(data.password, 10);

    // Guardar el usuario en MongoDB
    const user = await User.create({
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
      password: hashedPassword,
      role: "user",
      createdAt: new Date(),
    });

    // Send credentials email to the user (in English)
    await sendEmail(
      [data.email],
      "Your credentials for Driving School Dashboard",
      `Hello, your account has been created.\nEmail: ${data.email}\nPassword: ${data.password}`,
      `<div style=\"font-family: Arial, sans-serif; background: #f4f6fa; padding: 32px; color: #222;\">
        <div style=\"max-width: 480px; margin: 0 auto; background: #fff; border-radius: 12px; box-shadow: 0 2px 8px #0001; overflow: hidden;\">
          <div style=\"background: #1e40af; color: #fff; padding: 24px 32px 16px 32px; text-align: center;\">
            <h2 style=\"margin: 0; font-size: 1.7rem; letter-spacing: 1px;\">Driving School Dashboard</h2>
          </div>
          <div style=\"padding: 32px 32px 16px 32px;\">
            <p style=\"font-size: 1.1rem; margin-bottom: 18px;\">Hello,</p>
            <p style=\"font-size: 1.1rem; margin-bottom: 18px;\">Your credentials to access the student panel are:</p>
            <div style=\"background: #f1f5f9; border-radius: 8px; padding: 16px; text-align: center; margin: 18px 0;\">
              <span style=\"font-size: 1.1rem; font-weight: bold; color: #1e40af; letter-spacing: 1px;\">Email: ${data.email}</span><br/>
              <span style=\"font-size: 1.1rem; font-weight: bold; color: #1e40af; letter-spacing: 1px;\">Password: ${data.password}</span>
            </div>
            <p style=\"font-size: 1rem; color: #555;\">For security, please change your password after logging in.</p>
          </div>
          <div style=\"background: #e5e7eb; color: #1e293b; text-align: center; padding: 16px 32px; font-size: 0.95rem; border-top: 1px solid #cbd5e1;\">
            <p style=\"margin: 0;\">If you have any questions, please contact your administrator.</p>
            <p style=\"margin: 0; font-size: 0.93rem; color: #64748b;\">&copy; ${new Date().getFullYear()} Driving School Dashboard</p>
          </div>
        </div>
      </div>`
    );

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
      if (course) {
        const students = course.students || [];
        students.push(user._id);
        await TicketClass.updateOne({ _id: data.courseId }, { students });
      } else {
        console.warn(`Course with ID ${data.courseId} not found`);
      }
    }

    return NextResponse.json({
      message: "User created successfully",
      user: {
        id: user.id,
        email: user.email,
        name: `${user.firstName} ${user.middleName ?? ""} ${user.lastName}`,
      },
    });
  } catch (error) {
    console.log("Error creando usuario:", error);
    return NextResponse.json(
      { error: "❌ Error creando usuario" },
      { status: 500 }
    );
  }
}
