import mongoose from "mongoose";

const SEOSchema = new mongoose.Schema({
  // Campos principales de SEO
  metaTitle: { type: String, required: false },
  metaDescription: { type: String, required: false },
  metaKeywords: { type: String, required: false },
  metaImage: { type: String, required: false },

  // Relación polimórfica - permite asociar SEO a diferentes entidades
  entityType: {
    type: String,
    enum: ["DrivingClass", "OnlineCourse", "Location", "DrivingLessons", "General"],
    default: "General"
  },
  entityId: { type: mongoose.Schema.Types.ObjectId, required: false }, // null para tipo "General"

  // Campos legacy (para compatibilidad con SEO general)
  robotsTxt: { type: String, default: "User-agent: *\nAllow: /" },
  sitemapUrl: { type: String, required: false },
  ogTitle: { type: String },
  ogImage: { type: String },
}, { timestamps: true });

// Índice único para evitar duplicados de SEO por entidad
SEOSchema.index({ entityType: 1, entityId: 1 }, { unique: true, sparse: true });

export const SEO = mongoose.models.SEO || mongoose.model("SEO", SEOSchema);
