"use strict";
var __importDefault =
  (this && this.__importDefault) ||
  function (mod) {
    return mod && mod.__esModule ? mod : { default: mod };
  };
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const user_controller_1 = require("../controllers/user.controller");
const auth_1 = require("../middleware/auth");
const userRouter = express_1.default.Router();
userRouter.get(
  "/user",
  auth_1.isAuthenticated,
  user_controller_1.getUserHandler
);
userRouter.put(
  "/update-user-info",
  auth_1.isAuthenticated,
  user_controller_1.updateUserInfo
);
userRouter.put(
  "/update-user-password",
  auth_1.isAuthenticated,
  user_controller_1.updatePassword
);
userRouter.put(
  "/update-user-avatar",
  auth_1.isAuthenticated,
  user_controller_1.updateProfilePicture
);
userRouter.get(
  "/get-admin-users",
  auth_1.isAuthenticated,
  (0, auth_1.authorizeRole)("admin"),
  user_controller_1.getAllAdminUsers
);
userRouter.get(
  "/get-all-users",
  auth_1.isAuthenticated,
  (0, auth_1.authorizeRole)("super-admin"),
  user_controller_1.getAllUsers
);
userRouter.put(
  "/update-user-role",
  auth_1.isAuthenticated,
  (0, auth_1.authorizeRole)("super-admin"),
  user_controller_1.updateUserRole
);
userRouter.delete(
  "/delete-user/:id",
  auth_1.isAuthenticated,
  (0, auth_1.authorizeRole)("super-admin"),
  user_controller_1.deleteUser
);
exports.default = userRouter;
