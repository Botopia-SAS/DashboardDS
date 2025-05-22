import mongoose from "mongoose";

const SlotSchema = new mongoose.Schema(
  {
    date: { type: String, required: true }, // YYYY-MM-DD
    start: { type: String, required: true }, // "HH:mm"
    end: { type: String, required: true },   // "HH:mm"
    booked: { type: Boolean, default: false },
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    status: { type: String, default: "free" },
  },
  { _id: false }
);

const InstructorSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    photo: { type: String, required: true },
    certifications: { type: String, default: "" },
    experience: { type: String, default: "" },
    schedule: [SlotSchema], // Flat array of slot objects
    email: { type: String, required: true, unique: true },
    auth0Id: { type: String, required: true, unique: true },
    dni: { type: String, required: true },
  },
  { timestamps: true }
);

export default mongoose.models.Instructor || mongoose.model("Instructor", InstructorSchema);
