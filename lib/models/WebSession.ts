import mongoose, { Schema, Document, Model } from "mongoose";

interface HeatmapEvent {
  x: number;
  y: number;
  eventType: string;
  timestamp: Date;
}

interface Page {
  url: string;
  timestamp: Date;
  duration?: number;
  heatmap?: HeatmapEvent[];
}

interface Geolocation {
  country?: string;
  city?: string;
  latitude?: number;
  longitude?: number;
  vpn?: boolean;
}

export interface IWebSession extends Document {
  sessionId: string;
  userId?: string;
  ipAddress?: string;
  userAgent?: string;
  startTimestamp: Date;
  endTimestamp?: Date;
  lastActive?: Date;
  geolocation?: Geolocation;
  pages?: Page[];
  createdAt?: Date;
  updatedAt?: Date;
}

const HeatmapEventSchema: Schema = new Schema({
  x: { type: Number, required: true },
  y: { type: Number, required: true },
  eventType: { type: String, required: true },
  timestamp: { type: Date, required: true }
}, { _id: false });

const PageSchema: Schema = new Schema({
  url: { type: String, required: true },
  timestamp: { type: Date, required: true },
  duration: { type: Number },
  heatmap: [HeatmapEventSchema]
}, { _id: false });

const GeolocationSchema: Schema = new Schema({
  country: { type: String },
  city: { type: String },
  latitude: { type: Number },
  longitude: { type: Number },
  vpn: { type: Boolean }
}, { _id: false });

const WebSessionSchema: Schema = new Schema({
  sessionId: { type: String, required: true, unique: true },
  userId: { type: String },
  ipAddress: { type: String },
  userAgent: { type: String },
  startTimestamp: { type: Date, required: true },
  endTimestamp: { type: Date },
  lastActive: { type: Date },
  geolocation: GeolocationSchema,
  pages: [PageSchema]
}, { timestamps: true });

// Index for better query performance
WebSessionSchema.index({ sessionId: 1 }, { unique: true });
WebSessionSchema.index({ userId: 1, startTimestamp: -1 });
WebSessionSchema.index({ startTimestamp: -1 });
WebSessionSchema.index({ ipAddress: 1 });

const WebSession: Model<IWebSession> = mongoose.models.WebSession || mongoose.model<IWebSession>("WebSession", WebSessionSchema);

export default WebSession;