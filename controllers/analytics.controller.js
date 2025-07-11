"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getOrdersAnalytics = exports.getCoursesAnalytics = exports.getUsersAnalytics = void 0;
const catchAsyncError_1 = __importDefault(require("../middleware/catchAsyncError"));
const ErrorHandler_1 = __importDefault(require("../utills/ErrorHandler"));
const analytics_generator_1 = require("../utills/analytics.generator");
const user_model_1 = __importDefault(require("../models/user.model"));
const course_model_1 = __importDefault(require("../models/course.model"));
const order_model_1 = __importDefault(require("../models/order.model"));
const httpStatusCodes_1 = require("../constants/httpStatusCodes");
exports.getUsersAnalytics = (0, catchAsyncError_1.default)(async (req, res, next) => {
    try {
        const users = await (0, analytics_generator_1.generateLast12MonthData)(user_model_1.default);
        res.status(httpStatusCodes_1.OK).json({
            success: true,
            users,
        });
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, httpStatusCodes_1.INTERNAL_SERVER_ERROR));
    }
});
exports.getCoursesAnalytics = (0, catchAsyncError_1.default)(async (req, res, next) => {
    try {
        const courses = await (0, analytics_generator_1.generateLast12MonthData)(course_model_1.default);
        res.status(httpStatusCodes_1.OK).json({
            success: true,
            courses,
        });
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, httpStatusCodes_1.INTERNAL_SERVER_ERROR));
    }
});
exports.getOrdersAnalytics = (0, catchAsyncError_1.default)(async (req, res, next) => {
    try {
        const Orders = await (0, analytics_generator_1.generateLast12MonthData)(order_model_1.default);
        res.status(httpStatusCodes_1.OK).json({
            success: true,
            Orders,
        });
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, httpStatusCodes_1.INTERNAL_SERVER_ERROR));
    }
});
