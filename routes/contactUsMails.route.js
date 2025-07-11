"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const contactUsMails_controller_1 = require("../controllers/contactUsMails.controller");
const contactUsMailsRouter = express_1.default.Router();
contactUsMailsRouter.post("/contact-us", contactUsMails_controller_1.contactUshandler);
exports.default = contactUsMailsRouter;
