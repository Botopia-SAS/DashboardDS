import mongoose from "mongoose";

const packageSchema = new mongoose.Schema({
  title: { type: String, required: true, unique: true },
  description: {
    type: String, // 🔹 Volvemos a agregarlo
    required: true,
  },
  media: { type: [String], default: [] }, // ✅ Asegurar que media siempre sea un array
  price: { type: Number, required: true, min: 0.1 },
  category: { type: String, enum: ["Lessons", "Packages"], required: true },
  type: { type: String, enum: ["Book", "Buy", "Contact"], required: true },
  buttonLabel: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// ✅ Evitar redefinir el modelo si ya existe
const Package = mongoose.models.Package || mongoose.model("Package", packageSchema);
export default Package;
