import mongoose, { Schema, Document, Model } from "mongoose";

export interface IContact extends Document {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber?: string;
  subject: string;
  message: string;
  status: string;
  source?: string;
  userId?: Schema.Types.ObjectId;
  createdAt?: Date;
  updatedAt?: Date;
}

const ContactSchema: Schema = new Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true },
  phoneNumber: { type: String },
  subject: { type: String, required: true },
  message: { type: String, required: true },
  status: { 
    type: String, 
    enum: ["new", "in_progress", "resolved", "closed"], 
    default: "new" 
  },
  source: { 
    type: String, 
    enum: ["website", "phone", "email", "social_media", "referral"], 
    default: "website" 
  },
  userId: { type: Schema.Types.ObjectId, ref: "User" },
}, { timestamps: true });

// Index for better query performance
ContactSchema.index({ status: 1, createdAt: -1 });
ContactSchema.index({ email: 1 });
ContactSchema.index({ userId: 1 });

const Contact: Model<IContact> = mongoose.models.Contact || mongoose.model<IContact>("Contact", ContactSchema);

export default Contact;