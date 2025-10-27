import mongoose, { Schema, Document, Model } from "mongoose";

interface ChecklistItem {
  name: string;
  completed?: boolean;
  rating?: number;
  comments?: string;
  tally?: number;
}

interface Note {
  text: string;
  date?: Date;
}

export interface ISessionChecklist extends Document {
  checklistType: string;
  sessionId: Schema.Types.ObjectId;
  studentId: Schema.Types.ObjectId;
  instructorId: Schema.Types.ObjectId;
  items: ChecklistItem[];
  notes: Note[];
  status?: "pending" | "in_progress" | "completed";
  createdAt?: Date;
  updatedAt?: Date;
}

const ChecklistItemSchema: Schema = new Schema({
  name: {
    type: String,
    required: true,
  },
  completed: {
    type: Boolean,
    default: false,
  },
  rating: {
    type: Number,
    min: 0,
    max: 10,
  },
  comments: {
    type: String,
    default: "",
  },
  tally: {
    type: Number,
    default: 0,
  },
}, { _id: false });

const NoteSchema: Schema = new Schema({
  text: {
    type: String,
    required: true,
  },
  date: {
    type: Date,
    default: Date.now,
  },
}, { _id: false });

const SessionChecklistSchema: Schema = new Schema(
  {
    checklistType: {
      type: String,
      required: true,
    },
    sessionId: {
      type: Schema.Types.ObjectId,
      required: true,
    },
    studentId: {
      type: Schema.Types.Mixed, // Accept both ObjectId and String
      ref: "User",
      required: true,
    },
    instructorId: {
      type: Schema.Types.ObjectId,
      ref: "Instructor",
      required: true,
    },
    items: {
      type: [ChecklistItemSchema],
      default: [],
    },
    notes: {
      type: [NoteSchema],
      default: [],
    },
    status: {
      type: String,
      enum: ["pending", "in_progress", "completed"],
      default: "pending",
    },
  },
  { timestamps: true }
);

// Index for faster queries by student
SessionChecklistSchema.index({ studentId: 1, createdAt: -1 });

const SessionChecklist: Model<ISessionChecklist> = mongoose.models.SessionChecklist || mongoose.model<ISessionChecklist>("SessionChecklist", SessionChecklistSchema);

export default SessionChecklist;
