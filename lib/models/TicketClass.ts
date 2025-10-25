import mongoose, { Schema, Document, Model } from "mongoose";

export interface ITicketClass extends Document {
  locationId: Schema.Types.ObjectId;
  date: Date;
  hour: string;
  endHour?: string;
  classId: Schema.Types.ObjectId;
  type: string;
  duration: string;
  students: Schema.Types.ObjectId[];
  spots?: number;
  status?: "available" | "cancel" | "full" | "expired";
  studentRequests: Schema.Types.ObjectId[];
  createdAt?: Date;
  updatedAt?: Date;
}

const TicketClassSchema: Schema = new Schema({
  locationId: {
    type: Schema.Types.ObjectId,
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
  },
  classId: {
    type: Schema.Types.ObjectId,
    ref: "DrivingClass",
    required: true,
  },
  type: {
    type: String,
    default: "date",
    required: true,
    lowercase: true
  },
  duration: {
    type: String,
    required: true,
  },
  students: [{
    type: Schema.Types.ObjectId,
    ref: "User",
  }],
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
  studentRequests: [{
    type: Schema.Types.ObjectId,
    ref: "User",
  }],
}, { timestamps: true });

// Index for better query performance
TicketClassSchema.index({ date: 1, status: 1 });
TicketClassSchema.index({ locationId: 1, date: 1 });

const TicketClass: Model<ITicketClass> = mongoose.models.TicketClass || mongoose.model<ITicketClass>("TicketClass", TicketClassSchema);

export default TicketClass;
