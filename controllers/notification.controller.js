"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateNotification = exports.getNotification = void 0;
const notification_model_1 = __importDefault(require("../models/notification.model"));
const catchAsyncError_1 = __importDefault(require("../middleware/catchAsyncError"));
const ErrorHandler_1 = __importDefault(require("../utills/ErrorHandler"));
const node_cron_1 = __importDefault(require("node-cron"));
const httpStatusCodes_1 = require("../constants/httpStatusCodes");
exports.getNotification = (0, catchAsyncError_1.default)(async (req, res, next) => {
    try {
        const notifications = await notification_model_1.default.find().sort({
            createdAt: -1,
        });
        res.status(httpStatusCodes_1.CREATED).json({
            success: true,
            notifications,
        });
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, httpStatusCodes_1.INTERNAL_SERVER_ERROR));
    }
});
exports.updateNotification = (0, catchAsyncError_1.default)(async (req, res, next) => {
    try {
        const notification = await notification_model_1.default.findById(req.params.id);
        if (!notification) {
            return next(new ErrorHandler_1.default("Notification not found", httpStatusCodes_1.NOT_FOUND));
        }
        notification.status = "read";
        await notification.save();
        const allNotification = await notification_model_1.default.find().sort({
            createdAt: -1,
        });
        res.status(httpStatusCodes_1.CREATED).json({
            success: true,
            allNotification,
        });
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, httpStatusCodes_1.INTERNAL_SERVER_ERROR));
    }
});
node_cron_1.default.schedule("0 0 0 * * *", async () => {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    await notification_model_1.default.deleteMany({
        status: "read",
        createdAt: { $lt: thirtyDaysAgo },
    });
    console.log("Deleted read notifications");
});
