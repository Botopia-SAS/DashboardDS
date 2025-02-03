import mongoose, { Schema, model, models } from "mongoose";

const OnlineCourseSchema = new Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String, required: true, trim: true },
  image: { type: String, required: false, trim: true }, // ✅ Nuevo campo para la imagen
  hasPrice: { type: Boolean, default: false },
  price: { type: Number, min: 0, required: function (this: any) { return this.hasPrice; } },
  type: { type: String, enum: ["Book", "Buy"], required: true },
  buttonLabel: { type: String, required: true, trim: true, maxLength: 20 },
  createdAt: { type: Date, default: Date.now },
});

// ✅ Usar el modelo existente si ya está definido
const OnlineCourse = models.OnlineCourse || model("OnlineCourse", OnlineCourseSchema);

export default OnlineCourse;
