import mongoose from "mongoose";

const MONGODB_URL = process.env.MONGODB_URL || "";

if (!MONGODB_URL) {
  throw new Error(
    "❌ No se ha definido MONGODB_URL en las variables de entorno"
  );
}

let isConnected: boolean = false; // Mantiene el control de conexión existente
let cached = (global as any).mongoose || { conn: null, promise: null }; // Agrega caché global para conexiones repetidas

export const connectToDB = async (): Promise<void> => {
  mongoose.set("strictQuery", true);

  if (isConnected) {
    console.log("MongoDB is already connected");
    return;
  }

  // Si ya hay una conexión en caché, la reutiliza
  if (cached.conn) {
    console.log("✅ Usando conexión en caché a MongoDB");
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
    (global as any).mongoose = cached; // Guarda la conexión en la caché global

    isConnected = true;
    console.log("✅ MongoDB is connected correctamente");
  } catch (err) {
    console.error("❌ Error conectando a MongoDB:", err);
    throw new Error("Database connection failed");
  }
};
