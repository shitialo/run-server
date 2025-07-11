"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.postResetPassword = exports.resetPassword = exports.forgotPassword = exports.sendVerificationEmailHandler = exports.verifyEmailHandler = exports.refreshTokenHandler = exports.logoutHandler = exports.loginHandler = exports.registerUser = void 0;
require("dotenv").config();
const ErrorHandler_1 = __importDefault(require("../utills/ErrorHandler"));
const catchAsyncError_1 = require("../middleware/catchAsyncError");
const httpStatusCodes_1 = require("../constants/httpStatusCodes");
const zod_1 = require("zod");
const auth_service_1 = require("../services/auth.service");
const cookies_1 = require("../utills/cookies");
const jwt_1 = require("../utills/jwt");
const session_model_1 = __importDefault(require("../models/session.model"));
const sendMail_1 = __importDefault(require("../utills/sendMail"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const bcrypt_1 = require("../utills/bcrypt");
const catchAsyncError_2 = __importDefault(require("../middleware/catchAsyncError"));
const user_model_1 = __importDefault(require("../models/user.model"));
const verificationCode_model_1 = __importDefault(require("../models/verificationCode.model"));
const RegistrationBody = zod_1.z.object({
    name: zod_1.z.string(),
    email: zod_1.z.string().email().min(1).max(255),
    password: zod_1.z.string().min(8).max(255),
    avatar: zod_1.z.string().optional(),
    userAgent: zod_1.z.string().optional(),
});
exports.registerUser = (0, catchAsyncError_1.catchAsynchronousError)(async (req, res, next) => {
    const data = RegistrationBody.parse({
        ...req.body,
        userAgent: req.headers["user-agent"],
    });
    const { user, accessToken, refreshToken } = await (0, auth_service_1.createUserAccount)(data);
    return (0, cookies_1.setAuthCookies)({ res, accessToken, refreshToken })
        .status(httpStatusCodes_1.CREATED)
        .json({ success: true, user });
});
const LoginRequestSchema = zod_1.z.object({
    email: zod_1.z.string().email().min(1).max(255),
    password: zod_1.z.string().min(8).max(255),
    userAgent: zod_1.z.string().optional(),
});
exports.loginHandler = (0, catchAsyncError_1.catchAsynchronousError)(async (req, res, next) => {
    const data = LoginRequestSchema.parse({
        ...req.body,
        userAgent: req.headers["user-agent"],
    });
    const { accessToken, refreshToken, user } = await (0, auth_service_1.loginUser)(data);
    return (0, cookies_1.setAuthCookies)({ res, accessToken, refreshToken })
        .status(httpStatusCodes_1.OK)
        .json({ success: true, message: "Login Successfully" });
});
exports.logoutHandler = (0, catchAsyncError_1.catchAsynchronousError)(async (req, res) => {
    const accessToken = req.cookies.accessToken;
    const { payload } = (0, jwt_1.verifytoken)(accessToken || "");
    if (payload) {
        await session_model_1.default.findByIdAndDelete(payload.sessionId);
    }
    return (0, cookies_1.clearAuthCookies)(res)
        .status(httpStatusCodes_1.OK)
        .json({ success: true, message: "Logout Successfully" });
});
exports.refreshTokenHandler = (0, catchAsyncError_1.catchAsynchronousError)(async (req, res) => {
    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken) {
        throw new ErrorHandler_1.default("Missing refresh token", httpStatusCodes_1.UNAUTHORIZED);
    }
    const { accessToken, newRefreshToken } = await (0, auth_service_1.refreshUserAccessToken)(refreshToken);
    if (newRefreshToken)
        res.cookie("refreshToken", newRefreshToken, (0, cookies_1.getRefreshTokenCookieOptions)());
    return res
        .status(httpStatusCodes_1.OK)
        .cookie("accessToken", accessToken, (0, cookies_1.getAccessTokenCookieOptions)())
        .json({ success: true, message: "Access token refreshed" });
});
const VerificationIdSchema = zod_1.z.string().min(1).max(24);
exports.verifyEmailHandler = (0, catchAsyncError_1.catchAsynchronousError)(async (req, res) => {
    const verificationCode = VerificationIdSchema.parse(req.params.code);
    await (0, auth_service_1.verifyEmail)(verificationCode);
    return res
        .status(httpStatusCodes_1.OK)
        .json({ success: true, message: "Email verification successful" });
});
exports.sendVerificationEmailHandler = (0, catchAsyncError_1.catchAsynchronousError)(async (req, res) => {
    const userId = req.params.userId;
    const verificationCode = (await verificationCode_model_1.default.findOne({
        userId,
    }));
    const user = req.user;
    if (user.isVerified) {
        throw new ErrorHandler_1.default("Email is already verified", httpStatusCodes_1.BAD_REQUEST);
    }
    const url = `${process.env.ORIGIN}/email/verify/${verificationCode._id.toString()}`;
    const data = { url: url };
    try {
        await (0, sendMail_1.default)({
            email: user.email,
            subject: "Verify your email | Ciphemic Technologies",
            template: "verify-email.ejs",
            data,
        });
    }
    catch (error) {
        throw new ErrorHandler_1.default(error.message, httpStatusCodes_1.BAD_REQUEST);
    }
    return res
        .status(httpStatusCodes_1.OK)
        .json({ success: true, message: "Verification Code sent to email" });
});
exports.forgotPassword = (0, catchAsyncError_2.default)(async (req, res, next) => {
    const { email } = req.body;
    try {
        const user = (await user_model_1.default.findOne({ email }));
        if (!user) {
            console.log(`User not found`, httpStatusCodes_1.NOT_FOUND);
        }
        const secret = process.env.JWT_SECRET + user.password;
        const token = jsonwebtoken_1.default.sign({ email: user.email, id: user._id }, secret, {
            expiresIn: "5m",
        });
        const link = `${process.env.ORIGIN}/reset-password/${user._id}/${token}`;
        const data = { user: { name: user.name }, link: link };
        try {
            await (0, sendMail_1.default)({
                email: user.email,
                subject: "Reset your password",
                template: "forgot-password.ejs",
                data,
            });
            res.status(httpStatusCodes_1.CREATED).json({
                success: true,
                message: `Please check your email ${user.email} to reset your password.`,
            });
        }
        catch (error) {
            console.log(error.message, httpStatusCodes_1.BAD_REQUEST);
        }
        return res.status(httpStatusCodes_1.OK).json({
            success: true,
        });
    }
    catch (error) {
        console.log("Forgot Password Error:", error.message);
        return res.status(httpStatusCodes_1.OK).json({
            success: true,
        });
    }
});
exports.resetPassword = (0, catchAsyncError_2.default)(async (req, res, next) => {
    const { id, token } = req.params;
    try {
        const user = await user_model_1.default.findById({ _id: id });
        if (!user) {
            return next(new ErrorHandler_1.default(`Oops... Please check if link is either expired or wrong data.`, httpStatusCodes_1.BAD_REQUEST));
        }
        const secret = process.env.JWT_SECRET + user.password;
        const verify = jsonwebtoken_1.default.verify(token, secret);
        return res
            .status(httpStatusCodes_1.OK)
            .json({ success: true, email: verify.email, name: verify.name });
    }
    catch (error) {
        return next(new ErrorHandler_1.default(`Invalid or expired link!`, httpStatusCodes_1.FORBIDDEN));
    }
});
exports.postResetPassword = (0, catchAsyncError_2.default)(async (req, res, next) => {
    const { id, token } = req.params;
    const { password, confirmPassword } = req.body;
    if (password !== confirmPassword) {
        return next(new ErrorHandler_1.default("Please make sure both the fields have the same password", httpStatusCodes_1.BAD_REQUEST));
    }
    if (password.length < 8) {
        return next(new ErrorHandler_1.default("Password is too short, please write a password with atleast 8 characters.", httpStatusCodes_1.BAD_REQUEST));
    }
    try {
        const user = await user_model_1.default.findById({ _id: id });
        if (!user) {
            return next(new ErrorHandler_1.default(`User doesn't exist!`, httpStatusCodes_1.NOT_FOUND));
        }
        const secret = process.env.JWT_SECRET + user.password;
        const verify = jsonwebtoken_1.default.verify(token, secret);
        if (!verify) {
            return next(new ErrorHandler_1.default("Not authorized", httpStatusCodes_1.UNAUTHORIZED));
        }
        const hashPassword = await (0, bcrypt_1.hashValue)(password);
        await user_model_1.default.findByIdAndUpdate(id, { password: hashPassword });
        await user.save();
        res.status(httpStatusCodes_1.OK).json({
            success: true,
            message: "Password successfully changed.",
        });
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, httpStatusCodes_1.FORBIDDEN));
    }
});
