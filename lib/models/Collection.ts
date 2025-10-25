import mongoose, { Schema, Document, Model } from "mongoose";

export interface ICollection extends Document {
  title: string;
  description: string;
  image: string;
  price: number;
  createdAt?: Date;
  updatedAt?: Date;
}

const CollectionSchema: Schema = new Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  image: { type: String, required: true },
  price: { type: Number, required: true },
}, { timestamps: true });

const Collection: Model<ICollection> = mongoose.models.Collection || mongoose.model<ICollection>("Collection", CollectionSchema);

export default Collection;
