import mongoose from "mongoose";

const productSchema = new mongoose.Schema({
  title: { type: String, required: true, unique: true },
  description: { type: String, required: true },
  media: { type: [String], default: [] }, // URLs de imágenes/videos
  price: { type: Number, required: true, min: 0.1 },
  duration: { type: Number, required: true, min: 1, validate: { validator: Number.isInteger, message: 'Duration must be a whole number' } }, // Duración en horas
  category: { type: String, enum: ["General", "Road Skills for Life"], required: true },
  type: { type: String, enum: ["Book", "Buy", "Contact"], required: true },
  buttonLabel: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

const Product = mongoose.models.Product || mongoose.model("Product", productSchema);
export default Product;
