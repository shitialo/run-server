"use strict";
var __importDefault =
  (this && this.__importDefault) ||
  function (mod) {
    return mod && mod.__esModule ? mod : { default: mod };
  };
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv").config();
const app_1 = require("./app");
const http_1 = __importDefault(require("http"));
const db_1 = __importDefault(require("./utills/db"));
const cloudinary_1 = require("cloudinary");
const socketServer_1 = require("./socketServer");
const httpStatusCodes_1 = require("./constants/httpStatusCodes");
const server = http_1.default.createServer(app_1.app);
cloudinary_1.v2.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_SECRET_KEY,
});
app_1.app.get("/api/test", (req, res) => {
  return res.status(httpStatusCodes_1.OK).json({ message: "Test Success" });
});
app_1.app.all("*", (req, res, next) => {
  const err = new Error(`Route ${req.originalUrl} not found`);
  err.statusCode = 404;
  next(err);
});
(0, socketServer_1.initSocketServer)(server);
let PORT = process.env.PORT || 8000;
server.listen(PORT, async () => {
  console.log(`Server is running on port ${PORT}`);
  await (0, db_1.default)();
});
