import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IScheduledEmail extends Document {
  recipients: string[];
  subject: string;
  body: string;
  scheduledDate: Date;
  sent: boolean;
  createdAt: Date;
}

const ScheduledEmailSchema: Schema = new Schema({
  recipients: {
    type: [String],
    required: true,
  },
  subject: {
    type: String,
    required: true,
  },
  body: {
    type: String,
    required: true,
  },
  scheduledDate: {
    type: Date,
    required: true,
  },
  sent: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export default (mongoose.models.ScheduledEmail as Model<IScheduledEmail>) || mongoose.model<IScheduledEmail>('ScheduledEmail', ScheduledEmailSchema); 