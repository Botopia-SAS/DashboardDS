import mongoose, { Schema, Document, Model } from "mongoose";

export interface IDrivingClass extends Document {
  title: string;
  alsoKnownAs: string[];
  length: number;
  price: number;
  overview: string;
  objectives: string[];
  buttonLabel: string;
  image?: string;
  headquarters: string[];
  classType?: string;
  duration?: "standard" | "4h" | "8h" | "agressive" | "12h";
  createdAt?: Date;
  updatedAt?: Date;
}

const DrivingClassSchema: Schema = new Schema({
  title: { type: String, required: true, unique: true },
  alsoKnownAs: { type: [String], default: [] },
  length: { type: Number, required: true, min: 0.1 },
  price: { type: Number, required: true, min: 0 },
  overview: { type: String, required: true },
  objectives: { type: [String], default: [] },
  buttonLabel: { type: String, required: true },
  image: { type: String, default: "" },
  headquarters: { type: [String], required: true },
  classType: {
    type: String,
    default: "date"
  },
  duration: {
    type: String,
    enum: ["standard", "4h", "8h", "agressive", "12h"],
    default: "standard",
  },
}, { timestamps: true });

const DrivingClass: Model<IDrivingClass> = mongoose.models.DrivingClass || mongoose.model<IDrivingClass>("DrivingClass", DrivingClassSchema);

export default DrivingClass;