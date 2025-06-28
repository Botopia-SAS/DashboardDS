import mongoose from "mongoose";

const TicketClassSchema = new mongoose.Schema({
  locationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Location",
    required: true,
  },
  date: {
    type: Date,
    required: true,
  },
  hour: {
    type: String,
    required: true,
  },
  endHour: {
    type: String,
    required: false,
  },
  classId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "DrivingClass",
    required: true,
  },
  type: {
    type: String,
    enum: ["date", "bdi", "adi"],
    default: "date",
    required: true,
  },
  duration: {
    type: String,
    required: true,
  },
  instructorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Instructor",
    required: true,
  },
  students: [
    {
      studentId: { type: String, required: true },
      reason: { type: String },
      citation_number: { type: String },
      country_ticket: { type: String },
      course_country: { type: String },
    },
  ],
});

TicketClassSchema.index(
  { date: 1, hour: 1, instructorId: 1 },
  { unique: true }
);

TicketClassSchema.index({ date: 1, hour: 1, students: 1 }, { unique: true });

const TicketClass =
  mongoose.models.TicketClass ||
  mongoose.model("TicketClass", TicketClassSchema);
export default TicketClass;
