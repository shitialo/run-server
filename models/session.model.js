"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const date_1 = require("../utills/date");
const sessionCSchema = new mongoose_1.default.Schema({
    userId: { type: mongoose_1.default.Schema.Types.ObjectId, ref: "User", index: true },
    userAgent: String,
    createdAt: { type: Date, required: true, default: Date.now },
    expiresAt: { type: Date, required: true, default: date_1.thirtyDaysFromNow },
});
const SessionModel = mongoose_1.default.model("Session", sessionCSchema);
exports.default = SessionModel;
