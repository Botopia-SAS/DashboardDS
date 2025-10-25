import User from "@/lib/models/User";
import Order from "@/lib/models/Order";
import Payment from "@/lib/models/Payments";
import TicketClass from "@/lib/models/TicketClass";
import { connectToDB } from "@/lib/mongoDB";
import { NextRequest, NextResponse } from "next/server";
import _ from "lodash";
import bcrypt from "bcryptjs";
import sendEmail from "@/lib/sendEmail";

export const dynamic = "force-dynamic";

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
    // Solo elimina de MongoDB
    await User.deleteOne({ _id: customerId }).exec();
    return NextResponse.json({ message: "Customer deleted" }, { status: 200 });
  } catch (error) {
    console.error("Error deleting customer:", error);
    return NextResponse.json(
      { error: "❌ Error deleting customer", details: (error instanceof Error && error.message) ? error.message : String(error) },
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
    //console.log("PATCH customerId:", customerId);
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
    //console.log("PATCH data:", data);

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
    ];
    const userData = _.pick(data, allowedFields);

    // Si se envía password y es diferente, hashearla y actualizar
    let passwordChanged = false;
    if (data.password && typeof data.password === "string" && data.password.trim() !== "") {
      const hashedPassword = await bcrypt.hash(data.password, 10);
      userData.password = hashedPassword;
      passwordChanged = true;
    }

    // Actualizamos el usuario manteniendo su fecha de creación original
    const updatedUser = await User.findByIdAndUpdate(
      customerId,
      {
        $set: {
          ...userData,
          updatedAt: new Date(),
        },
      },
      { new: true, runValidators: true }
    );

    // If the password changed, send email (in English)
    if (passwordChanged && updatedUser) {
      await sendEmail(
        [updatedUser.email],
        "Your new password for Driving School Dashboard",
        `Hello, your password has been changed.\nEmail: ${updatedUser.email}\nNew password: ${data.password}`,
        `<div style=\"font-family: Arial, sans-serif; background: #f4f6fa; padding: 32px; color: #222;\">
          <div style=\"max-width: 480px; margin: 0 auto; background: #fff; border-radius: 12px; box-shadow: 0 2px 8px #0001; overflow: hidden;\">
            <div style=\"background: #1e40af; color: #fff; padding: 24px 32px 16px 32px; text-align: center;\">
              <h2 style=\"margin: 0; font-size: 1.7rem; letter-spacing: 1px;\">Driving School Dashboard</h2>
            </div>
            <div style=\"padding: 32px 32px 16px 32px;\">
              <p style=\"font-size: 1.1rem; margin-bottom: 18px;\">Hello,</p>
              <p style=\"font-size: 1.1rem; margin-bottom: 18px;\">Your password to access the student panel has been changed:</p>
              <div style=\"background: #f1f5f9; border-radius: 8px; padding: 16px; text-align: center; margin: 18px 0;\">
                <span style=\"font-size: 1.1rem; font-weight: bold; color: #1e40af; letter-spacing: 1px;\">Email: ${updatedUser.email}</span><br/>
                <span style=\"font-size: 1.1rem; font-weight: bold; color: #1e40af; letter-spacing: 1px;\">New password: ${data.password}</span>
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
    }

    if (data.registerForCourse) {
      const order = await Order.create({
        user_id: user._id,
        course_id: data.courseId,
        fee: data.fee || 50,
        status: data.payedAmount === data.fee ? "paid" : "pending",
      });
      //console.log("PATCH payedAmount:", data.payedAmount);
      //console.log("PATCH order.fee:", order.fee);
      if (data.payedAmount === order.fee) {
        //console.log("PATCH: Payment condition met");
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
      //console.log("PATCH: Course registration done");
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
      { error: "❌ Error updating customer", details: (error instanceof Error && error.message) ? error.message : String(error) },
      { status: 500 }
    );
  }
}
