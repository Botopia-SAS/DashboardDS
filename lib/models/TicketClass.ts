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
  students: {
    type: [mongoose.Schema.Types.Mixed],
    default: [],
  },
  spots: {
    type: Number,
    default: 30,
    min: 1,
  },
  status: {
    type: String,
    enum: ["available", "cancel", "full", "expired"],
    default: "available",
    required: true,
  },
  studentRequests: {
    type: [String],
    default: [],
  },
  instructorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Instructor",
    required: true,
  },
});

// Index to prevent the same instructor from having multiple classes at the same date/hour
// This allows different instructors to teach at the same time
TicketClassSchema.index(
  { date: 1, hour: 1, instructorId: 1 },
  { unique: true }
);

// Indexes para evitar duplicados por fecha y clase
TicketClassSchema.index({ date: 1, classId: 1 });

// Force refresh the model to use new schema
if (mongoose.models.TicketClass) {
  delete mongoose.models.TicketClass;
}

const TicketClass = mongoose.model("TicketClass", TicketClassSchema);
export default TicketClass;
