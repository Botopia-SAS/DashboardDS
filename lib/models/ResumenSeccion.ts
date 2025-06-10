import mongoose, { Schema, Document } from 'mongoose';

interface IResumenEventoPagina {
  url: string;
  pageStart: Date;
  pageEnd: Date;
  duration: number;
  events: {
    scroll: number;
    click: number;
    move: number;
  };
}

interface IResumenSesion {
  sessionNumber: number;
  sessionId: string;
  userId: string;
  ip: string;
  browser: string;
  device: string;
  country: string;
  city: string;
  vpn: boolean;
  latitude: number;
  longitude: number;
  sessionStart: Date;
  sessionEnd: Date;
  sessionDuration: number;
  pages: IResumenEventoPagina[];
}

export interface IResumenSeccion extends Document {
  date: string;
  totalSessions: number;
  uniqueIPs: number;
  uniqueUsers: number;
  devices: Record<string, number>;
  browsers: Record<string, number>;
  countries: Record<string, number>;
  cities: Record<string, number>;
  sessionsByHour: Record<string, number>;
  totalClicks: number;
  totalScrolls: number;
  totalMoves: number;
  avgSessionDuration: number;
  sessions: IResumenSesion[];
}

const ResumenEventoPaginaSchema = new Schema<IResumenEventoPagina>({
  url: { type: String, required: true },
  pageStart: { type: Date, required: true },
  pageEnd: { type: Date, required: true },
  duration: { type: Number, required: true },
  events: {
    scroll: { type: Number, default: 0 },
    click: { type: Number, default: 0 },
    move: { type: Number, default: 0 }
  }
}, { _id: false });

const ResumenSesionSchema = new Schema<IResumenSesion>({
  sessionNumber: { type: Number, required: true },
  sessionId: { type: String, required: true },
  userId: { type: String, required: true },
  ip: { type: String, required: true },
  browser: { type: String, required: true },
  device: { type: String, required: true },
  country: { type: String, required: true },
  city: { type: String, required: true },
  vpn: { type: Boolean, required: true },
  latitude: { type: Number, required: true },
  longitude: { type: Number, required: true },
  sessionStart: { type: Date, required: true },
  sessionEnd: { type: Date, required: true },
  sessionDuration: { type: Number, required: true },
  pages: [ResumenEventoPaginaSchema]
}, { _id: false });

const ResumenSeccionSchema = new Schema<IResumenSeccion>({
  date: { type: String, required: true },
  totalSessions: { type: Number, required: true },
  uniqueIPs: { type: Number, required: true },
  uniqueUsers: { type: Number, required: true },
  devices: { type: Object, required: true },
  browsers: { type: Object, required: true },
  countries: { type: Object, required: true },
  cities: { type: Object, required: true },
  sessionsByHour: { type: Object, required: true },
  totalClicks: { type: Number, required: true },
  totalScrolls: { type: Number, required: true },
  totalMoves: { type: Number, required: true },
  avgSessionDuration: { type: Number, required: true },
  sessions: [ResumenSesionSchema]
});

export default mongoose.models.ResumenSeccion || mongoose.model<IResumenSeccion>('ResumenSeccion', ResumenSeccionSchema); 