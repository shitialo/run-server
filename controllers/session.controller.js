"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteUserSessionsHandler = exports.getUserSessionsHandler = void 0;
const zod_1 = require("zod");
const httpStatusCodes_1 = require("../constants/httpStatusCodes");
const catchAsyncError_1 = require("../middleware/catchAsyncError");
const session_model_1 = __importDefault(require("../models/session.model"));
const ErrorHandler_1 = __importDefault(require("../utills/ErrorHandler"));
exports.getUserSessionsHandler = (0, catchAsyncError_1.catchAsynchronousError)(async (req, res) => {
    const sessions = await session_model_1.default.find({
        userId: req.userId,
        expiresAt: { $gt: new Date() },
    }, { _id: 1, userAgent: 1, createdAt: 1 }, { sort: { createdAt: -1 } });
    return res.status(httpStatusCodes_1.OK).json(sessions.map((session) => ({
        ...session.toObject(),
        ...(session.id === req.sessionId && {
            isCurrent: true,
        }),
    })));
});
exports.deleteUserSessionsHandler = (0, catchAsyncError_1.catchAsynchronousError)(async (req, res) => {
    const sessionId = zod_1.z.string().parse(req.params.id);
    const deletedSession = await session_model_1.default.findOneAndDelete({
        _id: sessionId,
        userId: req.userId,
    });
    if (!deletedSession)
        throw new ErrorHandler_1.default("Session not found", httpStatusCodes_1.NOT_FOUND);
    return res.status(httpStatusCodes_1.OK).json({ success: true, message: "Session removed" });
});
