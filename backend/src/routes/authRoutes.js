import express from "express";
import {
  register,
  login,
  logout,
  forgotPassword,
  resetPassword,
  changePassword,
} from "../controllers/authController.js";
import { requireAuth } from "../middleware/auth.js";
import { uploadIdCard } from "../middleware/uploadIdCard.js";

const router = express.Router();

router.post("/register", uploadIdCard.single("idCard"), register);
router.post("/login", login);
router.post("/logout", logout);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);
router.post("/change-password", requireAuth, changePassword);

export default router;

