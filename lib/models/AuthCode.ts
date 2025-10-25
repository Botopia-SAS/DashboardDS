import mongoose, { Schema, Document, Model } from "mongoose";

export interface IAuthCode extends Document {
  code: string;
  userId: Schema.Types.ObjectId;
  expiresAt: Date;
  used?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

const AuthCodeSchema: Schema = new Schema({
  code: { type: String, required: true, unique: true },
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  expiresAt: { type: Date, required: true },
  used: { type: Boolean, default: false },
}, { timestamps: true });

// Index for better query performance
AuthCodeSchema.index({ code: 1 }, { unique: true });
AuthCodeSchema.index({ userId: 1 });
AuthCodeSchema.index({ expiresAt: 1 });

const AuthCode: Model<IAuthCode> = mongoose.models.AuthCode || mongoose.model<IAuthCode>("AuthCode", AuthCodeSchema);

export default AuthCode;