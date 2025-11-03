import multer from "multer";
import fs from "fs";
import path from "path";

const uploadDir = "uploads/portfolio_v2";
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, Date.now() + "-" + file.originalname),
});

export const uploadPortfolioV2 = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // ≤10MB
}).fields([
  { name: "file", maxCount: 1 },
  { name: "images", maxCount: 8 },
]);
