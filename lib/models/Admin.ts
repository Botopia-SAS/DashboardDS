import mongoose, { Schema, Document, Model } from "mongoose";

export interface IAdmin extends Document {
  username: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: string;
  permissions: string[];
  active: boolean;
  lastLogin?: Date;
  loginAttempts?: number;
  lockUntil?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

const AdminSchema: Schema = new Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  role: { 
    type: String, 
    enum: ["super_admin", "admin", "manager", "support"], 
    default: "admin" 
  },
  permissions: { 
    type: [String], 
    default: [],
    enum: [
      "users_read", "users_write", "users_delete",
      "orders_read", "orders_write", "orders_delete",
      "classes_read", "classes_write", "classes_delete",
      "instructors_read", "instructors_write", "instructors_delete",
      "certificates_read", "certificates_write", "certificates_delete",
      "settings_read", "settings_write",
      "reports_read", "reports_write"
    ]
  },
  active: { type: Boolean, default: true },
  lastLogin: { type: Date },
  loginAttempts: { type: Number, default: 0 },
  lockUntil: { type: Date },
}, { timestamps: true });

// Index for better query performance
AdminSchema.index({ username: 1 }, { unique: true });
AdminSchema.index({ email: 1 }, { unique: true });
AdminSchema.index({ role: 1, active: 1 });

const Admin: Model<IAdmin> = mongoose.models.Admin || mongoose.model<IAdmin>("Admin", AdminSchema);

export default Admin;