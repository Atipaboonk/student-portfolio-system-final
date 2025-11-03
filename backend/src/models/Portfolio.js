// src/models/Portfolio.js
import mongoose from "mongoose";

const PortfolioSchema = new mongoose.Schema(
  {
    // ===== Sprint 1 (เดิม) =====
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    title: { type: String, required: true },
    desc: { type: String },
    fileUrl: { type: String },

    visibility: {
      type: String,
      enum: ["public", "private"],
      default: "private",
    },

    status: {
      type: String,
      enum: ["submitted", "approved", "rejected"],
      default: "submitted",
    },

    // ===== Sprint 2–4 (ต่อเติม, ไม่ทับของเดิม) =====
    images: { type: [String], default: [] },           // ต้องมี ≥1 ก่อน submit
    tags: { type: [String], default: [] },
    award: { type: String },
    awardYear: { type: Number },
    workDate: { type: Date },
    coverImageUrl: { type: String },

    // สถานะเวอร์ชันใหม่ (ใช้จริงใน Sprint 2–4)
    statusV2: {
      type: String,
      enum: ["Draft", "Pending", "InProcess", "Approved", "Rejected"],
      default: "Draft",
    },

    reviewComment: { type: String },                    // Sprint 3: เหตุผลจาก Reviewer
    reviewer: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    revision: { type: Number, default: 0 },             // นับรอบส่งใหม่
  },
  { timestamps: true }
);

// ===== Indexes (ต้องอยู่หลังจากประกาศ Schema) =====
PortfolioSchema.index({ visibility: 1, statusV2: 1, awardYear: 1, owner: 1 });
PortfolioSchema.index({ title: "text", desc: "text", tags: "text", award: "text" });

export default mongoose.model("Portfolio", PortfolioSchema);





