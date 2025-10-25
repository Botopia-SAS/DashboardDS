import mongoose, { Schema, Document, Model } from "mongoose";

export interface IPackage extends Document {
  title: string;
  description: string;
  media: string[];
  price: number;
  category: "Lessons" | "Packages";
  type: "Book" | "Buy" | "Contact";
  buttonLabel: string;
  createdAt?: Date;
  updatedAt?: Date;
}

const PackageSchema: Schema = new Schema({
  title: { type: String, required: true, unique: true },
  description: {
    type: String,
    required: true,
  },
  media: { type: [String], default: [] },
  price: { type: Number, required: true, min: 0.1 },
  category: { type: String, enum: ["Lessons", "Packages"], required: true },
  type: { type: String, enum: ["Book", "Buy", "Contact"], required: true },
  buttonLabel: { type: String, required: true },
}, { timestamps: true });

const Package: Model<IPackage> = mongoose.models.Package || mongoose.model<IPackage>("Package", PackageSchema);

export default Package;
