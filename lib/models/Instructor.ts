import mongoose from "mongoose";

const InstructorSchema = new mongoose.Schema(
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
    schedule_driving_test: [{ type: mongoose.Schema.Types.Mixed, default: [] }],
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
      studentId: String,
      studentName: String,
      paid: Boolean
    }],
  },
  { timestamps: true }
);

export default mongoose.models.Instructor ||
  mongoose.model("Instructor", InstructorSchema);
