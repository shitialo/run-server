"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const ErrorHandler_1 = __importDefault(require("../utills/ErrorHandler"));
const zod_1 = require("zod");
const httpStatusCodes_1 = require("../constants/httpStatusCodes");
const cookies_1 = require("../utills/cookies");
const handleZodError = (res, error) => {
    const errors = error.issues.map((err) => ({
        path: err.path.join("."),
        message: err.message,
    }));
    return res.status(httpStatusCodes_1.BAD_REQUEST).json({
        success: false,
        message: error,
        errors,
    });
};
const ErrorMiddleware = (error, req, res, next) => {
    console.log(`PATH: ${req.path}`, error.message);
    if (req.path == cookies_1.REFRESH_PATH) {
        (0, cookies_1.clearAuthCookies)(res);
    }
    if (error instanceof zod_1.z.ZodError) {
        return handleZodError(res, error);
    }
    error.statusCode = error.statusCode || httpStatusCodes_1.INTERNAL_SERVER_ERROR;
    error.message = error.message || "Internal server error";
    if (error.name === "CastError") {
        const message = `Resource not found. Invalid: ${error.path}`;
        error = new ErrorHandler_1.default(message, httpStatusCodes_1.BAD_REQUEST);
    }
    if (error.code === 11000) {
        const message = `Duplicate ${Object.keys(error.keyValue)} entered`;
        error = new ErrorHandler_1.default(message, httpStatusCodes_1.BAD_REQUEST);
    }
    if (error.name === "JsonWebTokenError") {
        const message = "Json web token is invalid";
        error = new ErrorHandler_1.default(message, httpStatusCodes_1.UNAUTHORIZED);
    }
    if (error.name === "TokenExpiredError") {
        const message = "Web token is expired please try again";
        error = new ErrorHandler_1.default(message, httpStatusCodes_1.UNAUTHORIZED);
    }
    res.status(error.statusCode).json({
        success: false,
        message: error.message,
    });
};
exports.default = ErrorMiddleware;
