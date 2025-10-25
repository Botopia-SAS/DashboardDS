import { Schema, model, models } from "mongoose";

const AdminSchema = new Schema({
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    default: "admin",
  },
  // Puedes agregar más campos si los necesitas
});

const Admin = models.Admin || model("Admin", AdminSchema, "admin");

export default Admin; 