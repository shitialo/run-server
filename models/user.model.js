"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv").config();
const mongoose_1 = __importDefault(require("mongoose"));
const bcrypt_1 = require("../utills/bcrypt");
const emailRegexPattern = /^([A-Za-z0-9!#$%&'*+-/=?^_`{|}~]){2,}@([A-Za-z0-9]){2,}[.]{1}([A-Za-z.]){2,6}$/;
const userSchema = new mongoose_1.default.Schema({
    name: {
        type: String,
        required: [true, "Please enter your name."],
    },
    email: {
        type: String,
        required: [true, "Please enter your email."],
        validate: {
            validator: function (value) {
                return emailRegexPattern.test(value);
            },
            message: "Please enter a valid email.",
        },
        unique: true,
    },
    password: {
        type: String,
        minlength: [8, "Password must be atleast 8 characters."],
        select: false,
    },
    avatar: {
        public_id: String,
        url: String,
    },
    role: {
        type: String,
        default: "user",
    },
    isVerified: {
        type: Boolean,
        default: false,
    },
    purchasedCourses: [
        {
            courseId: String,
        },
    ],
    uploadedCourses: [
        {
            type: String,
        },
    ],
}, { timestamps: true });
userSchema.pre("save", async function (next) {
    if (!this.isModified("password")) {
        return next();
    }
    this.password = await (0, bcrypt_1.hashValue)(this.password);
    return next();
});
userSchema.methods.comparePassword = async function (enteredPassword) {
    return (0, bcrypt_1.compareHashedValue)(enteredPassword, this.password);
};
userSchema.methods.omitPassword = function () {
    const user = this.toObject();
    delete user.password;
    return user;
};
const UserModel = mongoose_1.default.model("User", userSchema);
exports.default = UserModel;
