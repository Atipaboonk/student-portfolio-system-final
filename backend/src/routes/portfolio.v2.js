// src/routes/portfolio.v2.js
import express from "express";
import { auth } from "../middleware/auth.js";
import Portfolio from "../models/Portfolio.js";     // รุ่นที่มีฟิลด์ v2
import { uploadPortfolioV2 } from "../middleware/upload.v2.js";

const router = express.Router();

/* ------------------------------------------------------------------ */
/* Sprint 2: Create Draft (อัปโหลดรูป >= 1)                           */
/* ------------------------------------------------------------------ */
// form-data:
//  - title (text, required)
//  - desc (text, optional)
//  - tags (text, เช่น "AI,Design", optional)
//  - images (file, >=1)
//  - award, awardYear, workDate (optional)
router.post("/v2", auth, uploadPortfolioV2, async (req, res) => {
  try {
    const { title, desc, tags, award, awardYear, workDate } = req.body;
    if (!title) return res.status(400).json({ message: "title required" });

    const imgFiles = req.files?.images || [];
    if (imgFiles.length < 1) {
      return res.status(400).json({ message: "At least 1 image required" });
    }

    const images = imgFiles.map(f => f.path);
    const tagsArr = (tags || "")
      .split(",")
      .map(t => t.trim())
      .filter(Boolean);

    const portfolio = await Portfolio.create({
      owner: req.user.id,
      title,
      desc: desc || "",
      tags: tagsArr,
      award: award || "",
      awardYear: awardYear || null,
      workDate: workDate || null,
      images,
      coverImageUrl: images[0],
      statusV2: "Draft",
    });

    return res.json({ message: "Draft saved", data: portfolio });
  } catch (err) {
    console.error("Create draft v2 error:", err);
    return res.status(500).json({ message: "Server error" });
  }
});

/* ------------------------------------------------------------------ */
/* Sprint 3: Submit Draft -> Pending (ไม่มี body)                      */
/* ------------------------------------------------------------------ */
router.post("/:id/v2/submit", auth, async (req, res) => {
  try {
    const p = await Portfolio.findById(req.params.id);
    if (!p) return res.status(404).json({ message: "Portfolio not found" });

    // อนุญาตเฉพาะเจ้าของ
    if (p.owner.toString() !== req.user.id) {
      return res.status(403).json({ message: "not yours" });
    }

    // อนุญาตเฉพาะ Draft/Rejected
    if (!["Draft", "Rejected"].includes(p.statusV2)) {
      return res.status(400).json({ message: "Only Draft/Rejected allowed" });
    }

    // กันพัง: ถ้า images undefined ให้ถือว่า []
    const imgCount = Array.isArray(p.images) ? p.images.length : 0;
    if (imgCount < 1) {
      return res.status(400).json({
        message: "At least 1 image is required before submit",
      });
    }

    // ถ้าเคยโดน Rejected มาก่อน นับ revision
    if (p.statusV2 === "Rejected") p.revision = (p.revision || 0) + 1;

    p.statusV2 = "Pending";
    p.reviewComment = ""; // ล้างคอมเมนต์เดิม
    await p.save();

    return res.json({ message: "Portfolio submitted for review", data: p });
  } catch (err) {
    console.error("Submit v2 error:", err);
    return res.status(500).json({ message: "Server error" });
  }
});

export default router;   // <— อยู่ท้ายไฟล์ครั้งเดียวเท่านั้น

