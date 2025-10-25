import mongoose, { Schema, Document, Model } from "mongoose";

export interface ILocation extends Document {
  title: string;
  description?: string;
  zone: string;
  locationImage?: string;
  instructors: Schema.Types.ObjectId[];
  createdAt?: Date;
  updatedAt?: Date;
}

const LocationSchema: Schema = new Schema({
  title: {
    type: String,
    required: true,
    unique: true,
  },
  description: {
    type: String,
  },
  zone: {
    type: String,
    required: true,
  },
  locationImage: {
    type: String,
  },
  instructors: [
    {
      type: Schema.Types.ObjectId,
      ref: "Instructor",
    },
  ],
}, { timestamps: true });

const Location: Model<ILocation> = mongoose.models.Location || mongoose.model<ILocation>("Location", LocationSchema);

export default Location;