"use strict";
var __importDefault =
  (this && this.__importDefault) ||
  function (mod) {
    return mod && mod.__esModule ? mod : { default: mod };
  };
Object.defineProperty(exports, "__esModule", { value: true });
exports.app = void 0;
require("dotenv").config();
const express_1 = __importDefault(require("express"));
exports.app = (0, express_1.default)();
const cors_1 = __importDefault(require("cors"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const error_1 = __importDefault(require("./middleware/error"));
const user_route_1 = __importDefault(require("./routes/user.route"));
const course_route_1 = __importDefault(require("./routes/course.route"));
const order_route_1 = __importDefault(require("./routes/order.route"));
const notification_route_1 = __importDefault(
  require("./routes/notification.route")
);
const analytics_route_1 = __importDefault(require("./routes/analytics.route"));
const layout_route_1 = __importDefault(require("./routes/layout.route"));
const auth_route_1 = __importDefault(require("./routes/auth.route"));
const sessions_route_1 = __importDefault(require("./routes/sessions.route"));
const contactUsMails_route_1 = __importDefault(
  require("./routes/contactUsMails.route")
);
const express_rate_limit_1 = require("express-rate-limit");
exports.app.use(express_1.default.urlencoded({ extended: false }));
const ORIGIN = process.env.ORIGIN;
exports.app.use(
  (0, cors_1.default)({ origin: `${ORIGIN}`, credentials: true })
);
exports.app.use(express_1.default.json({ limit: "20mb" }));
exports.app.use((0, cookie_parser_1.default)());
// const limiter = (0, express_rate_limit_1.rateLimit)({
//   windowMs: 15 * 60 * 1000,
//   limit: 120,
// });
exports.app.use(
  "/api/v1",
  auth_route_1.default,
  user_route_1.default,
  sessions_route_1.default,
  course_route_1.default,
  order_route_1.default,
  notification_route_1.default,
  analytics_route_1.default,
  layout_route_1.default,
  contactUsMails_route_1.default
);
// exports.app.use(limiter);
exports.app.use(error_1.default);
