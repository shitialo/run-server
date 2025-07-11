"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const faqSchema = new mongoose_1.Schema({
    question: String,
    answer: String,
});
const catagorySchema = new mongoose_1.Schema({
    title: String,
    url: {
        type: String,
        required: true,
    },
}, { _id: false });
const bannerImageSchema = new mongoose_1.Schema({
    public_id: String,
    url: String,
});
const layoutSchema = new mongoose_1.Schema({
    type: String,
    faq: [faqSchema],
    catagories: [catagorySchema],
    banner: {
        image: bannerImageSchema,
        title: String,
        subTitle: String,
    },
}, { timestamps: true });
const LayoutModel = (0, mongoose_1.model)("Layout", layoutSchema);
exports.default = LayoutModel;
