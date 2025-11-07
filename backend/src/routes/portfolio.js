import express from "express";
import { auth, allowRoles, authOptional } from "../middleware/auth.js";
import Portfolio from "../models/Portfolio.js";

const router = express.Router();

/* === Sprint 1: Create basic portfolio (ใช้ description ให้ตรง schema) === */
router.post("/", auth, async (req, res) => {
  try {
    const { title, description, fileUrl, visibility } = req.body;

    const portfolio = await Portfolio.create({
      owner: req.user.id,
      title,
      description: description || "",
      yearOfProject: new Date().getFullYear(),
      category: "General",
      images: fileUrl ? [fileUrl] : [],
      visibility: visibility || "private",
      statusV2: "Draft",
    });

    return res
      .status(201)
      .json({ message: "Portfolio created", data: portfolio });
  } catch (err) {
    console.error("Create portfolio error:", err);
    return res.status(500).json({ message: "Server error" });
  }
});

/* My portfolio */
router.get("/mine", auth, async (req, res) => {
  try {
    const list = await Portfolio.find({ owner: req.user.id }).sort({
      createdAt: -1,
    });
    return res.json(list);
  } catch (err) {
    console.error("Get my portfolio error:", err);
    return res.status(500).json({ message: "Server error" });
  }
});

/* === Public gallery (Sprint 4) — Approved + public เท่านั้น === */
router.get("/public", async (req, res) => {
  try {
    const { q, tag, year, award, page = 1, limit = 12 } = req.query;

    const filter = {
      visibility: "public",
      statusV2: "Approved",
    };

    if (year) filter.awardYear = Number(year);

    if (tag) {
      const tags = String(tag)
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);
      if (tags.length) filter.tags = { $all: tags };
    }

    if (q) {
      const regex = new RegExp(String(q).trim(), "i");
      filter.$or = [
        { title: regex },
        { description: regex },
        { tags: regex },
        { award: regex },
      ];
    }

    if (award) {
      const r = new RegExp(String(award).trim(), "i");
      filter.award = r;
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [items, total] = await Promise.all([
      Portfolio.find(filter)
        .populate("owner", "displayName email role")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Portfolio.countDocuments(filter),
    ]);

    return res.json({
      page: Number(page),
      limit: Number(limit),
      total,
      items,
    });
  } catch (err) {
    console.error("public search error:", err);
    return res.status(500).json({ message: "Server error" });
  }
});

/* Public detail by id */
router.get("/:id/public", async (req, res) => {
  try {
    const p = await Portfolio.findOne({
      _id: req.params.id,
      visibility: "public",
      statusV2: "Approved",
    }).populate("owner", "displayName email role");

    if (!p) return res.status(404).json({ message: "Not found or not public" });
    return res.json(p);
  } catch (err) {
    console.error("get public by id error:", err);
    return res.status(500).json({ message: "Server error" });
  }
});

/* Toggle visibility (Approved only) */
router.put("/:id/visibility", auth, async (req, res) => {
  try {
    const { visibility } = req.body;

    if (!["public", "private"].includes(visibility)) {
      return res.status(400).json({ message: "Invalid visibility value" });
    }

    const portfolio = await Portfolio.findById(req.params.id);
    if (!portfolio) {
      return res.status(404).json({ message: "Portfolio not found" });
    }

    if (portfolio.owner.toString() !== req.user.id) {
      return res
        .status(403)
        .json({ message: "You cannot change this portfolio" });
    }

    if (portfolio.statusV2 !== "Approved") {
      return res.status(400).json({
        message: "Visibility can be changed only when portfolio is Approved",
      });
    }

    portfolio.visibility = visibility;
    await portfolio.save();

    return res.json({ message: "Visibility updated", data: portfolio });
  } catch (err) {
    console.error("Update visibility error:", err);
    return res.status(500).json({ message: "Server error" });
  }
});

/* Review pending (Admin) */
router.get(
  "/review/pending",
  auth,
  allowRoles("AdvisorAdmin", "SuperAdmin"),
  async (req, res) => {
    try {
      const list = await Portfolio.find({
        statusV2: "Pending",
      }).populate("owner", "displayName email");
      return res.json(list);
    } catch (err) {
      console.error("review/pending error:", err);
      return res.status(500).json({ message: "Server error" });
    }
  }
);

