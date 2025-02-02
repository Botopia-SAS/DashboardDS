import mongoose from "mongoose";

const classSchema = new mongoose.Schema({
    title: { type: String, required: true, unique: true },
    alsoKnownAs: { type: [String], default: [] },
    length: { type: Number, required: true, min: 0.1 },
    price: { type: Number, required: true, min: 0 },
    overview: { type: String, required: true },
    objectives: { type: [String], default: [] }, // ✅ Nuevo campo
    contact: { type: String, required: true, match: [/^\S+@\S+\.\S+$/, "Invalid email"] },
    buttonLabel: { type: String, required: true },
    image: { type: String, default: "" },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  });
  
  const DrivingClass = mongoose.models.DrivingClass || mongoose.model("DrivingClass", classSchema);
  
  export default DrivingClass;
  