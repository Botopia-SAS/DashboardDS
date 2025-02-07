import mongoose from "mongoose";

const InstructorSchema = new mongoose.Schema({
  name: { type: String, required: true },
  photo: { type: String, required: true },
  certifications: { type: String, default: "" },
  experience: { type: String, default: "" },
  schedule: [
    {
      date: { type: String, required: true }, // YYYY-MM-DD
      slots: [
        {
          start: { type: String, required: true }, // "08:00"
          end: { type: String, required: true }, // "10:00"
          booked: { type: Boolean, default: false }, // ✅ Nuevo campo
        },
      ],
    },
  ],
}, { timestamps: true });

export default mongoose.models.Instructor || mongoose.model("Instructor", InstructorSchema);
