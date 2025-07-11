"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllcoursesService = exports.createCourse = void 0;
const course_model_1 = __importDefault(require("../models/course.model"));
const catchAsyncError_1 = __importDefault(require("../middleware/catchAsyncError"));
exports.createCourse = (0, catchAsyncError_1.default)(async (data, res) => {
    const course = await course_model_1.default.create(data);
    res.status(201).json({
        success: true,
        course,
    });
});
const getAllcoursesService = async (res, sortByDate) => {
    const courses = await course_model_1.default.find().sort({
        createdAt: sortByDate ? sortByDate : -1,
    });
    res.status(201).json({
        success: true,
        courses,
    });
};
exports.getAllcoursesService = getAllcoursesService;
