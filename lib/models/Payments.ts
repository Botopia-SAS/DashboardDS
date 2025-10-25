import mongoose, { Schema, Document, Model } from "mongoose";

export interface IPayment extends Document {
  order?: Schema.Types.ObjectId;
  user_id: Schema.Types.ObjectId;
  amount: number;
  method: string;
  createdAt?: Date;
  updatedAt?: Date;
}

const PaymentSchema: Schema = new Schema({
  order : {
    type: Schema.Types.ObjectId,
    ref: "Order",
  },
  user_id: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  amount: {
    type: Number,
    required: true,
  },
  method: {
    type: String,
    required: true,
  },
}, { timestamps: true });

// Index for better query performance
PaymentSchema.index({ user_id: 1, createdAt: -1 });
PaymentSchema.index({ order: 1 });

const Payment: Model<IPayment> = mongoose.models.Payment || mongoose.model<IPayment>("Payment", PaymentSchema);

export default Payment;
