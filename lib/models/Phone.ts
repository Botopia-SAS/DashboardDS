import mongoose, { Schema, Document, Model } from "mongoose";

export interface IPhone extends Document {
  key: string;
  phoneNumber: string;
  createdAt?: Date;
  updatedAt?: Date;
}

const PhoneSchema: Schema = new Schema({
  key: { 
    type: String, 
    required: true, 
    unique: true,
    default: "main"
  },
  phoneNumber: { 
    type: String, 
    required: true 
  },
}, { timestamps: true });

const Phone: Model<IPhone> = mongoose.models.Phone || mongoose.model<IPhone>("Phone", PhoneSchema);
export default Phone;
