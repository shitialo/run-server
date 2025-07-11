"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.contactUshandler = void 0;
require("dotenv/config");
const catchAsyncError_1 = require("../middleware/catchAsyncError");
const sendMail_1 = __importDefault(require("../utills/sendMail"));
const ErrorHandler_1 = __importDefault(require("../utills/ErrorHandler"));
const httpStatusCodes_1 = require("../constants/httpStatusCodes");
exports.contactUshandler = (0, catchAsyncError_1.catchAsynchronousError)(async (req, res) => {
    const { name, email, subject, message, anyText } = req.body;
    try {
        const data = { name, email, subject, message };
        await (0, sendMail_1.default)({
            email: process.env.SMTP_MAIL || "sugamakv@gmail.com",
            subject,
            template: "contactUs-mail.ejs",
            data,
        });
    }
    catch (error) {
        throw new ErrorHandler_1.default(error.message, httpStatusCodes_1.BAD_REQUEST);
    }
    return res.status(httpStatusCodes_1.OK).json({ message: "Email sent" });
});
