import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { requireRole } from "../middleware/requireRole.js";
import { upload } from "../middleware/upload.js";

// 📁 Controllers
import {
  createPortfolio,
  getMyPortfolios,
  updatePortfolio,
  updateVisibility,
  searchPublicPortfolios,
} from "../controllers/portfolioController.js";
import { reviewPortfolio } from "../controllers/adminReviewController.js";
import { verifyUserEmail } from "../controllers/adminController.js";

const router = Router();

/* ============================
   🔹 Public Portfolio Section
   ============================ */
router.get("/public", searchPublicPortfolios);

/* ============================
   🔹 Student Portfolio Section
   ============================ */
// create portfolio (Student uploads 1–10 files)
router.post(
  "/",
  requireAuth,
  requireRole("STUDENT"),
  upload.array("files", 10),
  createPortfolio
);

// view my portfolios
router.get("/me", requireAuth, requireRole("STUDENT"), getMyPortfolios);

// edit my portfolio
router.patch("/:id", requireAuth, requireRole("STUDENT"), updatePortfolio);

// change visibility (public/private)
router.patch(
  "/:id/visibility",
  requireAuth,
  requireRole("STUDENT"),
  updateVisibility
);

/* ============================
   🔹 Review Workflow Section
   ============================ */
// Approve / Reject portfolio (with comment)
router.patch(
  "/admin/portfolios/:id/review",
  requireAuth,
  requireRole(["ADVISOR_ADMIN", "SUPER_ADMIN"]),
  reviewPortfolio
);

/* ============================
   🔹 User Verification Section
   ============================ */
// Super Admin verifies Student/Recruiter account (email + status)
router.patch(
  "/verify-email/:id",
  requireAuth,
  requireRole("SUPER_ADMIN"),
  verifyUserEmail
);

export default router;
