import mongoose, { Schema, Document } from 'mongoose';

interface IHeatmapEvent {
  eventType: 'click' | 'move' | 'scroll';
  x: number;
  y: number;
  timestamp: Date;
  elementId?: string;
  elementClass?: string;
  elementTag?: string;
}

interface IPageVisit {
  url: string;
  referrer?: string;
  timestamp: Date;
  duration: number;
  heatmap?: IHeatmapEvent[];
}

export interface ISession extends Document {
  sessionId: string;
  userId: string;
  ipAddress: string;
  userAgent: string;
  startTimestamp: Date;
  endTimestamp?: Date;
  sessionActive: boolean;
  lastActive?: Date;
  pages: IPageVisit[];
  geolocation?: {
    country: string;
    city: string;
    latitude: number;
    longitude: number;
    vpn?: boolean;
  };
}

const HeatmapEventSchema = new Schema<IHeatmapEvent>({
  eventType: { type: String, enum: ['click', 'move', 'scroll'], required: true },
  x: { type: Number, required: true },
  y: { type: Number, required: true },
  timestamp: { type: Date, required: true },
  elementId: String,
  elementClass: String,
  elementTag: String,
}, { _id: false });

const PageVisitSchema = new Schema<IPageVisit>({
  url: { type: String, required: true },
  referrer: String,
  timestamp: { type: Date, required: true },
  duration: { type: Number, default: 0 },
  heatmap: { type: [HeatmapEventSchema], default: [] },
});

const SessionSchema = new Schema<ISession>({
  sessionId: { type: String, required: true, unique: true },
  userId: { type: String, required: true },
  ipAddress: { type: String },
  userAgent: { type: String },
  startTimestamp: { type: Date, required: true },
  endTimestamp: { type: Date },
  sessionActive: { type: Boolean, default: true },
  lastActive: { type: Date },
  pages: [PageVisitSchema],
  geolocation: {
    country: String,
    city: String,
    latitude: Number,
    longitude: Number,
    vpn: Boolean
  }
});

export default mongoose.models.Session || mongoose.model<ISession>('Session', SessionSchema); 