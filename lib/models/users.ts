import mongoose, { Schema, Document, Model } from "mongoose";

export interface IUser extends Document {
  firstName: string;
  middleName?: string;
  lastName: string;
  email: string;
  ssnLast4?: string;
  hasLicense?: boolean;
  licenseNumber?: string;
  birthDate: Date;
  streetAddress?: string;
  apartmentNumber?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  phoneNumber?: string;
  sex?: string;
  howDidYouHear?: string;
  role?: string;
  createdAt?: Date;
  updatedAt?: Date;
  privateNotes?: string;
}

const UserSchema: Schema = new Schema({
  firstName: { type: String, required: true },
  middleName: { type: String },
  lastName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  ssnLast4: { type: String },
  hasLicense: { type: Boolean },
  licenseNumber: { type: String },
  birthDate: { type: Date, required: true },
  streetAddress: { type: String },
  apartmentNumber: { type: String },
  city: { type: String },
  state: { type: String },
  zipCode: { type: String },
  phoneNumber: { type: String },
  sex: { type: String },
  howDidYouHear: { type: String },
  role: { type: String, default: "User" },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  privateNotes: { type: String },
});

const User: Model<IUser> = mongoose.models.User || mongoose.model<IUser>("User", UserSchema);
export default User;
