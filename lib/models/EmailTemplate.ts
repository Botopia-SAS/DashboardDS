import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IEmailTemplate extends Document {
  name: string;
  type: 'student' | 'instructor';
  subject: string;
  body: string;
  createdAt?: Date;
  updatedAt?: Date;
}

const EmailTemplateSchema: Schema = new Schema({
  name: { type: String, required: true, unique: true },
  type: { type: String, enum: ['student', 'instructor'], required: true },
  subject: { type: String, required: true },
  body: { type: String, required: true },
}, { timestamps: true });

const EmailTemplate: Model<IEmailTemplate> = mongoose.models.EmailTemplate || mongoose.model<IEmailTemplate>('EmailTemplate', EmailTemplateSchema, 'gmailtemplates');

export default EmailTemplate; 