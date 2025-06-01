"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
console.log('INICIO SCRIPT sendScheduledEmails.ts');
var dbConnect_1 = require("../lib/dbConnect");
var ScheduledEmail_1 = require("../models/ScheduledEmail");
var sendEmail_1 = require("../lib/sendEmail"); // Debes tener esta función implementada
var templates_1 = require("../lib/email/templates");
require("dotenv/config");
function sendPendingEmails() {
    return __awaiter(this, void 0, void 0, function () {
        var now, allEmails, emails, _i, emails_1, email, name_1, html, err_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, (0, dbConnect_1.default)()];
                case 1:
                    _a.sent();
                    now = new Date();
                    console.log('Script ejecutado. Fecha actual (UTC):', now.toISOString());
                    return [4 /*yield*/, ScheduledEmail_1.default.find({})];
                case 2:
                    allEmails = _a.sent();
                    console.log('TODOS LOS CORREOS EN BD:');
                    allEmails.forEach(function (email) {
                        console.log({
                            id: email._id,
                            sent: email.sent,
                            scheduledDate: email.scheduledDate,
                            scheduledDateType: typeof email.scheduledDate,
                            scheduledDateISO: email.scheduledDate instanceof Date ? email.scheduledDate.toISOString() : email.scheduledDate
                        });
                    });
                    return [4 /*yield*/, ScheduledEmail_1.default.find({
                            sent: false,
                            scheduledDate: { $lte: now }
                        })];
                case 3:
                    emails = _a.sent();
                    console.log('Correos encontrados para enviar:', emails.length);
                    _i = 0, emails_1 = emails;
                    _a.label = 4;
                case 4:
                    if (!(_i < emails_1.length)) return [3 /*break*/, 10];
                    email = emails_1[_i];
                    _a.label = 5;
                case 5:
                    _a.trys.push([5, 8, , 9]);
                    name_1 = email.recipients[0] || "User";
                    html = (0, templates_1.getEmailTemplate)({ name: name_1, body: email.body });
                    return [4 /*yield*/, (0, sendEmail_1.default)(email.recipients, email.subject, email.body, html)];
                case 6:
                    _a.sent();
                    email.sent = true;
                    return [4 /*yield*/, email.save()];
                case 7:
                    _a.sent();
                    console.log("Correo enviado a: ".concat(email.recipients.join(', '), " - ").concat(email.subject));
                    return [3 /*break*/, 9];
                case 8:
                    err_1 = _a.sent();
                    console.error('Error enviando correo programado:', err_1);
                    return [3 /*break*/, 9];
                case 9:
                    _i++;
                    return [3 /*break*/, 4];
                case 10: return [2 /*return*/];
            }
        });
    });
}
sendPendingEmails().then(function () { return process.exit(); });
