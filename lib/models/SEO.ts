import mongoose, { Schema, Document, Model } from "mongoose";

export interface ISEO extends Document {
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords?: string;
  metaImage?: string;
  slug?: string;
  entityType?: "DrivingClass" | "OnlineCourse" | "Location" | "DrivingLessons" | "General";
  entityId?: Schema.Types.ObjectId;
  robotsTxt?: string;
  sitemapUrl?: string;
  ogTitle?: string;
  ogImage?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

const SEOSchema: Schema = new Schema({
  // Campos principales de SEO
  metaTitle: { type: String },
  metaDescription: { type: String },
  metaKeywords: { type: String },
  metaImage: { type: String },
  slug: { type: String, unique: true, sparse: true },

  // Relación polimórfica - permite asociar SEO a diferentes entidades
  entityType: {
    type: String,
    enum: ["DrivingClass", "OnlineCourse", "Location", "DrivingLessons", "General"],
    default: "General"
  },
  entityId: { type: Schema.Types.ObjectId },

  // Campos legacy (para compatibilidad con SEO general)
  robotsTxt: { type: String, default: "User-agent: *\nAllow: /" },
  sitemapUrl: { type: String },
  ogTitle: { type: String },
  ogImage: { type: String },
}, { timestamps: true });

// Índice único para evitar duplicados de SEO por entidad
SEOSchema.index({ entityType: 1, entityId: 1 }, { unique: true, sparse: true });

const SEO: Model<ISEO> = mongoose.models.SEO || mongoose.model<ISEO>("SEO", SEOSchema);

export default SEO;
export { SEO };
