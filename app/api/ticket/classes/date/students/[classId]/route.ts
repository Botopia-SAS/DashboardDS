import User from "@/lib/modals/user.modal";
import Certificate from "@/lib/models/Cerificate";
import Instructor from "@/lib/models/Instructor";
import Order from "@/lib/models/Order";
import Payment from "@/lib/models/Payments";
import TicketClass from "@/lib/models/TicketClass";
import { connectToDB } from "@/lib/mongoDB";
import { NextRequest, NextResponse } from "next/server";

interface Response {
  _id: string;
  locationId: string;
  date: string;
  hour: string;
  classId: string;
  instructorId: string;
  type: string;
  students: string[];
  __v: number;
}

export async function GET(req: NextRequest) {
  await connectToDB();
  const classId = req.url.split("/").pop();
  const res: Response = await TicketClass.findOne({
    _id: classId,
    type: "date",
  }).exec();
  if (!res) {
    return NextResponse.json({ error: "Class not found" }, { status: 404 });
  }
  const instructor = await Instructor.findOne({
    _id: res.instructorId,
  })
  const studentsIds = res.students;
  const students = [];
  for (const student of studentsIds) {
    const user = await User.findOne({ _id: student }).exec();
    const payment = await Payment.findOne({ user_id: student }).exec();
    const cert = await Certificate.findOne({
      studentId: user.id,
      classId,
    }).exec();
    students.push({
      id: user.id,
      mfl_affiliate: 158996,
      schoolid: 1453,
      classid: 2181,
      instructorId: instructor.dni,
      first_name: user.firstName,
      midl: user.middleName,
      last_name: user.lastName,
      certn: cert?.number || 0,
      payedAmount: payment?.amount || 0,
      birthDate: new Date(user.birthDate).toLocaleDateString("en-US", {
        timeZone: "UTC",
      }),
      courseDate: new Date(res.date).toLocaleDateString("en-US", {
        timeZone: "UTC",
      }),
      sex: user.sex,
    });
  }
  return NextResponse.json(students, { status: 200 });
}
export async function PATCH(req: NextRequest) {
  const classId = req.url.split("/").pop();
  const { id, certn, payedAmount, paymentMethod } = await req.json();
  const user = await User.findOne({ _id: id }).exec();

  // If certificate number is provided, check if it's already used by another certificate
  if (certn) {
    const existingCertWithNumber = await Certificate.findOne({
      number: Number(certn),
      studentId: { $ne: user._id }, // Not by this student
    }).exec();

    if (existingCertWithNumber) {
      return NextResponse.json(
        { success: false, message: "Certificate number already exists" },
        { status: 500 }
      );
    }
  }
  if (payedAmount) {
    // Check if the student already has a pending payment for this course
    const existingCert = await Order.findOne({
      studentId: user._id,
      course_id: classId,
      status: "complete",
    }).exec();

    if (existingCert) {
      return NextResponse.json(
        {
          success: false,
          message: "Pending payment already exists for this course",
        },
        { status: 400 }
      );
    }

    const payment = await Payment.findOne({ user_id: user._id }).exec();
    if (payment) {
      payment.amount = payedAmount;
      await payment.save();
    } else {
      await Payment.create({
        user_id: user._id,
        amount: payedAmount,
        method: paymentMethod,
      });
    }
  }
  // Find existing certificate for this student and class
  const cert = await Certificate.findOne({
    studentId: user._id,
    classId,
  }).exec();

  if (cert) {
    // Update existing certificate
    cert.number = Number(certn);
    cert.payedAmount = payedAmount;
    await cert.save();
  } else {
    // Create new certificate
    await Certificate.create({
      studentId: user.id,
      classId,
      number: Number(certn),
      payedAmount,
    });
  }

  return NextResponse.json({ success: true }, { status: 200 });
}
