import mongoose from "mongoose";

const SlotSchema = new mongoose.Schema(
  {
    date: { type: String, required: true }, // YYYY-MM-DD
    start: { type: String, required: true }, // "HH:mm"
    end: { type: String, required: true },   // "HH:mm"
    booked: { type: Boolean, default: false },
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    status: { type: String, default: "free" },
    classType: { type: String, enum: ["D.A.T.E", "B.D.I", "A.D.I", "driving test"], required: false },
    amount: { type: Number, default: null },
    paid: { type: Boolean, default: false },
    pickupLocation: { type: String, default: "" },
    dropoffLocation: { type: String, default: "" },
    ticketClassId: { type: mongoose.Schema.Types.ObjectId, ref: "TicketClass", required: false },
  },
  { _id: true } // Cambiado: ahora cada slot tendrá un _id único
);

const InstructorSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    photo: { type: String, required: true },
    certifications: { type: String, default: "" },
    experience: { type: String, default: "" },
    schedule: [SlotSchema], // Flat array of slot objects
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    dni: { type: String, required: true },
  },
  { timestamps: true }
);

export default mongoose.models.Instructor ||
  mongoose.model("Instructor", InstructorSchema);
