"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifytoken = exports.signtoken = exports.refreshTokenSignOptions = exports.accessTokenSignOptions = void 0;
require("dotenv").config();
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const JWT_ACCESS_TOKEN = process.env.ACCESS_TOKEN;
const JWT_REFRESH_TOKEN = process.env.REFRESH_TOKEN;
exports.accessTokenSignOptions = {
    expiresIn: "20m",
    secret: JWT_ACCESS_TOKEN,
};
exports.refreshTokenSignOptions = {
    expiresIn: "30d",
    secret: JWT_REFRESH_TOKEN,
};
const signtoken = (payload, Options) => {
    const { secret, ...signOptions } = Options || exports.accessTokenSignOptions;
    return jsonwebtoken_1.default.sign(payload, secret, signOptions);
};
exports.signtoken = signtoken;
const verifytoken = (token, options) => {
    const { secret = JWT_ACCESS_TOKEN, ...verifyOpts } = options || {};
    try {
        const payload = jsonwebtoken_1.default.verify(token, secret, { ...verifyOpts });
        return { payload };
    }
    catch (error) {
        return {
            error: error.message,
        };
    }
};
exports.verifytoken = verifytoken;
