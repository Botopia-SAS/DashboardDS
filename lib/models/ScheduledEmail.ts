import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IScheduledEmail extends Document {
  recipients: string[];
  subject: string;
  body: string;
  scheduledDate: Date;
  sent: boolean;
  createdAt?: Date;
  updatedAt?: Date;
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
    index: true,
  },
  sent: {
    type: Boolean,
    default: false,
    index: true,
  },
}, { timestamps: true });

const ScheduledEmail: Model<IScheduledEmail> = mongoose.models.ScheduledEmail || mongoose.model<IScheduledEmail>('ScheduledEmail', ScheduledEmailSchema);

export default ScheduledEmail; 