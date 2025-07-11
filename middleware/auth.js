"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authorizeRole = exports.isAuthenticated = void 0;
const catchAsyncError_1 = require("./catchAsyncError");
const ErrorHandler_1 = __importDefault(require("../utills/ErrorHandler"));
const httpStatusCodes_1 = require("../constants/httpStatusCodes");
const jwt_1 = require("../utills/jwt");
const user_model_1 = __importDefault(require("../models/user.model"));
exports.isAuthenticated = (0, catchAsyncError_1.catchAsynchronousError)(async (req, res, next) => {
    const accessToken = req.cookies.accessToken;
    if (accessToken === "" || accessToken === undefined) {
        throw new ErrorHandler_1.default("Please Login to access this resource", httpStatusCodes_1.UNAUTHORIZED);
    }
    const { error, payload } = (0, jwt_1.verifytoken)(accessToken);
    if (!payload)
        throw new ErrorHandler_1.default(error === "jwt expired" ? "Token expired" : "Invalid Token", httpStatusCodes_1.UNAUTHORIZED);
    const user = await user_model_1.default.findById(payload.userId);
    req.user = user;
    req.userId = payload.userId;
    req.sessionId = payload.sessionId;
    next();
});
const authorizeRole = (...roles) => {
    return async (req, res, next) => {
        if (!roles.includes(req?.user?.role) || roles === undefined) {
            return next(new ErrorHandler_1.default(`Role: ${req.user.role} is not allowed to access this resource`, 403));
        }
        next();
    };
};
exports.authorizeRole = authorizeRole;
