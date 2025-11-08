import Portfolio from "../models/Portfolio.js";

// Advisor: list pending
export const listAdminPending = async (_req, res) => {
  const items = await Portfolio.find({ state: "ADMIN_PENDING" }).populate(
    "owner",
    "name"
  );
  res.json(
    items.map((p) => ({
      id: p._id,
      student_name: p.owner.name,
      status: "PENDING"
    }))
  );
};

// Super: list pending
export const listSuperPending = async (_req, res) => {
  const items = await Portfolio.find({ state: "SUPER_PENDING" }).populate(
    "owner",
    "name"
  );
  res.json(
    items.map((p) => ({
      id: p._id,
      student_name: p.owner.name,
      status: "PENDING"
    }))
  );
};

// Detail for review
export const getReviewDetail = async (req, res) => {
  const { id } = req.params;
  const role = req.user.role;

  const baseFilter = { _id: id };
  if (role === "ADVISOR_ADMIN") baseFilter.state = "ADMIN_PENDING";
  if (role === "SUPER_ADMIN") baseFilter.state = "SUPER_PENDING";

  const p = await Portfolio.findOne(baseFilter).populate(
    "owner",
    "name university"
  );
  if (!p) return res.status(404).json({ message: "Not found" });

  res.json({
    id: p._id,
    title: p.title,
    university: p.university,
    year: p.year,
    category: p.category,
    description: p.description,
    fileUrl: p.fileUrl,
    photo: p.photo,
    ownerName: p.owner.name
  });
};

// Approve / Reject
export const reviewPortfolio = async (req, res) => {
  const { id } = req.params;
  const { action, comment } = req.body;
  const role = req.user.role;

  const p = await Portfolio.findById(id);
  if (!p) return res.status(404).json({ message: "Not found" });

  if (role === "ADVISOR_ADMIN") {
    if (p.state !== "ADMIN_PENDING") {
      return res.status(400).json({ message: "Invalid state" });
    }
    if (action === "approve") p.state = "SUPER_PENDING";
    else if (action === "reject") {
      p.state = "REJECTED";
      p.rejectComment = comment || "";
    } else {
      return res.status(400).json({ message: "Invalid action" });
    }
  } else if (role === "SUPER_ADMIN") {
    if (p.state !== "SUPER_PENDING") {
      return res.status(400).json({ message: "Invalid state" });
    }
    if (action === "approve") {
      p.state = "APPROVED";
    } else if (action === "reject") {
      p.state = "REJECTED";
      p.rejectComment = comment || "";
    } else {
      return res.status(400).json({ message: "Invalid action" });
    }
  } else {
    return res.status(403).json({ message: "Forbidden" });
  }

  await p.save();
  res.json({ success: true });
};
