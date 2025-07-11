"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyEmail = exports.refreshUserAccessToken = exports.loginUser = exports.createUserAccount = void 0;
require("dotenv/config");
const httpStatusCodes_1 = require("../constants/httpStatusCodes");
const session_model_1 = __importDefault(require("../models/session.model"));
const user_model_1 = __importDefault(require("../models/user.model"));
const verificationCode_model_1 = __importDefault(require("../models/verificationCode.model"));
const date_1 = require("../utills/date");
const ErrorHandler_1 = __importDefault(require("../utills/ErrorHandler"));
const jwt_1 = require("../utills/jwt");
const sendMail_1 = __importDefault(require("../utills/sendMail"));
const createUserAccount = async (data) => {
    const { email, name, password, userAgent } = data;
    const isUserExist = await user_model_1.default.findOne({ email });
    if (isUserExist) {
        throw new ErrorHandler_1.default(`User with email ${email} is already exist`, httpStatusCodes_1.CONFLICT);
    }
    const user = await user_model_1.default.create({
        name,
        email,
        password,
    });
    const userId = user._id;
    const verificationCode = await verificationCode_model_1.default.create({
        userId,
        type: "email_verification",
        expiresAt: (0, date_1.thirtyDaysFromNow)(),
    });
    const url = `${process.env.ORIGIN}/email/verify/${verificationCode._id}`;
    const emailTemplateData = { url: url };
    try {
        await (0, sendMail_1.default)({
            email: user.email,
            subject: "Verify your email | Ciphemic Technologies",
            template: "verify-email.ejs",
            data: emailTemplateData,
        });
    }
    catch (error) {
        throw new ErrorHandler_1.default(error.message, httpStatusCodes_1.BAD_REQUEST);
    }
    const session = await session_model_1.default.create({
        userId,
        userAgent,
    });
    const refreshToken = (0, jwt_1.signtoken)({ sessionId: session._id }, jwt_1.refreshTokenSignOptions);
    const accessToken = (0, jwt_1.signtoken)({ userId, sessionId: session._id });
    return { user: user.omitPassword(), accessToken, refreshToken };
};
exports.createUserAccount = createUserAccount;
const loginUser = async ({ email, password, userAgent }) => {
    const user = await user_model_1.default.findOne({ email }).select("password");
    if (!user)
        throw new ErrorHandler_1.default(`Invalid email`, httpStatusCodes_1.UNAUTHORIZED);
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid)
        throw new ErrorHandler_1.default(`Invalid password`, httpStatusCodes_1.UNAUTHORIZED);
    const userId = user._id;
    const session = await session_model_1.default.create({ userId, userAgent });
    const sessionInfo = { sessionId: session._id };
    const refreshToken = (0, jwt_1.signtoken)(sessionInfo, jwt_1.refreshTokenSignOptions);
    const accessToken = (0, jwt_1.signtoken)({ ...sessionInfo, userId: user._id });
    return {
        user: user.omitPassword(),
        accessToken,
        refreshToken,
    };
};
exports.loginUser = loginUser;
const refreshUserAccessToken = async (refreshToken) => {
    const { payload } = (0, jwt_1.verifytoken)(refreshToken, {
        secret: jwt_1.refreshTokenSignOptions.secret,
    });
    if (!payload) {
        throw new ErrorHandler_1.default("Invalid refresh token", httpStatusCodes_1.UNAUTHORIZED);
    }
    const session = (await session_model_1.default.findById(payload.sessionId));
    const now = Date.now();
    if (!session || session.expiresAt.getTime() < now) {
        throw new ErrorHandler_1.default("Session expired", httpStatusCodes_1.UNAUTHORIZED);
    }
    const sessionNeedRefresh = session.expiresAt.getTime() - now <= date_1.ONE_DAY_IN_MS;
    if (sessionNeedRefresh) {
        session.expiresAt = (0, date_1.thirtyDaysFromNow)();
        await session.save();
    }
    const newRefreshToken = sessionNeedRefresh
        ? (0, jwt_1.signtoken)({ sessionId: session._id }, jwt_1.refreshTokenSignOptions)
        : undefined;
    const accessToken = (0, jwt_1.signtoken)({
        userId: session.userId,
        sessionId: session._id,
    });
    return {
        accessToken,
        newRefreshToken,
    };
};
exports.refreshUserAccessToken = refreshUserAccessToken;
const verifyEmail = async (code) => {
    const validCode = await verificationCode_model_1.default.findOne({
        _id: code,
        type: "email_verification",
        expiresAt: { $gt: new Date() },
    });
    if (!validCode) {
        throw new ErrorHandler_1.default("Invalid or expired verification code", httpStatusCodes_1.NOT_FOUND);
    }
    const updateUser = await user_model_1.default.findByIdAndUpdate(validCode.userId, { isVerified: true }, { new: true });
    if (!updateUser) {
        throw new ErrorHandler_1.default("Failed to verify email", httpStatusCodes_1.INTERNAL_SERVER_ERROR);
    }
    await validCode.deleteOne();
    if (updateUser.isVerified) {
        const data = { email: updateUser.email, name: updateUser.name };
        try {
            await (0, sendMail_1.default)({
                email: updateUser.email,
                subject: "Account verified successfully | Ciphemic Technologies",
                template: "welcome-mail.ejs",
                data,
            });
        }
        catch (error) {
            throw new ErrorHandler_1.default(error.message, httpStatusCodes_1.BAD_REQUEST);
        }
    }
    return {
        user: updateUser.omitPassword(),
    };
};
exports.verifyEmail = verifyEmail;
