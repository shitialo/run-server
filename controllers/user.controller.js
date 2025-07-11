"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteUser = exports.updateUserRole = exports.getAllUsers = exports.getAllAdminUsers = exports.updateProfilePicture = exports.updatePassword = exports.updateUserInfo = exports.getUserHandler = void 0;
require("dotenv").config();
const user_model_1 = __importDefault(require("../models/user.model"));
const ErrorHandler_1 = __importDefault(require("../utills/ErrorHandler"));
const catchAsyncError_1 = __importStar(require("../middleware/catchAsyncError"));
const user_service_1 = require("../services/user.service");
const cloudinary_1 = __importDefault(require("cloudinary"));
const httpStatusCodes_1 = require("../constants/httpStatusCodes");
exports.getUserHandler = (0, catchAsyncError_1.catchAsynchronousError)(async (req, res) => {
    const user = await user_model_1.default.findById(req.userId);
    if (!user)
        throw new ErrorHandler_1.default("User not found", httpStatusCodes_1.NOT_FOUND);
    return res.status(httpStatusCodes_1.OK).json({
        success: true,
        user: user.omitPassword(),
    });
});
exports.updateUserInfo = (0, catchAsyncError_1.default)(async (req, res, next) => {
    try {
        const { name } = req.body;
        const userId = req.user?._id;
        const user = await user_model_1.default.findById(userId);
        if (name === user?.name) {
            return next(new ErrorHandler_1.default("You haven't changed anything to update!", httpStatusCodes_1.BAD_REQUEST));
        }
        if (name && user) {
            user.name = name;
        }
        await user?.save();
        res.status(httpStatusCodes_1.CREATED).json({
            success: true,
            user,
        });
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, httpStatusCodes_1.BAD_REQUEST));
    }
});
exports.updatePassword = (0, catchAsyncError_1.default)(async (req, res, next) => {
    try {
        const { oldPassword, newPassword } = req.body;
        const userId = req.user?._id;
        const user = await user_model_1.default.findById(userId, "+password");
        if (!oldPassword || !newPassword) {
            return next(new ErrorHandler_1.default("Please enter old and new password", httpStatusCodes_1.BAD_REQUEST));
        }
        if (user?.password === undefined) {
            return next(new ErrorHandler_1.default("Invalid user", httpStatusCodes_1.BAD_REQUEST));
        }
        const isPasswordMatch = await user?.comparePassword(oldPassword);
        if (!isPasswordMatch) {
            return next(new ErrorHandler_1.default("Old password didn't match, please try again", httpStatusCodes_1.BAD_REQUEST));
        }
        user.password = newPassword;
        await user.save();
        res.status(httpStatusCodes_1.CREATED).json({
            success: true,
            user,
        });
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, httpStatusCodes_1.BAD_REQUEST));
    }
});
exports.updateProfilePicture = (0, catchAsyncError_1.default)(async (req, res, next) => {
    try {
        const { avatar } = req.body;
        const userId = req.user?._id;
        const user = await user_model_1.default.findById(userId);
        if (avatar && user) {
            if (user?.avatar?.public_id) {
                await cloudinary_1.default.v2.uploader.destroy(user?.avatar?.public_id);
                const myCloudUpload = await cloudinary_1.default.v2.uploader.upload(avatar, {
                    folder: "avatar",
                    width: 150,
                });
                user.avatar = {
                    public_id: myCloudUpload.public_id,
                    url: myCloudUpload.secure_url,
                };
            }
            else {
                const myCloudUpload = await cloudinary_1.default.v2.uploader.upload(avatar, {
                    folder: "avatar",
                    width: 150,
                });
                user.avatar = {
                    public_id: myCloudUpload.public_id,
                    url: myCloudUpload.secure_url,
                };
            }
        }
        await user?.save();
        res.status(httpStatusCodes_1.CREATED).json({
            success: true,
            user,
        });
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, httpStatusCodes_1.BAD_REQUEST));
    }
});
exports.getAllAdminUsers = (0, catchAsyncError_1.default)(async (req, res, next) => {
    const user = req?.user;
    if (user.role !== "admin") {
        return next(new ErrorHandler_1.default("Not allowed", httpStatusCodes_1.UNAUTHORIZED));
    }
    try {
        const users = await user_model_1.default.find().sort({ createdAt: -1 });
        res.status(httpStatusCodes_1.CREATED).json({
            success: true,
            users,
        });
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, httpStatusCodes_1.INTERNAL_SERVER_ERROR));
    }
});
exports.getAllUsers = (0, catchAsyncError_1.default)(async (req, res, next) => {
    try {
        (0, user_service_1.getAllUsersService)(res);
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, httpStatusCodes_1.INTERNAL_SERVER_ERROR));
    }
});
exports.updateUserRole = (0, catchAsyncError_1.default)(async (req, res, next) => {
    try {
        const { email, role } = req.body;
        const user = await user_model_1.default.findOne({ email });
        if (email !== user?.email) {
            return next(new ErrorHandler_1.default(`Sorry we couldn't found email address ${email}!`, httpStatusCodes_1.BAD_REQUEST));
        }
        const id = user?._id;
        (0, user_service_1.updateUserRoleService)(res, id, role);
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, httpStatusCodes_1.INTERNAL_SERVER_ERROR));
    }
});
exports.deleteUser = (0, catchAsyncError_1.default)(async (req, res, next) => {
    try {
        const { id } = req.params;
        const user = await user_model_1.default.findById(id);
        if (!user) {
            return next(new ErrorHandler_1.default("User not found", httpStatusCodes_1.NOT_FOUND));
        }
        await user.deleteOne({ id });
        res.status(httpStatusCodes_1.OK).json({
            success: true,
            message: "User deleted successfully",
        });
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, httpStatusCodes_1.INTERNAL_SERVER_ERROR));
    }
});
