import mongoose from "mongoose";

const ChecklistItemSchema = new mongoose.Schema({
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

const NoteSchema = new mongoose.Schema({
  text: {
    type: String,
    required: true,
  },
  date: {
    type: Date,
    default: Date.now,
  },
}, { _id: false });

const SessionChecklistSchema = new mongoose.Schema(
  {
    checklistType: {
      type: String,
      required: true,
    },
    sessionId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    instructorId: {
      type: mongoose.Schema.Types.ObjectId,
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

// Force refresh the model to use new schema
if (mongoose.models.SessionChecklist) {
  delete mongoose.models.SessionChecklist;
}

const SessionChecklist = mongoose.model("SessionChecklist", SessionChecklistSchema);
export default SessionChecklist;
