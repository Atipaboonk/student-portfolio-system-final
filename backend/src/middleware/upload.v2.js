import multer from "multer";
import path from "path";
import fs from "fs";

const UPLOAD_DIR = path.join(process.cwd(), "uploads", "portfolio_v2");

if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  console.log("📁 Created upload directory:", UPLOAD_DIR);
}

const fileFilter = (req, file, cb) => {
  const allowed = ["image/png", "image/jpeg", "image/jpg", "image/webp"];
  if (allowed.includes(file.mimetype)) return cb(null, true);
  cb(new Error("Only image files (png, jpg, jpeg, webp) are allowed"));
};

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname || "");
    const base = path
      .basename(file.originalname || "image", ext)
      .replace(/\s+/g, "_");
    cb(null, `${Date.now()}-${base}${ext}`);
  },
});

const uploader = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 },
});

export const uploadPortfolioV2 = uploader.fields([
  { name: "images", maxCount: 10 },
]);
