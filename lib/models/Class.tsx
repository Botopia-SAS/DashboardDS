import mongoose from "mongoose";

const classSchema = new mongoose.Schema({
  title: { type: String, required: true, unique: true },
  alsoKnownAs: { type: [String], default: [] },
  length: { type: Number, required: true, min: 0.1 },
  price: { type: Number, required: true, min: 0 },
  overview: { type: String, required: true },
  objectives: { type: [String], default: [] },
  contact: { type: String, required: true, match: /^\d{10,15}$/ },
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
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

const DrivingClass = mongoose.models.DrivingClass || mongoose.model("DrivingClass", classSchema);

export default DrivingClass;
