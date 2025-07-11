"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_controller_1 = require("../controllers/auth.controller");
const auth_1 = require("../middleware/auth");
const authRouter = express_1.default.Router();
authRouter.post("/register", auth_controller_1.registerUser);
authRouter.post("/login", auth_controller_1.loginHandler);
authRouter.get("/refresh", auth_controller_1.refreshTokenHandler);
authRouter.get("/email/verify/:code", auth_controller_1.verifyEmailHandler);
authRouter.post("/forgot-password", auth_controller_1.forgotPassword);
authRouter.get("/reset-password/:id/:token", auth_controller_1.resetPassword);
authRouter.post("/reset-password/:id/:token", auth_controller_1.postResetPassword);
authRouter.get("/logout", auth_controller_1.logoutHandler);
authRouter.post("/send-verification-email/:userId", auth_1.isAuthenticated, auth_controller_1.sendVerificationEmailHandler);
exports.default = authRouter;
