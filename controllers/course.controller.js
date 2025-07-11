"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteCourse = exports.getAdminUploadedCourse = exports.getAllCoursesAdmin = exports.addReplyToReview = exports.addReview = exports.addAnswer = exports.deleteQuestion = exports.editQuestion = exports.addQuestion = exports.getCourseByValidUser = exports.getAllCourses = exports.getSingleCourse = exports.editCourse = exports.uploadCourse = void 0;
const catchAsyncError_1 = __importDefault(require("../middleware/catchAsyncError"));
const ErrorHandler_1 = __importDefault(require("../utills/ErrorHandler"));
const cloudinary_1 = __importDefault(require("cloudinary"));
const course_service_1 = require("../services/course.service");
const course_model_1 = __importDefault(require("../models/course.model"));
const mongoose_1 = __importDefault(require("mongoose"));
const ejs_1 = __importDefault(require("ejs"));
const path_1 = __importDefault(require("path"));
const sendMail_1 = __importDefault(require("../utills/sendMail"));
const notification_model_1 = __importDefault(require("../models/notification.model"));
const user_model_1 = __importDefault(require("../models/user.model"));
const httpStatusCodes_1 = require("../constants/httpStatusCodes");
exports.uploadCourse = (0, catchAsyncError_1.default)(async (req, res, next) => {
    try {
        const user = await user_model_1.default.findById(req.user._id);
        const data = req.body;
        const thumbnail = data.thumbnail;
        data.uploaderInfo = {
            _id: req.user._id,
            name: req.user.name,
            email: req.user.email,
            avatar: req.user.avatar,
        };
        if (thumbnail) {
            const myClouds = await cloudinary_1.default.v2.uploader.upload(thumbnail, {
                folder: "courses",
            });
            data.thumbnail = {
                public_id: myClouds.public_id,
                url: myClouds.secure_url,
            };
        }
        const course = (await course_model_1.default.create(data));
        user?.uploadedCourses.push(course._id);
        user?.purchasedCourses.push(course._id);
        user?.save();
        res.status(httpStatusCodes_1.CREATED).json({
            success: true,
            course,
        });
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, httpStatusCodes_1.INTERNAL_SERVER_ERROR));
    }
});
exports.editCourse = (0, catchAsyncError_1.default)(async (req, res, next) => {
    try {
        const data = req.body;
        const thumbnail = data.thumbnail;
        const courseId = req.params.id;
        const courseData = (await course_model_1.default.findById(courseId));
        const adminEmail = req.user.email;
        if (!adminEmail) {
            return next(new ErrorHandler_1.default("First login with your admin account!", httpStatusCodes_1.FORBIDDEN));
        }
        if ((req.user.role === "admin" &&
            adminEmail !== courseData.uploaderInfo.email) ||
            req.user.role !== "super-admin") {
            return next(new ErrorHandler_1.default("You are trying to edit a course that is not yours!", httpStatusCodes_1.FORBIDDEN));
        }
        if (thumbnail && !thumbnail.startsWith("https")) {
            await cloudinary_1.default.v2.uploader.destroy(courseData.thumbnail.public_id);
            const myClouds = await cloudinary_1.default.v2.uploader.upload(thumbnail, {
                folder: "courses",
            });
            data.thumbnail = {
                public_id: myClouds.public_id,
                url: myClouds.secure_url,
            };
        }
        if (thumbnail.startsWith("https")) {
            data.thumbnail = {
                public_id: courseData?.thumbnail.public_id,
                url: courseData?.thumbnail.url,
            };
        }
        const course = await course_model_1.default.findByIdAndUpdate(courseId, { $set: data }, { new: true });
        res.status(httpStatusCodes_1.CREATED).json({
            success: true,
            course,
        });
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, httpStatusCodes_1.BAD_REQUEST));
    }
});
exports.getSingleCourse = (0, catchAsyncError_1.default)(async (req, res, next) => {
    try {
        const courseId = req.params.id;
        const course = await course_model_1.default.findById(courseId).select("-courseData.videoUrl -courseData.suggestion -courseData.questions -courseData.links");
        res.status(httpStatusCodes_1.OK).json({
            success: true,
            course,
        });
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, httpStatusCodes_1.BAD_REQUEST));
    }
});
exports.getAllCourses = (0, catchAsyncError_1.default)(async (req, res, next) => {
    try {
        const title = req.query.title || "";
        const catagory = req.query.catagory || "";
        const level = req.query.level || "";
        const courses = await course_model_1.default.find({
            name: { $regex: title, $options: "i" },
            level: { $regex: level, $options: "i" },
        }).select("-courseData.videoUrl -courseData.suggestion -courseData.questions -courseData.links");
        res.status(httpStatusCodes_1.OK).json({
            success: true,
            courses,
        });
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, httpStatusCodes_1.BAD_REQUEST));
    }
});
exports.getCourseByValidUser = (0, catchAsyncError_1.default)(async (req, res, next) => {
    try {
        const userCourseList = req.user?.purchasedCourses;
        const courseId = req.params.id;
        const isPurchaseCoursedByUser = userCourseList?.find((course) => course._id.toString() === courseId);
        if (!isPurchaseCoursedByUser) {
            return next(new ErrorHandler_1.default("You aren't eligible to access this course", httpStatusCodes_1.NOT_FOUND));
        }
        const course = await course_model_1.default.findById(courseId);
        const content = course?.courseData;
        res.status(httpStatusCodes_1.OK).json({
            success: true,
            course,
            content,
        });
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, httpStatusCodes_1.INTERNAL_SERVER_ERROR));
    }
});
exports.addQuestion = (0, catchAsyncError_1.default)(async (req, res, next) => {
    try {
        const { question, courseId, contentId } = req.body;
        const course = await course_model_1.default.findById(courseId);
        if (!mongoose_1.default.Types.ObjectId.isValid(contentId)) {
            return next(new ErrorHandler_1.default("invalid content ID", httpStatusCodes_1.BAD_REQUEST));
        }
        const courseContent = course?.courseData?.find((item) => item._id.toString() === contentId);
        if (!courseContent) {
            return next(new ErrorHandler_1.default("invalid content ID", httpStatusCodes_1.BAD_REQUEST));
        }
        const user = {
            name: req.user.name,
            email: req.user.email,
            avatar: req.user.avatar,
            isVerified: req.user.isVerified,
        };
        const newQuestion = {
            user,
            question,
            questionReplies: [],
        };
        courseContent.questions.push(newQuestion);
        await notification_model_1.default.create({
            user: req.user?._id,
            title: `New question from ${req.user.name}`,
            message: `You have a new question in ${courseContent.title}`,
        });
        await course?.save();
        res.status(httpStatusCodes_1.OK).json({
            success: true,
            course,
        });
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, httpStatusCodes_1.INTERNAL_SERVER_ERROR));
    }
});
exports.editQuestion = (0, catchAsyncError_1.default)(async (req, res, next) => {
    try {
        const { questionId, updatedQuestion, courseId, courseDataId } = req.body;
        const course = await course_model_1.default.findById(courseId);
        const { email } = req.user;
        if (!mongoose_1.default.Types.ObjectId.isValid(courseDataId)) {
            return next(new ErrorHandler_1.default("invalid content ID", httpStatusCodes_1.BAD_REQUEST));
        }
        const sameUser = course?.courseData?.find((item) => item.questions.find((data) => data.user.email === email));
        if (!sameUser) {
            return next(new ErrorHandler_1.default("Unauthorized access", httpStatusCodes_1.UNAUTHORIZED));
        }
        await course_model_1.default.updateOne({
            _id: courseId,
            "courseData._id": courseDataId,
        }, {
            $set: {
                "courseData.$[course].questions.$[singleQuestion].question": updatedQuestion,
            },
        }, {
            arrayFilters: [
                { "course._id": courseDataId },
                { "singleQuestion._id": questionId },
            ],
        });
        return res.status(httpStatusCodes_1.OK).json({
            success: true,
            course,
        });
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, httpStatusCodes_1.INTERNAL_SERVER_ERROR));
    }
});
exports.deleteQuestion = (0, catchAsyncError_1.default)(async (req, res, next) => {
    try {
        const { questionId, question, courseId, courseDataId } = req.body;
        const course = await course_model_1.default.findById(courseId);
        const { email } = req.user;
        if (!mongoose_1.default.Types.ObjectId.isValid(courseDataId)) {
            return next(new ErrorHandler_1.default("invalid content ID", httpStatusCodes_1.BAD_REQUEST));
        }
        const sameUser = course?.courseData?.find((item) => item.questions.find((data) => data.user.email === email));
        if (!sameUser) {
            return next(new ErrorHandler_1.default("Not Authorized", httpStatusCodes_1.UNAUTHORIZED));
        }
        await course_model_1.default.deleteOne({
            _id: courseId,
            "courseData._id": courseDataId,
        }, {
            $pull: {
                "courseData.$[course].questions.$[singleQuestion].question": question,
            },
        });
        return res.status(httpStatusCodes_1.OK).json({
            success: true,
            course,
        });
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, httpStatusCodes_1.INTERNAL_SERVER_ERROR));
    }
});
exports.addAnswer = (0, catchAsyncError_1.default)(async (req, res, next) => {
    try {
        const { answer, courseId, contentId, questionId } = req.body;
        const course = await course_model_1.default.findById(courseId);
        if (!mongoose_1.default.Types.ObjectId.isValid(contentId)) {
            return next(new ErrorHandler_1.default("invalid content ID", httpStatusCodes_1.BAD_REQUEST));
        }
        const courseContent = course?.courseData?.find((data) => data._id.toString() === contentId.toString());
        if (!courseContent) {
            return next(new ErrorHandler_1.default("Oh oh invalid content ID", httpStatusCodes_1.BAD_REQUEST));
        }
        const question = courseContent?.questions?.find((item) => item._id.toString() === questionId.toString());
        if (!question) {
            return next(new ErrorHandler_1.default("invalid question ID", httpStatusCodes_1.BAD_REQUEST));
        }
        const user = {
            name: req.user.name,
            email: req.user.email,
            avatar: req.user.avatar,
            isVerified: req.user.isVerified,
        };
        const newAnswer = {
            user,
            answer,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };
        await course_model_1.default.updateOne({
            _id: courseId,
            "courseData._id": contentId,
        }, {
            $push: {
                "courseData.$[course].questions.$[question].questionReplies": newAnswer,
            },
        }, {
            arrayFilters: [
                { "course._id": contentId },
                { "question._id": questionId },
            ],
        });
        const userId = req.user?._id;
        if (userId === question.user._id) {
            await notification_model_1.default.create({
                user: req.user._id,
                title: "New question reply received",
                message: `You have a new question reply in ${courseContent.title}`,
            });
        }
        else {
            const data = {
                name: question.user.name,
                title: courseContent.title,
            };
            const html = await ejs_1.default.renderFile(path_1.default.join(__dirname, "../mails/question-reply.ejs"), data);
            try {
                await (0, sendMail_1.default)({
                    email: question.user.email,
                    subject: "Question reply",
                    template: "question-reply.ejs",
                    data,
                });
            }
            catch (error) {
                return next(new ErrorHandler_1.default(error.message, httpStatusCodes_1.INTERNAL_SERVER_ERROR));
            }
        }
        res.status(httpStatusCodes_1.OK).json({
            success: true,
            course,
        });
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, httpStatusCodes_1.INTERNAL_SERVER_ERROR));
    }
});
exports.addReview = (0, catchAsyncError_1.default)(async (req, res, next) => {
    try {
        const userCourseList = req.user?.purchasedCourses;
        const courseId = req.params.id;
        const courseExist = userCourseList?.some((course) => course._id.toString() === courseId.toString());
        if (!courseExist) {
            return next(new ErrorHandler_1.default("You aren't eligible to access this course.", httpStatusCodes_1.NOT_FOUND));
        }
        const course = await course_model_1.default.findById(courseId);
        const isReviewed = course?.reviews?.some((review) => review?.user?.email === req?.user?.email);
        if (isReviewed) {
            return next(new ErrorHandler_1.default("You have already rated this course.", httpStatusCodes_1.NOT_FOUND));
        }
        const { review, rating } = req.body;
        const user = {
            _id: req.user._id,
            name: req.user.name,
            email: req.user.email,
            avatar: req.user.avatar,
            isVerified: req.user.isVerified,
        };
        const reviewData = {
            user,
            reviewComment: review,
            rating,
        };
        course?.reviews.push(reviewData);
        let avg = 0;
        course?.reviews.forEach((rev) => {
            avg += rev.rating;
        });
        if (course) {
            course.ratings = avg / course.reviews.length;
        }
        await course?.save();
        await notification_model_1.default.create({
            user,
            title: "New Review Recieved",
            message: `${req.user.name} has given a review in ${course?.name}`,
        });
        res.status(httpStatusCodes_1.OK).json({
            success: true,
            course,
        });
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, httpStatusCodes_1.INTERNAL_SERVER_ERROR));
    }
});
exports.addReplyToReview = (0, catchAsyncError_1.default)(async (req, res, next) => {
    try {
        const { comment, courseId, reviewId } = req.body;
        const course = await course_model_1.default.findById(courseId);
        if (!course) {
            return next(new ErrorHandler_1.default("Course not found", httpStatusCodes_1.BAD_REQUEST));
        }
        const review = course?.reviews?.find((rev) => rev._id.toString() === reviewId);
        if (!review) {
            return next(new ErrorHandler_1.default("Review not found", httpStatusCodes_1.BAD_REQUEST));
        }
        const user = {
            name: req.user.name,
            email: req.user.email,
            avatar: req.user.avatar,
            isVerified: req.user.isVerified,
        };
        const replyData = {
            user,
            comment,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };
        if (!review.reviewReplies) {
            return (review.reviewReplies = []);
        }
        review.reviewReplies?.push(replyData);
        await course.save();
        res.status(httpStatusCodes_1.OK).json({
            success: true,
            course,
        });
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, httpStatusCodes_1.INTERNAL_SERVER_ERROR));
    }
});
exports.getAllCoursesAdmin = (0, catchAsyncError_1.default)(async (req, res, next) => {
    try {
        (0, course_service_1.getAllcoursesService)(res);
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, httpStatusCodes_1.INTERNAL_SERVER_ERROR));
    }
});
exports.getAdminUploadedCourse = (0, catchAsyncError_1.default)(async (req, res, next) => {
    try {
        const adminCourses = await user_model_1.default.findById(req.user._id);
        const courses = await course_model_1.default.find({
            _id: { $in: adminCourses?.uploadedCourses },
        });
        res.status(httpStatusCodes_1.CREATED).json({
            success: true,
            courses,
        });
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, httpStatusCodes_1.INTERNAL_SERVER_ERROR));
    }
});
exports.deleteCourse = (0, catchAsyncError_1.default)(async (req, res, next) => {
    try {
        const { id } = req.params;
        const course = await course_model_1.default.findById(id);
        if (!course) {
            return next(new ErrorHandler_1.default("Course not found", httpStatusCodes_1.NOT_FOUND));
        }
        await user_model_1.default?.updateMany({ _id: req.user?._id }, {
            $pull: {
                uploadedCourses: id.toString(),
                purchasedCourses: { _id: id },
            },
        }, { multi: true });
        await course.deleteOne({ id });
        res.status(httpStatusCodes_1.OK).json({
            success: true,
            message: "Course deleted successfully",
            course,
        });
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, httpStatusCodes_1.INTERNAL_SERVER_ERROR));
    }
});
