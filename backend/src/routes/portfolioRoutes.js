import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { requireRole } from "../middleware/requireRole.js";
import { upload } from "../middleware/upload.js";
import {
  createPortfolio,
  getMyPortfolios,
  updatePortfolio,
  updateVisibility,
  searchPublicPortfolios,
} from "../controllers/portfolioController.js";

const router = Router();

// public list/search
router.get("/public", searchPublicPortfolios);

// create portfolio (Student, upload 1-10 files)
router.post(
  "/",
  requireAuth,
  requireRole("STUDENT"),
  upload.array("files", 10),
  createPortfolio
);

// my portfolios
router.get(
  "/me",
  requireAuth,
  requireRole("STUDENT"),
  getMyPortfolios
);

// edit portfolio
router.patch(
  "/:id",
  requireAuth,
  requireRole("STUDENT"),
  updatePortfolio
);

// toggle visibility
router.patch(
  "/:id/visibility",
  requireAuth,
  requireRole("STUDENT"),
  updateVisibility
);

export default router;



