"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getlayoutByType = exports.editLayout = exports.createLayout = void 0;
const catchAsyncError_1 = __importDefault(require("../middleware/catchAsyncError"));
const ErrorHandler_1 = __importDefault(require("../utills/ErrorHandler"));
const layout_model_1 = __importDefault(require("../models/layout.model"));
const cloudinary_1 = __importDefault(require("cloudinary"));
const httpStatusCodes_1 = require("../constants/httpStatusCodes");
exports.createLayout = (0, catchAsyncError_1.default)(async (req, res, next) => {
    try {
        const { type } = req.body;
        const isTypeexist = await layout_model_1.default.findOne({ type });
        if (isTypeexist) {
            return next(new ErrorHandler_1.default(`${type} is already exist.`, httpStatusCodes_1.BAD_REQUEST));
        }
        if (type === "Banner") {
            const { title, subTitle, image } = req.body;
            const myCloud = await cloudinary_1.default.v2.uploader.upload(image, {
                folder: "layout",
            });
            const banner = {
                type: "Banner",
                banner: {
                    image: {
                        public_id: myCloud.public_id,
                        url: myCloud.secure_url,
                    },
                    title,
                    subTitle,
                },
            };
            return await layout_model_1.default.create(banner);
        }
        if (type === "FAQ") {
            const { faq } = req.body;
            const faqItems = await Promise.all(faq.map(async (item) => {
                return { question: item.question, answer: item.answer };
            }));
            await layout_model_1.default.create({ type: "FAQ", faq: faqItems });
        }
        if (type === "Catagories") {
            const { catagories } = req.body;
            const CatagoriesItems = await Promise.all(catagories.map(async (item) => {
                return { title: item.title, url: item.url.toLowerCase() };
            }));
            await layout_model_1.default.create({
                type: "Catagories",
                catagories: CatagoriesItems,
            });
        }
        res.status(httpStatusCodes_1.OK).json({
            success: true,
            message: "Layout created successfully.",
        });
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, httpStatusCodes_1.INTERNAL_SERVER_ERROR));
    }
});
exports.editLayout = (0, catchAsyncError_1.default)(async (req, res, next) => {
    try {
        const { type } = req.body;
        if (type === "Banner") {
            const bannerData = await layout_model_1.default.findOne({ type: "Banner" });
            const { title, subTitle, image } = req.body;
            const data = image.startsWith("https")
                ? bannerData
                : await cloudinary_1.default.v2.uploader.upload(image, {
                    folder: "layout",
                });
            const banner = {
                type: "Banner",
                image: {
                    public_id: image.startsWith("https")
                        ? bannerData.banner.image.public_id
                        : data?.public_id,
                    url: image.startsWith("https")
                        ? bannerData.banner.image.url
                        : data?.secure_url,
                },
                title,
                subTitle,
            };
            await layout_model_1.default.findByIdAndUpdate(bannerData._id, { banner });
        }
        if (type === "FAQ") {
            const { faq } = req.body;
            const faqType = await layout_model_1.default.findOne({ type: "FAQ" });
            const faqItems = await Promise.all(faq.map(async (item) => {
                return { question: item.question, answer: item.answer };
            }));
            await layout_model_1.default.findByIdAndUpdate(faqType?._id, {
                type: "FAQ",
                faq: faqItems,
            });
        }
        if (type === "Catagories") {
            const { catagories } = req.body;
            const validCatagories = catagories.map((catagory) => {
                return { title: catagory.title, url: catagory.url };
            });
            const { title, url } = validCatagories;
            if (title === "" || url === "") {
                throw new ErrorHandler_1.default("Fields can't be empty.", httpStatusCodes_1.BAD_REQUEST);
            }
            const catagoriesType = await layout_model_1.default.findOne({
                type: "Catagories",
            });
            const CatagoriesItems = await Promise.all(catagories.map(async (item) => {
                return { title: item.title, url: item.url.toLowerCase() };
            }));
            await layout_model_1.default.findByIdAndUpdate(catagoriesType?._id, {
                type: "Catagories",
                catagories: CatagoriesItems,
            });
        }
        res.status(httpStatusCodes_1.OK).json({
            success: true,
            message: "Layout updated successfully.",
        });
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, httpStatusCodes_1.INTERNAL_SERVER_ERROR));
    }
});
exports.getlayoutByType = (0, catchAsyncError_1.default)(async (req, res, next) => {
    try {
        const { type } = req.params;
        const layout = await layout_model_1.default.findOne({ type });
        res.status(httpStatusCodes_1.CREATED).json({
            success: true,
            layout,
        });
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, httpStatusCodes_1.INTERNAL_SERVER_ERROR));
    }
});
