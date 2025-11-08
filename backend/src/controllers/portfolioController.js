import Portfolio from "../models/Portfolio.js";

/**
 * POST /api/portfolios
 * Student สร้าง portfolio + upload 1-10 files
 */
export const createPortfolio = async (req, res) => {
  try {
    const { title, description, year, university, category } = req.body;

    if (!title || !year || !category) {
      return res
        .status(400)
        .json({ message: "title, year, category is required" });
    }

    // validate files
    if (!req.files || req.files.length === 0) {
      return res
        .status(400)
        .json({ message: "กรุณาอัปโหลดไฟล์อย่างน้อย 1 ไฟล์" });
    }
    if (req.files.length > 10) {
      return res
        .status(400)
        .json({ message: "อัปโหลดได้ไม่เกิน 10 ไฟล์" });
    }

    const filePaths = req.files.map((f) => `/uploads/${f.filename}`);

    const portfolio = await Portfolio.create({
      owner: req.user.id,
      title,
      description: description || "",
      year: Number(year),
      university: university || "KMUTT",
      category,
      files: filePaths,
      coverFileUrl: filePaths[0],
      visibility: "PRIVATE",
      state: "ADMIN_PENDING",
    });

    return res.status(201).json({ success: true, data: portfolio });
  } catch (err) {
    console.error("createPortfolio error:", err);
    return res.status(500).json({
      message: "Internal server error",
      error: err.message,
    });
  }
};

/**
 * GET /api/portfolios/me
 * Student ดู portfolio ของตัวเอง
 */
export const getMyPortfolios = async (req, res) => {
  try {
    const items = await Portfolio.find({ owner: req.user.id }).sort({
      createdAt: -1,
    });
    return res.json({ success: true, data: items });
  } catch (err) {
    console.error("getMyPortfolios error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};

/**
 * PATCH /api/portfolios/:id
 * แก้ไข portfolio ของตัวเอง (เฉพาะ state ที่อนุญาต)
 */
export const updatePortfolio = async (req, res) => {
  try {
    const { id } = req.params;
    const p = await Portfolio.findOne({ _id: id, owner: req.user.id });
    if (!p) return res.status(404).json({ message: "Not found" });

    if (!["DRAFT", "REJECTED", "ADMIN_PENDING"].includes(p.state)) {
      return res
        .status(400)
        .json({ message: "Cannot edit in this state" });
    }

    const { title, description, year, university, category } = req.body;

    if (title) p.title = title;
    if (description) p.description = description;
    if (year) p.year = Number(year);
    if (university) p.university = university;
    if (category) p.category = category;

    if (p.state === "REJECTED") {
      p.state = "ADMIN_PENDING";
      p.rejectComment = undefined;
    }

    await p.save();
    return res.json({ success: true, data: p });
  } catch (err) {
    console.error("updatePortfolio error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};

/**
 * PATCH /api/portfolios/:id/visibility
 * เปลี่ยนเป็น PUBLIC/PRIVATE (เฉพาะ APPROVED)
 */
export const updateVisibility = async (req, res) => {
  try {
    const { id } = req.params;
    const { isVisible } = req.body;

    const p = await Portfolio.findOne({ _id: id, owner: req.user.id });
    if (!p) return res.status(404).json({ message: "Not found" });

    if (p.state !== "APPROVED") {
      return res
        .status(400)
        .json({ message: "Can change visibility only when approved" });
    }

    p.visibility = isVisible ? "PUBLIC" : "PRIVATE";
    await p.save();

    return res.json({ success: true, data: p });
  } catch (err) {
    console.error("updateVisibility error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};

/**
 * GET /api/portfolios/public
 * หน้า “รวม portfolio” สำหรับ Recruiter / Public
 * แสดง: title, cover, studentName, university, year, category
 */
export const searchPublicPortfolios = async (req, res) => {
  try {
    const { keyword, year, category, university } = req.query;

    const filter = {
      state: "APPROVED",
      visibility: "PUBLIC",
    };

    if (year) filter.year = Number(year);
    if (category) filter.category = category;
    if (university) filter.university = university;

    let query = Portfolio.find(filter).populate("owner", "name university");

    if (keyword) {
      const regex = new RegExp(keyword, "i");
      query = query.find({
        $or: [{ title: regex }, { description: regex }],
      });
    }

    const items = await query.sort({ createdAt: -1 });

    const result = items.map((p) => ({
      id: p._id,
      title: p.title,
      description: p.description,
      year: p.year,
      category: p.category,
      university: p.university,
      studentName: p.owner?.name || "",
      coverFileUrl: p.coverFileUrl || (p.files?.[0] || null),
    }));

    return res.json({ success: true, data: result });
  } catch (err) {
    console.error("searchPublicPortfolios error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};
