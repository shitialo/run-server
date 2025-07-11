"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.cartPayments = exports.createCartOrder = exports.newPaymewnt = exports.sendStripePublishableKey = exports.getAllOrders = exports.createOrder = void 0;
require("dotenv").config();
const catchAsyncError_1 = __importDefault(require("../middleware/catchAsyncError"));
const ErrorHandler_1 = __importDefault(require("../utills/ErrorHandler"));
const user_model_1 = __importDefault(require("../models/user.model"));
const course_model_1 = __importDefault(require("../models/course.model"));
const path_1 = __importDefault(require("path"));
const ejs_1 = __importDefault(require("ejs"));
const sendMail_1 = __importDefault(require("../utills/sendMail"));
const notification_model_1 = __importDefault(require("../models/notification.model"));
const order_service_1 = require("../services/order.service");
const httpStatusCodes_1 = require("../constants/httpStatusCodes");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
exports.createOrder = (0, catchAsyncError_1.default)(async (req, res, next) => {
    try {
        const { courseId, payment_info } = req.body;
        if (payment_info) {
            if ("id" in payment_info) {
                const paymentIntentId = payment_info.id;
                const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
                if (paymentIntent.status !== "succeeded") {
                    return next(new ErrorHandler_1.default("Payment not authorized", httpStatusCodes_1.BAD_REQUEST));
                }
            }
        }
        const user = await user_model_1.default.findById(req.user?._id);
        const courseExistInUser = user?.purchasedCourses.some((course) => course._id.toString() === courseId);
        if (courseExistInUser) {
            return next(new ErrorHandler_1.default("You have already purchased this course", httpStatusCodes_1.BAD_REQUEST));
        }
        const course = (await course_model_1.default.findById(courseId));
        if (!course) {
            return next(new ErrorHandler_1.default("Course not found", httpStatusCodes_1.NOT_FOUND));
        }
        const data = {
            courseId: course._id,
            userId: user?._id,
            payment_info,
        };
        const mailData = {
            order: {
                _id: `...${course._id
                    .toString()
                    .slice(18, Number(course._id.toString().length))}`,
                name: course.name,
                price: course.price,
                date: new Date().toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                }),
            },
        };
        const html = await ejs_1.default.renderFile(path_1.default.join(__dirname, "../mails/order-confirmation.ejs"), { order: mailData });
        try {
            if (user) {
                await (0, sendMail_1.default)({
                    email: user.email,
                    subject: "Order Confirmation",
                    template: "order-confirmation.ejs",
                    data: mailData,
                });
            }
        }
        catch (error) {
            return next(new ErrorHandler_1.default(error.message, httpStatusCodes_1.BAD_REQUEST));
        }
        user?.purchasedCourses.push(course._id);
        await user?.save();
        await notification_model_1.default.create({
            user: user?._id,
            title: "New Order",
            message: `You have a new order from ${course.name}`,
        });
        course.purchased += 1;
        await course.save();
        (0, order_service_1.newOrder)(data, res, next);
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, httpStatusCodes_1.INTERNAL_SERVER_ERROR));
    }
});
exports.getAllOrders = (0, catchAsyncError_1.default)(async (req, res, next) => {
    try {
        (0, order_service_1.getAllOrdersService)(res);
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, httpStatusCodes_1.INTERNAL_SERVER_ERROR));
    }
});
exports.sendStripePublishableKey = (0, catchAsyncError_1.default)(async (req, res, next) => {
    try {
        res.status(httpStatusCodes_1.OK).json({
            publishableKey: process.env.STRIPE_PUBLISHABLE_KEY,
        });
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, httpStatusCodes_1.INTERNAL_SERVER_ERROR));
    }
});
exports.newPaymewnt = (0, catchAsyncError_1.default)(async (req, res, next) => {
    let { courseId, amount } = req.body;
    if (amount) {
        try {
            const course = await course_model_1.default.findById(courseId);
            const isAmountCorrect = Number(amount) === Number(course?.price);
            const myPayment = await stripe.paymentIntents.create({
                amount: Math.round(amount * 100),
                currency: "INR",
                metadata: {
                    company: "Ciphemic Technologies",
                },
                automatic_payment_methods: {
                    enabled: true,
                },
            });
            if (isAmountCorrect) {
                res.status(httpStatusCodes_1.CREATED).json({
                    success: true,
                    client_secret: myPayment.client_secret,
                });
            }
            else {
                return next(new ErrorHandler_1.default("Something went wrong", httpStatusCodes_1.INTERNAL_SERVER_ERROR));
            }
        }
        catch (error) {
            return next(new ErrorHandler_1.default(error.message, httpStatusCodes_1.INTERNAL_SERVER_ERROR));
        }
    }
});
exports.createCartOrder = (0, catchAsyncError_1.default)(async (req, res, next) => {
    try {
        const { courseId, payment_info } = req.body;
        if (payment_info) {
            if ("id" in payment_info) {
                const paymentSessionId = payment_info.id;
                const paymentSession = await stripe.checkout.sessions.retrieve(paymentSessionId);
                if (paymentSession.status !== "succeeded") {
                    return next(new ErrorHandler_1.default("Payment not authorized", httpStatusCodes_1.BAD_REQUEST));
                }
            }
        }
        const user = await user_model_1.default.findById(req.user?._id);
        const courseExistInUser = user?.purchasedCourses.some((course) => course._id.toString() === courseId);
        if (courseExistInUser) {
            return next(new ErrorHandler_1.default("You have already purchased this course", httpStatusCodes_1.BAD_REQUEST));
        }
        const course = (await course_model_1.default.findById(courseId));
        if (!course) {
            return next(new ErrorHandler_1.default("Course not found", httpStatusCodes_1.NOT_FOUND));
        }
        const data = {
            courseId: course._id,
            userId: user?._id,
            payment_info,
        };
        const mailData = {
            order: {
                _id: `...${course._id
                    .toString()
                    .slice(18, Number(course._id.toString().length))}`,
                name: course.name,
                price: course.price,
                date: new Date().toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                }),
            },
        };
        const html = await ejs_1.default.renderFile(path_1.default.join(__dirname, "../mails/order-confirmation.ejs"), { order: mailData });
        try {
            if (user) {
                await (0, sendMail_1.default)({
                    email: user.email,
                    subject: "Order Confirmation",
                    template: "order-confirmation.ejs",
                    data: mailData,
                });
            }
        }
        catch (error) {
            return next(new ErrorHandler_1.default(error.message, httpStatusCodes_1.BAD_REQUEST));
        }
        user?.purchasedCourses.push(course._id);
        await user?.save();
        await notification_model_1.default.create({
            user: user?._id,
            title: "New Order",
            message: `You have a new order from ${course.name}`,
        });
        course.purchased += 1;
        await course.save();
        (0, order_service_1.newOrder)(data, res, next);
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, httpStatusCodes_1.INTERNAL_SERVER_ERROR));
    }
});
exports.cartPayments = (0, catchAsyncError_1.default)(async (req, res, next) => {
    const { courses } = req.body;
    try {
        const session = await stripe.checkout.sessions.create({
            mode: "payment",
            payment_method_types: ["card"],
            line_items: courses.map((course) => ({
                price_data: {
                    currency: "INR",
                    product_data: {
                        name: course.name,
                    },
                    unit_amount: Math.round(course.price * 100),
                },
                quantity: 1,
            })),
            metadata: {
                company: "Ciphemic Technologies",
            },
            success_url: `${process.env.BASE_URL}/success`,
            cancel_url: `${process.env.BASE_URL}/cancel`,
        });
        res.status(httpStatusCodes_1.CREATED).json({
            success: true,
            url: session,
        });
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, httpStatusCodes_1.INTERNAL_SERVER_ERROR));
    }
});
