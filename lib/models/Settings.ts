import mongoose, { Schema, Document, Model } from "mongoose";

export interface ISettings extends Document {
  sendBirthdayEmails: boolean;
  sendClassReminders: boolean;
}

const SettingsSchema: Schema = new Schema({
  sendBirthdayEmails: { type: Boolean, default: true },
  sendClassReminders: { type: Boolean, default: true },
});

const Settings: Model<ISettings> = mongoose.models.Settings || mongoose.model<ISettings>("Settings", SettingsSchema);
export default Settings; 