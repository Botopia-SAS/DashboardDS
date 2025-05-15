import { model, models, Schema } from "mongoose";

const OrderSchema = new Schema({
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
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

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

const Order = models.Order || model("Order", OrderSchema);

export default Order;
