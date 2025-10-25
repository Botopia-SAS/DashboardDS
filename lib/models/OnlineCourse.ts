import mongoose, { Schema, Document, Model } from "mongoose";

export interface IOnlineCourse extends Document {
  title: string;
  description: string;
  image?: string;
  hasPrice?: boolean;
  price?: number;
  type: "Book" | "Buy";
  buttonLabel: string;
  createdAt?: Date;
  updatedAt?: Date;
}

const OnlineCourseSchema: Schema = new Schema({
  title: { type: String, required: true, trim: true, unique: true },
  description: { type: String, required: true, trim: true },
  image: { type: String, trim: true },
  hasPrice: { type: Boolean, default: false },
  price: { type: Number, min: 0, required: function (this: { hasPrice: boolean }) { return this.hasPrice; } },
  type: { type: String, enum: ["Book", "Buy"], required: true },
  buttonLabel: { type: String, required: true, trim: true, maxLength: 20 },
}, { timestamps: true });

const OnlineCourse: Model<IOnlineCourse> = mongoose.models.OnlineCourse || mongoose.model<IOnlineCourse>("OnlineCourse", OnlineCourseSchema);

export default OnlineCourse;
