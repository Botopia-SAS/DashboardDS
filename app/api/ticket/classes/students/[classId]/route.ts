import TicketClass from "@/lib/models/TicketClass";
import { NextRequest, NextResponse } from "next/server";
import { createClerkClient } from "@clerk/backend";
import Certificate from "@/lib/models/Cerificate";

interface Response {
  _id: string;
  locationId: string;
  date: string;
  hour: string;
  classId: string;
  instructorId: string;
  students: string[];
  __v: number;
}

const clerk = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });

export async function GET(req: NextRequest) {
  const classId = req.url.split("/").pop();
  const res: Response = await TicketClass.findOne({ _id: classId }).exec();
  const studentsIds = res.students;
  const students = [];
  for (const student of studentsIds) {
    const user = await clerk.users.getUser(student);
    const cert = await Certificate.findOne({
      studentId: user.id,
      classId,
    }).exec();
    students.push({
      id: user.id,
      first_name: user.firstName,
      last_name: user.lastName,
      certn: cert?.number || 0,
      midl: "",
      payedAmount: cert?.payedAmount || 0,
      birthDate: user.publicMetadata.birthDate,
    });
  }
  return NextResponse.json(students, { status: 200 });
}
export async function PATCH(req: NextRequest) {
  const classId = req.url.split("/").pop();
  const { id, certn, payedAmount } = await req.json();
  const user = await clerk.users.getUser(id);
  
  // If certificate number is provided, check if it's already used by another certificate
  if (certn) {
    const existingCertWithNumber = await Certificate.findOne({
      number: Number(certn),
      studentId: { $ne: user.id } // Not by this student
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
    studentId: user.id,
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
