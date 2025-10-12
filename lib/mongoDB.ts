import mongoose from "mongoose";

// Import all models to ensure they are registered
import "@/lib/models/users";
import "@/lib/models/TicketClass";
import "@/lib/models/Locations";
import "@/lib/models/Class";
import "@/lib/models/Instructor";
import "@/lib/models/Order";
import "@/lib/models/Product";
import "@/lib/models/Package";
import "@/lib/models/Collection";
import "@/lib/models/OnlineCourse";
import "@/lib/models/SEO";
import "@/lib/models/Settings";
import "@/lib/models/ScheduledEmail";
import "@/lib/models/EmailTemplate";
import "@/lib/models/Cerificate";
import "@/lib/models/ResumenSeccion";
import "@/lib/models/Payments";

const MONGODB_URL = process.env.MONGODB_URL || "";

if (!MONGODB_URL) {
  throw new Error(
    "❌ No se ha definido MONGODB_URL en las variables de entorno"
  );
}

let isConnected: boolean = false; // Mantiene el control de conexión existente
// eslint-disable-next-line @typescript-eslint/no-explicit-any
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
