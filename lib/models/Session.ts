import mongoose, { Schema, Document, Model } from "mongoose";

export interface ISession extends Document {
  sessionId: string;
  userId: Schema.Types.ObjectId;
  instructorId?: Schema.Types.ObjectId;
  classId?: Schema.Types.ObjectId;
  startTime: Date;
  endTime?: Date;
  duration?: number;
  status: string;
  type: string;
  location?: string;
  notes?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

const SessionSchema: Schema = new Schema({
  sessionId: { type: String, required: true, unique: true },
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  instructorId: { type: Schema.Types.ObjectId, ref: "Instructor" },
  classId: { type: Schema.Types.ObjectId, ref: "DrivingClass" },
  startTime: { type: Date, required: true },
  endTime: { type: Date },
  duration: { type: Number }, // in minutes
  status: { 
    type: String, 
    enum: ["scheduled", "in_progress", "completed", "cancelled", "no_show"], 
    default: "scheduled" 
  },
  type: { 
    type: String, 
    enum: ["driving_lesson", "driving_test", "ticket_class", "online_course"], 
    required: true 
  },
  location: { type: String },
  notes: { type: String },
}, { timestamps: true });

// Index for better query performance (sessionId index is already defined as unique in schema)
SessionSchema.index({ userId: 1, startTime: -1 });
SessionSchema.index({ instructorId: 1, startTime: -1 });
SessionSchema.index({ status: 1, type: 1 });

const Session: Model<ISession> = mongoose.models.Session || mongoose.model<ISession>("Session", SessionSchema);

export default Session;