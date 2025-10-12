import User from "@/lib/modals/user.modal";
import Certificate from "@/lib/models/Cerificate";
import Order from "@/lib/models/Order";
import Payment from "@/lib/models/Payments";
import TicketClass from "@/lib/models/TicketClass";
import { connectToDB } from "@/lib/mongoDB";
import { NextRequest, NextResponse } from "next/server";

interface Student {
  studentId: string;
  reason?: string;
  citation_number?: string;
  country_ticket?: string;
  course_country?: string;
}

interface Response {
  _id: string;
  locationId: string;
  date: string;
  hour: string;
  classId: string;
  type: string;
  students: Student[];
  __v: number;
}

export async function GET(req: NextRequest) {
  await connectToDB();
  const classId = req.url.split("/").pop();
  
  const ticketClass = await TicketClass.findById(classId).exec();
  
  if (!ticketClass) {
    return NextResponse.json({ error: "Class not found" }, { status: 404 });
  }
  
  const students = [];
  
  // Ensure students is an array before iterating
  const studentsArray = Array.isArray(ticketClass.students) ? ticketClass.students : [];
  
  for (const studentEntry of studentsArray) {
    // Handle both cases: direct ID strings or objects with studentId
    let studentId;
    if (typeof studentEntry === 'string') {
      studentId = studentEntry;
    } else if (studentEntry && typeof studentEntry === 'object' && studentEntry.studentId) {
      studentId = studentEntry.studentId;
    } else {
      continue;
    }
    
    const user = await User.findOne({ _id: studentId }).exec();
    if (!user) {
      continue; // Skip if user not found
    }
    
    const payment = await Payment.findOne({
      user_id: studentId,
    }).exec();
    const cert = await Certificate.findOne({
      studentId: user.id,
      classId,
    }).exec();
    students.push({
      id: user.id,
      mfl_affiliate: 158996,
      schoolid: 1453,
      classid: 2181,
      instructorId: "N/A", // No instructor assigned to ticket classes
      instructorName: "N/A",
      first_name: user.firstName,
      midl: user.middleName,
      last_name: user.lastName,
      certn: cert?.number || 0,
      payedAmount: payment?.amount || 0,
      birthDate: new Date(user.birthDate).toLocaleDateString("en-US", {
        timeZone: "UTC",
      }),
      courseDate: new Date(ticketClass.date).toLocaleDateString("en-US", {
        timeZone: "UTC",
      }),
      sex: user.sex,
      reason: "", // These fields are no longer stored in studentEntry
      country_ticket: "",
      course_country: "",
      citation_number: "",
      licenseNumber: user.licenseNumber,
    });
  }
  
  return NextResponse.json(students, { status: 200 });
}

export async function PATCH(req: NextRequest) {
  try {
    await connectToDB();
    const classId = req.url.split("/").pop();
    const { id, certn, payedAmount, paymentMethod } = await req.json();
    const user = await User.findOne({ _id: id }).exec();
    if (!user) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }

    // Obtenemos los datos de la clase para verificar el tipo
    const ticketClass = await TicketClass.findOne({
      _id: classId,
    }).exec();

    if (!ticketClass) {
      return NextResponse.json(
        { success: false, message: "Class not found" },
        { status: 404 }
      );
    }

    // Determinamos el monto requerido según el tipo de clase
    let requiredAmount = 50; // Default para "date" y "bdi"
    if (ticketClass.type && ticketClass.type.toLowerCase() === "adi") {
      requiredAmount = 100;
    }

    // Verificamos si ya existe un pago para este estudiante y clase
    const existingOrder = await Order.findOne({
      user_id: user._id,
      course_id: classId,
      status: "paid",
    }).exec();

    // Verificar si hay pago existente cuando se proporciona un nuevo pago
    if (payedAmount > 0) {
      if (existingOrder) {
        // Si ya existe un pago, solo actualizamos el método de pago si se proporciona
        if (paymentMethod) {
          const payment = await Payment.findOne({
            order: existingOrder._id,
          }).exec();
          if (payment) {
            payment.method = paymentMethod;
            await payment.save();
          }
        }
      } else {
        if (payedAmount !== requiredAmount) {
          return NextResponse.json(
            {
              success: false,
              message: `Payment amount must be exactly $${requiredAmount} for this class type (${ticketClass.type})`,
            },
            { status: 400 }
          );
        }

        // Para pagos de certificados, NO creamos una orden automáticamente
        // Solo creamos el registro de pago sin asociarlo a ninguna orden
        
        // Check if there's an existing payment record to update
        const payment = await Payment.findOne({ user_id: user._id }).exec();
        if (payment) {
          payment.amount = payedAmount;
          if (paymentMethod) {
            payment.method = paymentMethod;
          }
          await payment.save();
        } else {
          // If no payment method is provided, use a default
          const method = paymentMethod || "Other";
          // Create a new payment record WITHOUT creating an order
          await Payment.create({
            user_id: user._id,
            amount: payedAmount,
            method: method,
            // No incluimos order: order._id para evitar crear la relación con una orden
          });
        }
      }
    }

    // Procesamos el número de certificado independientemente del estado del pago
    if (certn) {
      // If certificate number is provided, check if it's already used by another certificate
      const existingCertWithNumber = await Certificate.findOne({
        number: Number(certn),
        studentId: { $ne: user._id }, // Not by this student
      }).exec();

      if (existingCertWithNumber) {
        return NextResponse.json(
          { success: false, message: "Certificate number already exists" },
          { status: 400 }
        );
      }

      // Find existing certificate for this student and class
      const cert = await Certificate.findOne({
        studentId: user._id,
        classId,
      }).exec();

      if (cert) {
        // Update existing certificate
        cert.number = Number(certn);
        await cert.save();
      } else {
        // Verificar si existe un pago válido antes de crear un certificado
        // Buscar pago válido directamente en la tabla Payment
        const existingPayment = await Payment.findOne({
          user_id: user._id,
          amount: requiredAmount,
        }).exec();
        
        if (
          !existingPayment &&
          (!payedAmount || payedAmount !== requiredAmount)
        ) {
          return NextResponse.json(
            {
              success: false,
              message: `Cannot assign certificate without valid payment. Required payment: $${requiredAmount}`,
            },
            { status: 400 }
          );
        }

        // Create new certificate
        await Certificate.create({
          studentId: user.id,
          classId,
          number: Number(certn),
        });
      }
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("Error in PATCH operation:", error);
    return NextResponse.json(
      {
        success: false,
        message: (error as Error).message || "An error occurred",
      },
      { status: 500 }
    );
  }
}
