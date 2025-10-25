import mongoose, { Schema, Document, Model } from "mongoose";

export interface IGmailTemplate extends Document {
  name: string;
  subject: string;
  body: string;
  type: string;
  variables?: string[];
  active: boolean;
  description?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

const GmailTemplateSchema: Schema = new Schema({
  name: { type: String, required: true, unique: true },
  subject: { type: String, required: true },
  body: { type: String, required: true },
  type: { 
    type: String, 
    enum: ["welcome", "confirmation", "reminder", "notification", "marketing", "support"], 
    required: true 
  },
  variables: { type: [String], default: [] },
  active: { type: Boolean, default: true },
  description: { type: String },
}, { timestamps: true });

// Index for better query performance
GmailTemplateSchema.index({ name: 1 }, { unique: true });
GmailTemplateSchema.index({ type: 1, active: 1 });

const GmailTemplate: Model<IGmailTemplate> = mongoose.models.GmailTemplate || mongoose.model<IGmailTemplate>("GmailTemplate", GmailTemplateSchema);

export default GmailTemplate;