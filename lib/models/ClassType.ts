import mongoose from "mongoose";

const classTypeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    uppercase: true
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// Middleware para actualizar updatedAt
classTypeSchema.pre('findOneAndUpdate', function() {
  this.set({ updatedAt: new Date() });
});

const ClassType = mongoose.models.ClassType || mongoose.model("ClassType", classTypeSchema);

export default ClassType;