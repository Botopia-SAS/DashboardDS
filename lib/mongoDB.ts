import mongoose from "mongoose";

const MONGODB_URL = process.env.MONGODB_URL || "";

if (!MONGODB_URL) {
  throw new Error(
    "❌ No se ha definido MONGODB_URL en las variables de entorno"
  );
}

let isConnected: boolean = false; // Mantiene el control de conexión existente
// eslint-disable-next-line prefer-const, @typescript-eslint/no-explicit-any
const cached = (global as any).mongoose || { conn: null, promise: null };

export const connectToDB = async (): Promise<void> => {
  mongoose.set("strictQuery", true);

  if (isConnected) {
    console.log("MongoDB is already connected");
    return;
  }

  // Si ya hay una conexión en caché, la reutiliza
  if (cached.conn) {
    console.log("✅ Using cached MongoDB connection");
    isConnected = true;
    return;
  }

  try {
    cached.promise =
      cached.promise ||
      mongoose.connect(MONGODB_URL, {
        dbName: "DrivingSchool_Admin",
        bufferCommands: false,
        connectTimeoutMS: 30000, // 🔥 Agregado timeout para evitar bloqueos
      });

    cached.conn = await cached.promise;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (global as any).mongoose = cached;

    isConnected = true;
    console.log("✅ MongoDB is connected correctly");
  } catch (err) {
    console.error("❌ Error connecting to MongoDB:", err);
    throw new Error("Database connection failed");
  }
};
