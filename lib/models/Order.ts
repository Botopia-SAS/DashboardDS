import mongoose, { Schema, Document, Model } from "mongoose";

export interface IOrder extends Document {
  orderNumber?: number;
  user_id: Schema.Types.ObjectId;
  course_id: Schema.Types.ObjectId;
  fee: number;
  status: string;
  createdAt?: Date;
  updatedAt?: Date;
}

const OrderSchema: Schema = new Schema({
  orderNumber: {
    type: Number,
    unique: true,
  },
  user_id: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  course_id: {
    type: Schema.Types.ObjectId,
    ref: "DrivingClass",
    required: true,
  },
  fee: {
    type: Number,
    required: true,
    default: 50,
  },
  status: {
    type: String,
    required: true,
  },
}, { timestamps: true });

// Index for better query performance
OrderSchema.index({ user_id: 1, createdAt: -1 });
OrderSchema.index({ status: 1 });

OrderSchema.pre("save", async function (next) {
  if (!this.orderNumber) {
    const lastOrder = await Order.findOne(
      {},
      {},
      { sort: { orderNumber: -1 } }
    );
    this.orderNumber = (lastOrder?.orderNumber || 0) + 1;
  }
  next();
});

const Order: Model<IOrder> = mongoose.models.Order || mongoose.model<IOrder>("Order", OrderSchema);

export default Order;
