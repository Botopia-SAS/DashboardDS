import { Schema, model, models } from "mongoose";

const UserSchema = new Schema({
  clerkId: {
    type: String,
    required: true,
    unique: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  firstName: {
    type: String,
    required: true,
  },
  middleName: {
    type: String,
  },
  lastName: {
    type: String,
    required: true,
  },
  ssnLast4: {
    type: String,
    required: true,
  },
  hasLicense: {
    type: Boolean,
    default: false,
  },
  licenseNumber: {
    type: String,
  },
  birthDate: {
    type: String,
    required: true,
  },
  streetAddress: {
    type: String,
    required: true,
  },
  apartmentNumber: {
    type: String,
    required: true,
  },
  city: {
    type: String,
    required: true,
  },
  state: {
    type: String,
    required: true,
  },
  zipCode: {
    type: String,
    required: true,
  },
  phoneNumber: {
    type: String,
    required: true,
  },
  sex: {
    type: String,
    required: true,
  },
  howDidYouHear: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    default: "user",
  },
  registeredBy: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Add a pre-save hook to update the updatedAt field
UserSchema.pre("save", function (next) {
  this.updatedAt = new Date();
  next();
});

const User = models.User || model("User", UserSchema);

export default User;
