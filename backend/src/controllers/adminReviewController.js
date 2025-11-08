import Portfolio from "../models/Portfolio.js";

// PATCH /api/admin/portfolios/:id/review
export const reviewPortfolio = async (req, res) => {
  try {
    const { id } = req.params;
    const { action, comment } = req.body; // action = "approve" | "reject"

    const portfolio = await Portfolio.findById(id);
    if (!portfolio) {
      return res.status(404).json({ message: "Portfolio not found" });
    }

    // ตรวจสิทธิ์จาก role
    const role = req.user.role;

    if (role === "ADVISOR_ADMIN") {
      // รอบแรก: รีวิวงานที่อยู่ใน ADMIN_PENDING เท่านั้น
      if (portfolio.state !== "ADMIN_PENDING") {
        return res
          .status(400)
          .json({ message: "This portfolio is not in ADMIN_PENDING" });
      }

      if (action === "approve") {
        portfolio.state = "SUPER_PENDING";
        // ✅ ไม่แตะ rejectComment
      } else if (action === "reject") {
        portfolio.state = "REJECTED";
        portfolio.rejectComment = comment || "No comment provided";
      } else {
        return res.status(400).json({ message: "Invalid action" });
      }

    } else if (role === "SUPER_ADMIN") {
      // รอบสอง: รีวิวงานที่อยู่ใน SUPER_PENDING เท่านั้น
      if (portfolio.state !== "SUPER_PENDING") {
        return res
          .status(400)
          .json({ message: "This portfolio is not in SUPER_PENDING" });
      }

      if (action === "approve") {
        portfolio.state = "APPROVED";
        // ✅ ไม่แตะ rejectComment
      } else if (action === "reject") {
        portfolio.state = "REJECTED";
        portfolio.rejectComment = comment || "No comment provided";
      } else {
        return res.status(400).json({ message: "Invalid action" });
      }

    } else {
      return res.status(403).json({ message: "Forbidden" });
    }

    await portfolio.save();

    return res.json({
      success: true,
      data: {
        id: portfolio._id,
        state: portfolio.state,
        rejectComment: portfolio.rejectComment || null,
      },
    });
  } catch (err) {
    console.error("reviewPortfolio error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};
