import mongoose, { Schema, Document, Model } from "mongoose";

export interface INote extends Document {
  title?: string;
  content: string;
  type: string;
  relatedTo?: {
    model: string;
    id: Schema.Types.ObjectId;
  };
  userId?: Schema.Types.ObjectId;
  instructorId?: Schema.Types.ObjectId;
  adminId?: Schema.Types.ObjectId;
  priority?: string;
  tags?: string[];
  private: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

const NoteSchema: Schema = new Schema({
  title: { type: String },
  content: { type: String, required: true },
  type: { 
    type: String, 
    enum: ["general", "student_note", "instructor_note", "class_note", "system_note", "reminder"], 
    default: "general" 
  },
  relatedTo: {
    model: { 
      type: String, 
      enum: ["User", "Instructor", "DrivingClass", "Order", "Session", "Certificate"] 
    },
    id: { type: Schema.Types.ObjectId }
  },
  userId: { type: Schema.Types.ObjectId, ref: "User" },
  instructorId: { type: Schema.Types.ObjectId, ref: "Instructor" },
  adminId: { type: Schema.Types.ObjectId, ref: "Admin" },
  priority: { 
    type: String, 
    enum: ["low", "medium", "high", "urgent"], 
    default: "medium" 
  },
  tags: { type: [String], default: [] },
  private: { type: Boolean, default: false },
}, { timestamps: true });

// Index for better query performance
NoteSchema.index({ type: 1, createdAt: -1 });
NoteSchema.index({ "relatedTo.model": 1, "relatedTo.id": 1 });
NoteSchema.index({ userId: 1 });
NoteSchema.index({ instructorId: 1 });
NoteSchema.index({ adminId: 1 });
NoteSchema.index({ tags: 1 });

const Note: Model<INote> = mongoose.models.Note || mongoose.model<INote>("Note", NoteSchema);

export default Note;