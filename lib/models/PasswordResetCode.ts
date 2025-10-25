import mongoose, { Schema, Document, Model } from "mongoose";

export interface IPasswordResetCode extends Document {
  code: string;
  email: string;
  userId: Schema.Types.ObjectId;
  expiresAt: Date;
  used: boolean;
  ipAddress?: string;
  userAgent?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

const PasswordResetCodeSchema: Schema = new Schema({
  code: { type: String, required: true, unique: true },
  email: { type: String, required: true },
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  expiresAt: { type: Date, required: true },
  used: { type: Boolean, default: false },
  ipAddress: { type: String },
  userAgent: { type: String },
}, { timestamps: true });

// Index for better query performance
PasswordResetCodeSchema.index({ code: 1 }, { unique: true });
PasswordResetCodeSchema.index({ email: 1, used: false });
PasswordResetCodeSchema.index({ userId: 1 });
PasswordResetCodeSchema.index({ expiresAt: 1 });

const PasswordResetCode: Model<IPasswordResetCode> = mongoose.models.PasswordResetCode || mongoose.model<IPasswordResetCode>("PasswordResetCode", PasswordResetCodeSchema);

export default PasswordResetCode;