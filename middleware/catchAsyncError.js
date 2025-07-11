"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.catchAsynchronousError = void 0;
const catchAsyncError = (theFunc) => (req, res, next) => {
    Promise.resolve(theFunc(req, res, next)).catch(next);
};
const catchAsynchronousError = (controller) => async (req, res, next) => {
    try {
        await controller(req, res, next);
    }
    catch (error) {
        next(error);
    }
};
exports.catchAsynchronousError = catchAsynchronousError;
exports.default = catchAsyncError;
