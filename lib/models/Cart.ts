import mongoose, { Schema, Document, Model } from "mongoose";

interface CartItem {
  productId: Schema.Types.ObjectId;
  quantity: number;
  price: number;
}

export interface ICart extends Document {
  userId: Schema.Types.ObjectId;
  items: CartItem[];
  totalAmount: number;
  status: string;
  createdAt?: Date;
  updatedAt?: Date;
}

const CartSchema: Schema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  items: [{
    productId: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    quantity: { type: Number, required: true, min: 1 },
    price: { type: Number, required: true, min: 0 }
  }],
  totalAmount: { type: Number, required: true, default: 0 },
  status: { type: String, enum: ["active", "abandoned", "converted"], default: "active" },
}, { timestamps: true });

// Index for better query performance
CartSchema.index({ userId: 1 });
CartSchema.index({ status: 1 });

const Cart: Model<ICart> = mongoose.models.Cart || mongoose.model<ICart>("Cart", CartSchema);

export default Cart;