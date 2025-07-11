"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const session_controller_1 = require("../controllers/session.controller");
const auth_1 = require("../middleware/auth");
const sessionsRouter = express_1.default.Router();
sessionsRouter.get("/user-sessions", auth_1.isAuthenticated, session_controller_1.getUserSessionsHandler);
sessionsRouter.delete("/delete-user-sessions/:id", auth_1.isAuthenticated, session_controller_1.deleteUserSessionsHandler);
exports.default = sessionsRouter;
