import { model, models } from "mongoose";
import { Schema } from "mongoose";

const PaymentsSchema = new Schema({
  order : {
    type: Schema.Types.ObjectId,
    ref: "Order",
    required: true,
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
});

const Payment = models.Payments || model("Payments", PaymentsSchema);

export default Payment;
