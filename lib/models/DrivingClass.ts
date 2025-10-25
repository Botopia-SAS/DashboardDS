import mongoose, { Schema, Document, Model } from "mongoose";

export interface IDrivingClass extends Document {
  title: string;
  description: string;
  type: string;
  duration: number;
  price: number;
  maxStudents?: number;
  instructorId: Schema.Types.ObjectId;
  schedule: {
    date: Date;
    startTime: string;
    endTime: string;
  }[];
  location?: string;
  requirements?: string[];
  materials?: string[];
  status: string;
  enrolledStudents?: Schema.Types.ObjectId[];
  createdAt?: Date;
  updatedAt?: Date;
}

const DrivingClassSchema: Schema = new Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  type: { 
    type: String, 
    enum: ["driving_lesson", "driving_test", "ticket_class", "defensive_driving"], 
    required: true 
  },
  duration: { type: Number, required: true, min: 1 }, // in hours
  price: { type: Number, required: true, min: 0 },
  maxStudents: { type: Number, default: 1 },
  instructorId: { type: Schema.Types.ObjectId, ref: "Instructor", required: true },
  schedule: [{
    date: { type: Date, required: true },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true }
  }],
  location: { type: String },
  requirements: { type: [String], default: [] },
  materials: { type: [String], default: [] },
  status: { 
    type: String, 
    enum: ["active", "inactive", "completed", "cancelled"], 
    default: "active" 
  },
  enrolledStudents: [{ type: Schema.Types.ObjectId, ref: "User" }],
}, { timestamps: true });

// Index for better query performance
DrivingClassSchema.index({ type: 1, status: 1 });
DrivingClassSchema.index({ instructorId: 1 });
DrivingClassSchema.index({ "schedule.date": 1 });

const DrivingClass: Model<IDrivingClass> = mongoose.models.DrivingClass || mongoose.model<IDrivingClass>("DrivingClass", DrivingClassSchema);

export default DrivingClass;