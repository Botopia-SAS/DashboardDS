import TicketClass from "@/lib/models/TicketClass";
import User from "@/lib/models/User";
import Certificate from "@/lib/models/Certificate";
import { connectToDB } from "@/lib/mongoDB";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    await connectToDB();
    const customerId = req.nextUrl.pathname.split("/")[3]; // /api/customers/[customerId]/certificates

    if (!customerId) {
      return NextResponse.json(
        { error: "Customer ID is required" },
        { status: 400 }
      );
    }

    console.log("🔍 Searching for certificates for customer:", customerId);

    // Find all ticket classes where this student is enrolled
    const allTicketClasses = await TicketClass.find({
      students: { $exists: true, $ne: [] }
    })
      .populate("classId", "_id title")
      .populate("locationId", "_id title")
      .lean();

    console.log(`📚 Found ${allTicketClasses.length} total ticket classes`);

    const certificates: any[] = [];

    // Filter classes where the student is enrolled
    for (const ticketClass of allTicketClasses) {
      if (!ticketClass.students || !Array.isArray(ticketClass.students)) {
        continue;
      }

      // Check if customerId is in the students array
      const isEnrolled = ticketClass.students.some((student: any) => {
        if (typeof student === "string") {
          return student === customerId || student.toString() === customerId;
        } else if (student && typeof student === "object") {
          const studentId = student.studentId || student._id || student.id;
          return studentId && (studentId === customerId || studentId.toString() === customerId);
        }
        return false;
      });

      if (isEnrolled) {
        // Now fetch detailed student info from the students endpoint logic
        // We need to check if this student has a certificate number assigned
        try {
          // Use the same logic as the students endpoint to get certificate info
          const studentInfo = await User.findById(customerId).lean();

          if (studentInfo) {
            // Check if there's certificate data for this student in this class
            // For now, we'll check if the class is in the past and assume certificate was issued
            const classDate = new Date(ticketClass.date);
            const now = new Date();

            // Only show as certificate if class date has passed
            if (classDate < now) {
              const classInfo: any = ticketClass.classId;
              const locationInfo: any = ticketClass.locationId;

              console.log("✅ Found potential certificate for class:", {
                class: classInfo?.title,
                date: ticketClass.date,
                studentId: customerId
              });

              // Search for the actual certificate in the database
              let certificateNumber = "Pending";
              try {
                // First, try to find certificate by studentId and classId (TicketClass ID)
                let certificate = await Certificate.findOne({
                  studentId: customerId,
                  classId: ticketClass._id?.toString()
                }).lean();

                // If not found, try with the classId from classInfo
                if (!certificate && classInfo?._id) {
                  certificate = await Certificate.findOne({
                    studentId: customerId,
                    classId: classInfo._id.toString()
                  }).lean();
                }

                // If still not found, get the most recent certificate for this student
                // (since a student might have completed multiple classes but only one certificate)
                if (!certificate) {
                  const allCerts = await Certificate.find({ studentId: customerId })
                    .sort({ date: -1 })
                    .lean();
                  
                  if (allCerts.length > 0) {
                    certificate = allCerts[0]; // Use the most recent certificate
                    console.log("📜 Using most recent certificate for student:", certificate.number);
                  } else {
                    console.log("🔍 No certificate found for studentId:", customerId);
                  }
                }

                if (certificate && !Array.isArray(certificate) && certificate.number) {
                  certificateNumber = certificate.number.toString();
                  console.log("✅ Certificate number:", certificateNumber);
                }
              } catch (certErr) {
                console.error("Error fetching certificate:", certErr);
              }

              certificates.push({
                _id: `${ticketClass._id}_${customerId}`,
                certificateNumber: certificateNumber,
                className: classInfo?.title || "Unknown Class",
                classId: classInfo?._id,
                locationName: locationInfo?.title || "Unknown Location",
                classDate: ticketClass.date,
                issueDate: ticketClass.date,
                duration: ticketClass.duration,
                status: "completed",
              });
            }
          }
        } catch (userErr) {
          console.error("Error fetching user info:", userErr);
        }
      }
    }

    console.log(`✅ Returning ${certificates.length} certificates for customer`);

    // Sort by date descending
    certificates.sort((a, b) => new Date(b.classDate).getTime() - new Date(a.classDate).getTime());

    return NextResponse.json(certificates, { status: 200 });
  } catch (error) {
    console.error("Error fetching certificates:", error);
    return NextResponse.json(
      {
        error: "Error fetching certificates",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
