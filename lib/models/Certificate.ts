import mongoose, { Schema, Document, Model } from "mongoose";

export interface ICertificate extends Document {
  number?: number;
  studentId: Schema.Types.ObjectId;
  classId: Schema.Types.ObjectId;
  date?: Date;
  // Fields for Date certificate
  birthDate?: string;
  // Fields for BDI certificate
  licenseNumber?: string;
  address?: string;
  citation_number?: string;
  // Fields for ADI certificate
  userAddress?: string;
  courseAddress?: string;
  courseTime?: string;
  attendanceReason?: string;
  courseFee?: number;
  // Common fields used by all certificate types
  reason?: string;
  country_ticket?: string;
  course_country?: string;
  // Instructor information
  instructorName?: string;
  createdAt?: Date;
  updatedAt?: Date;
  // Allow dynamic fields for certificate templates
  [key: string]: any;
}

const CertificateSchema: Schema = new Schema({
  number: { type: Number, default: 0 },
  studentId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  classId: { type: Schema.Types.ObjectId, ref: "DrivingClass", required: true },
  date: { type: Date, default: Date.now },
  // Fields for Date certificate
  birthDate: { type: String },
  // Fields for BDI certificate
  licenseNumber: { type: String },
  address: { type: String },
  citation_number: { type: String },
  // Fields for ADI certificate
  userAddress: { type: String },
  courseAddress: { type: String },
  courseTime: { type: String },
  attendanceReason: { type: String },
  courseFee: { type: Number, default: 100 },
  // Common fields used by all certificate types
  reason: { type: String },
  country_ticket: { type: String },
  course_country: { type: String },
  // Instructor information
  instructorName: { type: String },
  // Allow dynamic fields for certificate templates
}, { strict: false, timestamps: true });

// Index for better query performance (number index is already defined as unique in schema)
CertificateSchema.index({ studentId: 1, classId: 1 }, { unique: true });

const Certificate: Model<ICertificate> = mongoose.models.Certificate || mongoose.model<ICertificate>("Certificate", CertificateSchema);

export default Certificate;
