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
    
    console.log('🔍 Raw certificate from DB:', cert?.toObject());
    
    // Build student object with base fields
    const studentData: any = {
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
    };
    
    // Add dynamic fields from certificate if they exist
    if (cert) {
      const certObj = cert.toObject();
      console.log('📋 Loading certificate data for student:', user.firstName, certObj);
      console.log('🔍 Certificate has courseTime:', certObj.courseTime);
      console.log('🔍 Certificate has attendanceReason:', certObj.attendanceReason);
      Object.keys(certObj).forEach((key) => {
        // Skip fields that are already in studentData
        if (!['_id', 'studentId', 'classId', 'number', 'citation_number', '__v'].includes(key)) {
          studentData[key] = certObj[key];
          if (key === 'courseTime' || key === 'attendanceReason') {
            console.log('✅ Loaded', key, ':', certObj[key]);
          }
        }
      });
    } else {
      console.log('❌ No certificate found for student:', user.firstName);
    }
    
    students.push(studentData);
  }
  
  return NextResponse.json(students, { status: 200 });
}

export async function PATCH(req: NextRequest) {
  try {
    await connectToDB();
    const classId = req.url.split("/").pop();
    const body = await req.json();
    const { id, certn, payedAmount, paymentMethod, citation_number, ...dynamicFields } = body;
    console.log('API received data:', body);
    console.log('Dynamic fields:', dynamicFields);
    
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

    // Find or create certificate for this student and class
    let cert = await Certificate.findOne({
      studentId: user._id,
      classId,
    }).exec();

    // If no certificate exists yet, create one
    if (!cert) {
      cert = await Certificate.create({
        studentId: user._id,
        classId,
        number: Number(certn) || 0,
      });
      console.log('Created new certificate for student:', user._id);
    }

    // Save ALL dynamic fields to certificate
    if (Object.keys(dynamicFields).length > 0 || citation_number !== undefined) {
      console.log('Saving dynamic fields to certificate:', { ...dynamicFields, citation_number });
      
      // Update citation number if provided
      if (citation_number !== undefined) {
        cert.citation_number = citation_number;
      }
      
      // Update all other dynamic fields
      Object.entries(dynamicFields).forEach(([key, value]) => {
        cert[key] = value;
        if (key === 'courseTime' || key === 'attendanceReason') {
          console.log('💾 Saving', key, ':', value);
        }
      });
      
      // Force save attendanceReason specifically
      if (dynamicFields.attendanceReason !== undefined) {
        cert.attendanceReason = dynamicFields.attendanceReason;
        console.log('🔧 FORCING attendanceReason save:', dynamicFields.attendanceReason);
      }
      
      await cert.save();
      console.log('Certificate updated with all fields');
      
      // Verify the save worked
      const savedCert = await Certificate.findOne({
        studentId: user._id,
        classId,
      }).exec();
      console.log('🔍 Verification - Saved certificate:', savedCert?.toObject());
      console.log('🔍 Verification - attendanceReason specifically:', savedCert?.attendanceReason);
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

    // Update certificate number if provided
    if (certn) {
      // Check if certificate number is already used by another student
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

      // Update the certificate number
      cert.number = Number(certn);
      await cert.save();
      console.log('Certificate number updated to:', certn);
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
