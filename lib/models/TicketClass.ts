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
    enum: ["normal", "4h", "8h", "agressive", "12h"],
    default: "normal",
    required: true,
  },
  instructorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Instructor",
    required: true,
  },
  students: [
    {
      type: String,
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
