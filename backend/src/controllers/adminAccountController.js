import User from "../models/User.js";

// list accounts (ยกเว้น super/admin เอง)
export const listAccounts = async (_req, res) => {
  const users = await User.find({
    role: { $nin: ["SUPER_ADMIN", "ADVISOR_ADMIN"] }
  }).select("-passwordHash");

  res.json(users);
};

// approve / reject account
export const updateAccountStatus = async (req, res) => {
  const { id } = req.params;
  const { new_state } = req.body; // 'approve' | 'reject'

  const user = await User.findById(id);
  if (!user) return res.status(404).json({ message: "Not found" });

  if (new_state === "approve") {
    user.accountStatus = "APPROVED";
  } else if (new_state === "reject") {
    user.accountStatus = "REJECTED";
  } else {
    return res.status(400).json({ message: "Invalid new_state" });
  }

  await user.save();
  res.json({ success: true });
};
