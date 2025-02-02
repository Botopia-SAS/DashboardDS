import mongoose from "mongoose";

const collectionSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    unique: true,
  },
  description: {
    type: String,
  },
  image: {
    type: String,
    required: true,
  },
  price: {
    type: Number, // 🔹 Asegurar que `price` es un número
    required: true, // 🔹 Hacerlo obligatorio
    min: 0, // 🔹 Evitar valores negativos
  },
  products: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
    }
  ],
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  }
});

// Evitar redefinir el modelo si ya existe
const Collection = mongoose.models.Collection || mongoose.model("Collection", collectionSchema);

export default Collection;
