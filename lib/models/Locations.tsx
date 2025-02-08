import mongoose from "mongoose";

const locationSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    unique: true,
  },
  description: {
    type: String,
  },
  zone: {
    type: String,
    required: true,
  },
  locationImage: {
    type: String, // URL de la imagen de la ubicación
    required: false,
  },
  instructors: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Instructor", // ✅ Referencia al modelo "Instructor"
    },
  ],
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Evitar redefinir el modelo si ya existe
const Location = mongoose.models.Location || mongoose.model("Location", locationSchema);

export default Location;
