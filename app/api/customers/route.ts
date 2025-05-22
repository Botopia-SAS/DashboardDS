import User from "@/lib/modals/user.modal";
import Order from "@/lib/models/Order";
import Payment from "@/lib/models/Payments";
import TicketClass from "@/lib/models/TicketClass";
import { connectToDB } from "@/lib/mongoDB";
import { NextRequest, NextResponse } from "next/server";

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

    // 1. Obtener un token de acceso de Auth0
    const tokenRes = await fetch(`https://${process.env.AUTH0_DOMAIN}/oauth/token`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        client_id: process.env.AUTH0_CLIENT_ID,
        client_secret: process.env.AUTH0_CLIENT_SECRET,
        audience: `https://${process.env.AUTH0_DOMAIN}/api/v2/`,
        grant_type: 'client_credentials',
      })
    });
    const tokenData = await tokenRes.json();
    if (!tokenData.access_token) {
      return NextResponse.json(
        { error: "Failed to get Auth0 access token" },
        { status: 500 }
      );
    }
    const access_token = tokenData.access_token;

    // 2. Crear el usuario en Auth0
    const userRes = await fetch(`https://${process.env.AUTH0_DOMAIN}/api/v2/users`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'authorization': `Bearer ${access_token}`
      },
      body: JSON.stringify({
        email: data.email,
        password: data.password,
        connection: 'Username-Password-Authentication',
        given_name: data.firstName,
        family_name: data.lastName
      })
    });
    const auth0User = await userRes.json();
    if (!auth0User.user_id) {
      return NextResponse.json(
        { error: auth0User.message || "Failed to create user in Auth0" },
        { status: 400 }
      );
    }

    // 3. Guardar el usuario en MongoDB
    const user = await User.create({
      auth0Id: auth0User.user_id,
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
      howDidYouHear: data.howDidYouHear,
      registeredBy: data.registeredBy,
      role: "user",
    });

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
      const students = course.students || [];
      students.push(user._id);
      await TicketClass.updateOne({ _id: data.courseId }, { students });
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
    console.error("Error creating user:", error);
    return NextResponse.json(
      { error: "Failed to create user" },
      { status: 500 }
    );
  }
}
