import User from "@/lib/modals/user.modal";
import Certificate from "@/lib/models/Cerificate";
import Payment from "@/lib/models/Payments";
import TicketClass from "@/lib/models/TicketClass";
import { NextRequest, NextResponse } from "next/server";
import { connectToDB } from "@/lib/mongoDB";

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
      first_name: user.firstName,
      last_name: user.lastName,
      certn: cert?.number || 0,
      midl: user.middleName,
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
  const { id, certn, payedAmount } = await req.json();
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
