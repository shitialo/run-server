"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.compareHashedValue = exports.hashValue = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const hashValue = async (value, saltRounds) => bcryptjs_1.default.hash(value, saltRounds || 12);
exports.hashValue = hashValue;
const compareHashedValue = async (value, hashedValue) => bcryptjs_1.default.compare(value, hashedValue).catch((error) => false);
exports.compareHashedValue = compareHashedValue;
