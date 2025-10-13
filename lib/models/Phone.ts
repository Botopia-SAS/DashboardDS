import mongoose, { Schema, Document, Model } from "mongoose";

export interface IPhone extends Document {
  key: string;
  phoneNumber: string;
  createdAt: Date;
  updatedAt: Date;
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
  createdAt: { 
    type: Date, 
    default: Date.now 
  },
  updatedAt: { 
    type: Date, 
    default: Date.now 
  },
});

// Add a pre-save hook to update the updatedAt field
PhoneSchema.pre("save", function (next) {
  this.updatedAt = new Date();
  next();
});

const Phone: Model<IPhone> = mongoose.models.Phone || mongoose.model<IPhone>("Phone", PhoneSchema);
export default Phone;
