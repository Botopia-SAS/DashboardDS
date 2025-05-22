import mongoose from "mongoose";

const CertificateSchema = new mongoose.Schema({
  number: { type: Number, default: 0, unique: true },
  studentId: { type: String, required: true },
  classId: { type: String, required: true },
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
  courseFee: { type: Number, default: 100 },
  // Common fields used by all certificate types
  reason: { type: String },
  country_ticket: { type: String },
  course_country: { type: String },
});

CertificateSchema.index({ studentId: 1, classId: 1 }, { unique: true });

const Certificate =
  mongoose.models.Certificate ||
  mongoose.model("Certificate", CertificateSchema);
export default Certificate;
