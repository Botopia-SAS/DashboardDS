import mongoose, { Schema, Document, Model } from "mongoose";

export interface IClassType extends Document {
  name: string;
  createdAt?: Date;
  updatedAt?: Date;
}

const ClassTypeSchema: Schema = new Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    uppercase: true
  },
}, { timestamps: true });



const ClassType: Model<IClassType> = mongoose.models.ClassType || mongoose.model<IClassType>("ClassType", ClassTypeSchema);

export default ClassType;