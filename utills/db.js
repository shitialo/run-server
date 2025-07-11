"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
require("dotenv").config();
const mongoDBUrl = process.env.MONGODB_URI || "";
const connectDB = async () => {
    try {
        await mongoose_1.default
            .connect(mongoDBUrl)
            .then((data) => console.log(`Database connected with ${data.connection.host}`));
    }
    catch (error) {
        console.log(error);
    }
};
exports.default = connectDB;
