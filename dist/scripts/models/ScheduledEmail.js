"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var mongoose_1 = require("mongoose");
var ScheduledEmailSchema = new mongoose_1.Schema({
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
exports.default = mongoose_1.default.models.ScheduledEmail || mongoose_1.default.model('ScheduledEmail', ScheduledEmailSchema);
