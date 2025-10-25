import mongoose, { Schema, Document, Model } from "mongoose";

export interface ITransaction extends Document {
  transactionId: string;
  userId: Schema.Types.ObjectId;
  orderId?: Schema.Types.ObjectId;
  amount: number;
  currency: string;
  status: string;
  paymentMethod: string;
  paymentProvider?: string;
  providerTransactionId?: string;
  description?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

const TransactionSchema: Schema = new Schema({
  transactionId: { type: String, required: true, unique: true },
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  orderId: { type: Schema.Types.ObjectId, ref: "Order" },
  amount: { type: Number, required: true, min: 0 },
  currency: { type: String, required: true, default: "USD" },
  status: { 
    type: String, 
    enum: ["pending", "completed", "failed", "cancelled", "refunded"], 
    required: true 
  },
  paymentMethod: { 
    type: String, 
    enum: ["credit_card", "debit_card", "paypal", "bank_transfer", "cash"], 
    required: true 
  },
  paymentProvider: { type: String },
  providerTransactionId: { type: String },
  description: { type: String },
}, { timestamps: true });

// Index for better query performance
TransactionSchema.index({ transactionId: 1 }, { unique: true });
TransactionSchema.index({ userId: 1, createdAt: -1 });
TransactionSchema.index({ status: 1 });
TransactionSchema.index({ orderId: 1 });

const Transaction: Model<ITransaction> = mongoose.models.Transaction || mongoose.model<ITransaction>("Transaction", TransactionSchema);

export default Transaction;