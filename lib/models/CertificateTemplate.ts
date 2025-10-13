import mongoose from "mongoose";

// Interface for text elements in the certificate
interface TextElement {
  id: string;
  content: string; // Can include variables like {{studentName}}, {{certn}}, etc.
  x: number; // Position X
  y: number; // Position Y
  fontSize: number;
  fontFamily: string;
  fontWeight?: 'normal' | 'bold';
  color: string; // Hex color
  align?: 'left' | 'center' | 'right';
  italic?: boolean;
  underline?: boolean;
}

// Interface for image elements in the certificate
interface ImageElement {
  id: string;
  url: string; // URL or path to the image
  x: number;
  y: number;
  width: number;
  height: number;
  grayscale?: boolean; // Grayscale filter option
}

// Interface for shape elements (rectangles, lines, etc.)
interface ShapeElement {
  id: string;
  type: 'rectangle' | 'line' | 'circle';
  x: number;
  y: number;
  width?: number;
  height?: number;
  x2?: number; // For lines
  y2?: number; // For lines
  radius?: number; // For circles
  color?: string;
  borderColor?: string;
  borderWidth?: number;
}

// Main schema for Certificate Templates
const CertificateTemplateSchema = new mongoose.Schema({
  // Name of the template
  name: {
    type: String,
    required: true,
    trim: true,
  },

  // Class type this template belongs to (DATE, BDI, ADI, etc.)
  classType: {
    type: String,
    required: true,
    uppercase: true,
    index: true,
  },

  // Page dimensions
  pageSize: {
    width: { type: Number, default: 842 }, // A4 landscape width in points
    height: { type: Number, default: 595 }, // A4 landscape height in points
    orientation: { type: String, enum: ['portrait', 'landscape'], default: 'landscape' }
  },

  // Background image or color
  background: {
    type: { type: String, enum: ['color', 'image', 'pdf'], default: 'color' },
    value: { type: String }, // Hex color or image URL or PDF path
  },

  // Text elements
  textElements: [{
    id: String,
    content: String,
    x: Number,
    y: Number,
    fontSize: Number,
    fontFamily: String,
    fontWeight: { type: String, enum: ['normal', 'bold'], default: 'normal' },
    color: String,
    align: { type: String, enum: ['left', 'center', 'right'], default: 'left' },
    italic: { type: Boolean, default: false },
    underline: { type: Boolean, default: false },
  }],

  // Image elements
  imageElements: [{
    id: String,
    url: String,
    x: Number,
    y: Number,
    width: Number,
    height: Number,
    grayscale: { type: Boolean, default: false },
  }],

  // Shape elements (borders, lines, etc.)
  shapeElements: [{
    id: String,
    type: { type: String, enum: ['rectangle', 'line', 'circle'] },
    x: Number,
    y: Number,
    width: Number,
    height: Number,
    x2: Number,
    y2: Number,
    radius: Number,
    color: String,
    borderColor: String,
    borderWidth: Number,
  }],

  // Available variables that can be used in this template
  availableVariables: [{
    key: String, // e.g., "studentName"
    label: String, // e.g., "Student Name"
    example: String, // e.g., "JOHN DOE"
  }],

  // Is this the default template for this class type?
  isDefault: {
    type: Boolean,
    default: false,
  },

  // Is this template active?
  isActive: {
    type: Boolean,
    default: true,
  },

  // Created by
  createdBy: {
    type: String,
  },

  // Timestamps
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// Index for quick lookups
CertificateTemplateSchema.index({ classType: 1, isDefault: 1 });
CertificateTemplateSchema.index({ classType: 1, isActive: 1 });

// Middleware to update updatedAt
CertificateTemplateSchema.pre('findOneAndUpdate', function() {
  this.set({ updatedAt: new Date() });
});

// Middleware to ensure only one default template per class type
CertificateTemplateSchema.pre('save', async function(next) {
  if (this.isDefault) {
    // Set all other templates of this class type to not default
    await mongoose.model('CertificateTemplate').updateMany(
      { classType: this.classType, _id: { $ne: this._id } },
      { $set: { isDefault: false } }
    );
  }
  next();
});

const CertificateTemplate = mongoose.models.CertificateTemplate ||
  mongoose.model("CertificateTemplate", CertificateTemplateSchema);

export default CertificateTemplate;
export type { TextElement, ImageElement, ShapeElement };
