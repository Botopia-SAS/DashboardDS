import mongoose from "mongoose";

let isConnected: boolean = false;

export const connectToDB = async (): Promise<void> => {
  mongoose.set("strictQuery", true)

  if (isConnected) {
    console.log("MongoDB is already connected");
    return;
  }

  try {
    await mongoose.connect(process.env.MONGODB_URL || "", {
      dbName: "DrivingSchool_Admin"
    })

    isConnected = true;
    console.log("✅ MongoDB is connected");
  } catch (err) {
    console.error("❌ Error conectando a MongoDB:", err);
    throw new Error("Database connection failed"); // 🔥 Esto causará un error si la conexión falla
  }
};