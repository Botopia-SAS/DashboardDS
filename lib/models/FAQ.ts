import mongoose, { Schema, Document, Model } from "mongoose";

export interface IFAQ extends Document {
  question: string;
  answer: string;
  category: string;
  order?: number;
  active: boolean;
  tags?: string[];
  createdAt?: Date;
  updatedAt?: Date;
}

const FAQSchema: Schema = new Schema({
  question: { type: String, required: true },
  answer: { type: String, required: true },
  category: { 
    type: String, 
    enum: ["general", "driving_lessons", "driving_test", "ticket_class", "pricing", "scheduling", "certificates"], 
    required: true 
  },
  order: { type: Number, default: 0 },
  active: { type: Boolean, default: true },
  tags: { type: [String], default: [] },
}, { timestamps: true });

// Index for better query performance
FAQSchema.index({ category: 1, active: 1, order: 1 });
FAQSchema.index({ tags: 1 });

const FAQ: Model<IFAQ> = mongoose.models.FAQ || mongoose.model<IFAQ>("FAQ", FAQSchema);

export default FAQ;