import mongoose, { Schema, Document, Model } from "mongoose";

interface ScheduleDrivingLesson {
  _id?: string;
  date: string;
  start: string;
  end: string;
  status: string;
  classType: string;
  pickupLocation: string;
  dropoffLocation: string;
  selectedProduct: string;
  studentId: Schema.Types.ObjectId;
  studentName: string;
  paid: boolean;
}

export interface IInstructor extends Document {
  name: string;
  photo: string;
  certifications?: string;
  experience?: string;
  email: string;
  password: string;
  canTeachTicketClass?: boolean;
  canTeachDrivingTest?: boolean;
  canTeachDrivingLesson?: boolean;
  schedule_driving_test?: Schema.Types.Mixed[];
  schedule_driving_lesson?: ScheduleDrivingLesson[];
  createdAt?: Date;
  updatedAt?: Date;
}

const InstructorSchema: Schema = new Schema(
  {
    name: { type: String, required: true },
    photo: { type: String, required: true },
    certifications: { type: String, default: "" },
    experience: { type: String, default: "" },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    canTeachTicketClass: { type: Boolean, default: false },
    canTeachDrivingTest: { type: Boolean, default: false },
    canTeachDrivingLesson: { type: Boolean, default: false },
    schedule_driving_test: [{ type: Schema.Types.Mixed, default: [] }],
    schedule_driving_lesson: [{
      _id: String,
      date: String,
      start: String,
      end: String,
      status: String,
      classType: String,
      pickupLocation: String,
      dropoffLocation: String,
      selectedProduct: String,
      studentId: { type: Schema.Types.ObjectId, ref: "User" },
      studentName: String,
      paid: Boolean
    }],
  },
  { timestamps: true }
);

const Instructor: Model<IInstructor> = mongoose.models.Instructor || mongoose.model<IInstructor>("Instructor", InstructorSchema);

export default Instructor;
