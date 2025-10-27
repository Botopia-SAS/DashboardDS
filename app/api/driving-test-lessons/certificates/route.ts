import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import CertificateDrivingLesson from "@/lib/models/CertificateDrivingLesson";
import User from "@/lib/models/User";

export async function GET(req: NextRequest) {
  try {
    await dbConnect();
    
    const { searchParams } = new URL(req.url);
    const studentId = searchParams.get('studentId');
    
    if (!studentId) {
      return NextResponse.json(
        { success: false, message: "Student ID is required" },
        { status: 400 }
      );
    }

    // Get all driving lesson certificates for this student
    const certificates = await CertificateDrivingLesson.find({ 
      studentId,
      classType: 'driving lesson'
    })
      .populate('studentId', 'firstName lastName email phoneNumber license')
      .sort({ createdAt: -1 })
      .exec();

    return NextResponse.json(certificates, { status: 200 });
  } catch (error) {
    console.error("Error fetching certificates:", error);
    return NextResponse.json(
      { success: false, message: "Error fetching certificates" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    await dbConnect();
    const body = await req.json();
    
    console.log('POST /api/driving-test-lessons/certificates - Request body:', JSON.stringify(body, null, 2));
    
    const { studentId, classId, certificateData } = body;

    if (!studentId || !classId) {
      console.error('Missing required fields:', { studentId, classId });
      return NextResponse.json(
        { success: false, message: "Student ID and Class ID are required" },
        { status: 400 }
      );
    }

    // Find or create driving lesson certificate
    let certificate = await CertificateDrivingLesson.findOne({
      studentId,
      classType: 'driving lesson'
    }).exec();

    console.log('Found existing certificate:', !!certificate);

    if (certificate) {
      // Update existing certificate
      console.log('Updating existing certificate with ID:', certificate._id);
      Object.assign(certificate, certificateData);
      await certificate.save();
      console.log('Certificate updated successfully');
    } else {
      // Create new certificate
      console.log('Creating new certificate for studentId:', studentId);
      certificate = await CertificateDrivingLesson.create({
        studentId,
        classId,
        ...certificateData,
      });
      console.log('Certificate created with ID:', certificate._id);
    }

    return NextResponse.json({ success: true, certificate }, { status: 200 });
  } catch (error: any) {
    console.error("Error saving certificate:", error);
    
    // Handle Mongoose validation errors
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map((err: any) => err.message);
      return NextResponse.json(
        { success: false, message: "Validation error", errors: validationErrors },
        { status: 400 }
      );
    }
    
    // Handle cast errors (e.g., invalid ObjectId format)
    if (error.name === 'CastError') {
      return NextResponse.json(
        { success: false, message: `Invalid ${error.path}: ${error.value}` },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { success: false, message: "Error saving certificate", error: error.message },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    await dbConnect();
    const body = await req.json();
    
    console.log('PATCH /api/driving-test-lessons/certificates - Request body:', JSON.stringify(body, null, 2));
    
    const { certificateId, studentId, classId, certificateData } = body;

    // Try to find by certificateId first (for updates)
    let certificate;
    if (certificateId) {
      console.log('Looking for certificate by ID:', certificateId);
      certificate = await CertificateDrivingLesson.findById(certificateId).exec();
      if (certificate) {
        console.log('Found certificate, updating...');
        Object.assign(certificate, certificateData);
        await certificate.save();
        console.log('Certificate updated successfully');
      } else {
        console.log('Certificate not found by ID');
      }
    } else if (studentId && classId) {
      // Fallback to finding by studentId and classType
      console.log('Looking for certificate by studentId and classType:', { studentId, classType: 'driving lesson' });
      certificate = await CertificateDrivingLesson.findOneAndUpdate(
        { studentId, classType: 'driving lesson' },
        { $set: certificateData },
        { new: true, runValidators: true }
      ).exec();
      console.log('Certificate found/updated:', !!certificate);
    } else {
      console.error('Missing required fields for update');
      return NextResponse.json(
        { success: false, message: "Certificate ID or Student ID and Class ID are required" },
        { status: 400 }
      );
    }

    if (!certificate) {
      console.error('Certificate not found');
      return NextResponse.json(
        { success: false, message: "Certificate not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, certificate }, { status: 200 });
  } catch (error: any) {
    console.error("Error updating certificate:", error);
    
    // Handle Mongoose validation errors
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map((err: any) => err.message);
      return NextResponse.json(
        { success: false, message: "Validation error", errors: validationErrors },
        { status: 400 }
      );
    }
    
    // Handle cast errors (e.g., invalid ObjectId format)
    if (error.name === 'CastError') {
      return NextResponse.json(
        { success: false, message: `Invalid ${error.path}: ${error.value}` },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { success: false, message: "Error updating certificate", error: error.message },
      { status: 500 }
    );
  }
}