/* Helper */
function normalizeV2Status(p) {
  if (p.statusV2) return;
  p.statusV2 = "Pending";
}

/* Advisor approve → InProcess */
router.post(
  "/:id/review/approve",
  auth,
  allowRoles("AdvisorAdmin"),
  async (req, res) => {
    try {
      const p = await Portfolio.findById(req.params.id);
      if (!p) return res.status(404).json({ message: "Not found" });

      normalizeV2Status(p);

      if (p.statusV2 !== "Pending") {
        return res.status(400).json({ message: "Only Pending allowed" });
      }

      p.statusV2 = "InProcess";
      p.reviewer = req.user.id;
      p.reviewComment = req.body?.comment || "";
      await p.save();

      return res.json({ message: "Forwarded to SuperAdmin", portfolio: p });
    } catch (err) {
      console.error("review/approve error:", err);
      return res.status(500).json({ message: "Server error" });
    }
  }
);

/* Advisor reject */
router.post(
  "/:id/review/reject",
  auth,
  allowRoles("AdvisorAdmin"),
  async (req, res) => {
    try {
      const p = await Portfolio.findById(req.params.id);
      if (!p) return res.status(404).json({ message: "Not found" });

      normalizeV2Status(p);

      p.statusV2 = "Rejected";
      p.reviewer = req.user.id;
      p.reviewComment = req.body?.comment || "No comment";
      p.revision = (p.revision ?? 0) + 1;
      await p.save();

      return res.json({ message: "Rejected", portfolio: p });
    } catch (err) {
      console.error("review/reject error:", err);
      return res.status(500).json({ message: "Server error" });
    }
  }
);

/* SuperAdmin final approve */
router.post(
  "/:id/final/approve",
  auth,
  allowRoles("SuperAdmin"),
  async (req, res) => {
    try {
      const p = await Portfolio.findById(req.params.id);
      if (!p) return res.status(404).json({ message: "Not found" });

      normalizeV2Status(p);

      if (!["InProcess", "Pending"].includes(p.statusV2)) {
        return res
          .status(400)
          .json({ message: "Only InProcess/Pending can be approved" });
      }

      p.statusV2 = "Approved";
      p.reviewComment = req.body?.comment || "";
      await p.save();

      return res.json({ message: "Final Approved", portfolio: p });
    } catch (err) {
      console.error("final/approve error:", err);
      return res.status(500).json({ message: "Server error" });
    }
  }
);

/* SuperAdmin final reject */
router.post(
  "/:id/final/reject",
  auth,
  allowRoles("SuperAdmin"),
  async (req, res) => {
    try {
      const p = await Portfolio.findById(req.params.id);
      if (!p) return res.status(404).json({ message: "Not found" });

      normalizeV2Status(p);

      p.statusV2 = "Rejected";
      p.reviewComment = req.body?.comment || "";
      p.revision = (p.revision ?? 0) + 1;
      await p.save();

      return res.json({ message: "Final Rejected", portfolio: p });
    } catch (err) {
      console.error("final/reject error:", err);
      return res.status(500).json({ message: "Server error" });
    }
  }
);

/* Portfolio by user profile */
router.get("/user/:userId", authOptional, async (req, res) => {
  try {
    const { userId } = req.params;
    const { tag, year, award } = req.query;

    const filter = {
      owner: userId,
      statusV2: "Approved",
    };

    if (!req.user || req.user.id !== userId) {
      filter.visibility = "public";
    }

    if (year) filter.awardYear = Number(year);
    if (tag)
      filter.tags = {
        $all: String(tag)
          .split(",")
          .map((t) => t.trim()),
      };
    if (award)
      filter.award = new RegExp(String(award).trim(), "i");

    const items = await Portfolio.find(filter)
      .populate("owner", "displayName email role")
      .sort({ createdAt: -1 });

    return res.json(items);
  } catch (err) {
    console.error("filter by user error:", err);
    return res.status(500).json({ message: "Server error" });
  }
});

export default router;
