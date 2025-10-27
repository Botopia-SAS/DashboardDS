import mongoose, { Schema, Document, Model } from "mongoose";

export interface ICertificateDrivingLesson extends Document {
  studentId: Schema.Types.ObjectId;
  classId: string; // Main class ID (composite string format)
  selectedClassIds: string[]; // All selected class IDs (composite string format)
  classType: string; // "driving lesson"
  totalHours: number;
  completionDate: string;
  instructorName: string;
  instructorSignature: string;
  licenseNumber?: string;
  generated: boolean; // true if certificate was downloaded
  createdAt?: Date;
  updatedAt?: Date;
  [key: string]: any;
}

const CertificateDrivingLessonSchema: Schema = new Schema({
  studentId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  classId: { type: String, required: true },
  selectedClassIds: [{ type: String }],
  classType: { type: String, default: "driving lesson" },
  totalHours: { type: Number },
  completionDate: { type: String },
  instructorName: { type: String },
  instructorSignature: { type: String },
  licenseNumber: { type: String },
  generated: { type: Boolean, default: false },
}, { strict: false, timestamps: true });

// Index for better query performance
CertificateDrivingLessonSchema.index({ studentId: 1, classType: 1 });

const CertificateDrivingLesson: Model<ICertificateDrivingLesson> = mongoose.models.CertificateDrivingLesson || mongoose.model<ICertificateDrivingLesson>("CertificateDrivingLesson", CertificateDrivingLessonSchema);

export default CertificateDrivingLesson;

