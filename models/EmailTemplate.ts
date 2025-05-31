import mongoose, { Schema, Document } from 'mongoose';

export interface IEmailTemplate extends Document {
  name: string;
  type: 'student' | 'instructor';
  subject: string;
  body: string;
}

const EmailTemplateSchema: Schema = new Schema({
  name: { type: String, required: true },
  type: { type: String, enum: ['student', 'instructor'], required: true },
  subject: { type: String, required: true },
  body: { type: String, required: true },
});

export default mongoose.models.EmailTemplate || mongoose.model<IEmailTemplate>('EmailTemplate', EmailTemplateSchema, 'gmailtemplates'); 