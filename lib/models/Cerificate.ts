import mongoose from "mongoose";

const CertificateSchema = new mongoose.Schema({
  number: { type: Number, default: 0, unique: true },
  studentId: { type: String, required: true },
  classId: { type: String, required: true },
  date: { type: Date, default: Date.now },
});

CertificateSchema.index({ studentId: 1, classId: 1 }, { unique: true });

const Certificate =
  mongoose.models.Certificate ||
  mongoose.model("Certificate", CertificateSchema);
export default Certificate;
