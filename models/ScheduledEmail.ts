import mongoose, { Schema, Document } from 'mongoose';

export interface IScheduledEmail extends Document {
  recipients: { email: string; firstName?: string; name?: string }[];
  subject: string;
  body: string;
  greeting: string;
  templateId?: string;
  scheduledDate: Date;
  sent: boolean;
  sentAt?: Date;
}

const ScheduledEmailSchema: Schema = new Schema({
  recipients: [{ email: String, firstName: String, name: String }],
  subject: { type: String, required: true },
  body: { type: String, required: true },
  greeting: { type: String, required: true },
  templateId: { type: String },
  scheduledDate: { type: Date, required: true },
  sent: { type: Boolean, default: false },
  sentAt: { type: Date }
});

export default mongoose.models.ScheduledEmail ||
  mongoose.model<IScheduledEmail>('ScheduledEmail', ScheduledEmailSchema); 