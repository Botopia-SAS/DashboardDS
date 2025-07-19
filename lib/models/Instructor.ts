import mongoose from "mongoose";

const InstructorSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    photo: { type: String, required: true },
    certifications: { type: String, default: "" },
    experience: { type: String, default: "" },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    dni: { type: String, required: true },
    canTeachTicketClass: { type: Boolean, default: false },
    canTeachDrivingTest: { type: Boolean, default: false },
    canTeachDrivingLesson: { type: Boolean, default: false },
    schedule_driving_test: [{ type: mongoose.Schema.Types.Mixed, default: [] }],
    schedule_driving_lesson: [{ type: mongoose.Schema.Types.Mixed, default: [] }],
  },
  { timestamps: true }
);

export default mongoose.models.Instructor ||
  mongoose.model("Instructor", InstructorSchema);
