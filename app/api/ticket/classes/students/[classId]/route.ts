import User from "@/lib/modals/user.modal";
import Certificate from "@/lib/models/Cerificate";
import Order from "@/lib/models/Order";
import Payment from "@/lib/models/Payments";
import TicketClass from "@/lib/models/TicketClass";
// import Location from "../../../../../../lib/models/Locations";
import { connectToDB } from "@/lib/mongoDB";
import { NextRequest, NextResponse } from "next/server";

// interface Student {
//   studentId: string;
//   reason?: string;
//   citation_number?: string;
//   country_ticket?: string;
//   course_country?: string;
// }

// interface Response {
//   _id: string;
//   locationId: string;
//   date: string;
//   hour: string;
//   classId: string;
//   type: string;
//   students: Student[];
//   __v: number;
// }

export async function GET(req: NextRequest) {
  await connectToDB();
  const classId = req.url.split("/").pop();
  
  const ticketClass = await TicketClass.findById(classId).exec();
  
  if (!ticketClass) {
    return NextResponse.json({ error: "Class not found" }, { status: 404 });
  }
  
  const students = [];
  
  // Get location information for address
  let locationAddress = "";
  if (ticketClass.locationId) {
    try {
      const { default: Location } = await import("@/lib/models/Locations");
      const location = await Location.findById(ticketClass.locationId).exec();
      if (location) {
        locationAddress = location.zone || "";
        console.log('Location found for address:', locationAddress);
      }
    } catch (error) {
      console.error('Error importing Location model:', error);
    }
  }
  
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
      citation_number: cert?.citation_number || "", // Get from certificate data
      licenseNumber: user.licenseNumber,
      // Add ticket class data
      locationId: ticketClass.locationId,
      address: locationAddress, // Real address from locations table
      duration: ticketClass.duration,
      type: ticketClass.type,
      hour: ticketClass.hour,
      endHour: ticketClass.endHour,
    });
  }
  
  return NextResponse.json(students, { status: 200 });
}

export async function PATCH(req: NextRequest) {
  try {
    await connectToDB();
    const classId = req.url.split("/").pop();
    const { id, certn, payedAmount, paymentMethod, citation_number } = await req.json();
    console.log('API received citation_number:', citation_number);
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

    // Save citation number in Certificate table if provided
    if (citation_number !== undefined) {
      console.log('About to save citation_number:', citation_number, 'for student:', user._id, 'class:', classId);
      
      // Find existing certificate for this student and class
      const cert = await Certificate.findOne({
        studentId: user._id,
        classId,
      }).exec();

      if (cert) {
        // Update existing certificate with citation number
        cert.citation_number = citation_number;
        await cert.save();
        console.log('Certificate updated with citation_number:', cert.citation_number);
      } else {
        // Create new certificate with citation number (if certn is also provided)
        if (certn) {
          await Certificate.create({
            studentId: user._id,
            classId,
            number: Number(certn),
            citation_number: citation_number,
          });
          console.log('New certificate created with citation_number:', citation_number);
        }
      }
    }

    // Check if there's an existing payment record to update
    const existingPayment = await Payment.findOne({ user_id: user._id }).exec();
    
    // Verificar si hay pago existente cuando se proporciona un nuevo pago
    if (payedAmount > 0) {

        // Check if there's an existing payment record to update
        if (existingPayment) {
          existingPayment.amount = payedAmount;
          if (paymentMethod) {
            existingPayment.method = paymentMethod;
          }
          await existingPayment.save();
        } else {
          // If no payment method is provided, use a default
          const method = paymentMethod || "Other";
          // Create a new payment record WITHOUT creating an order
          await Payment.create({
            user_id: user._id,
            amount: payedAmount,
            method: method,
          });
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
        }).exec();
        
        if (!existingPayment && (!payedAmount || payedAmount <= 0)) {
          return NextResponse.json(
            {
              success: false,
              message: `Cannot assign certificate without valid payment.`,
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
