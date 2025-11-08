import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import User from "../models/User.js";
import PasswordResetToken from "../models/PasswordResetToken.js";

/**
 * REGISTER
 * Student/Recruiter สมัครด้วยการแนบไฟล์บัตร (idCard)
 * - Student: ใช้อีเมลมหาวิทยาลัย
 * - Recruiter: ใช้อีเมลองค์กร
 */
export const register = async (req, res) => {
  try {
    const { name, email, password, role, university, organization } = req.body;

    // ✅ อนุญาตสมัครเฉพาะ 2 role นี้
    if (!["STUDENT", "RECRUITER"].includes(role)) {
      return res
        .status(400)
        .json({ message: "Invalid role for self-registration" });
    }

    if (!name || !email || !password || !role) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // ✅ ตรวจซ้ำ email
    const exist = await User.findOne({ email });
    if (exist) {
      return res.status(409).json({ message: "Email already registered" });
    }

    // ✅ ตรวจรูปแบบอีเมล
    if (role === "STUDENT" && !email.endsWith("@kmutt.ac.th")) {
      return res
        .status(400)
        .json({ message: "Student must use KMUTT email" });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    // ✅ รับไฟล์บัตร
    const idCardUrl = req.file ? `/uploads/idcards/${req.file.filename}` : null;
    if (!idCardUrl) {
      return res.status(400).json({ message: "Please upload ID card file" });
    }

    // ✅ สร้าง user
    const user = await User.create({
      Firstame,
      Surname,
      Password,
      university,
      organization,
      idCardUrl,
      accountStatus: "Pending", // ต้องให้ SuperAdmin verify ก่อน
      isEmailVerified: false,
    });

    return res.status(201).json({
      id: user._id,
      email: user.email,
      role: user.role,
      accountStatus: user.accountStatus,
      idCardUrl: user.idCardUrl,
    });
  } catch (err) {
    console.error("register error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

/**
 * LOGIN
 */
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ message: "Missing fields" });

    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ message: "Invalid credentials" });

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return res.status(401).json({ message: "Invalid credentials" });

    // ✅ ต้องผ่านการ verify และ approve ก่อน
    if (user.accountStatus !== "APPROVED" || !user.isEmailVerified) {
      return res
        .status(403)
        .json({ message: "Account not verified or not approved yet" });
    }

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      token,
      role: user.role,
      name: user.name,
    });
  } catch (err) {
    console.error("login error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * LOGOUT (frontend แค่ลบ token)
 */
export const logout = async (_req, res) => {
  return res.json({ success: true });
};

/**
 * CHANGE PASSWORD
 */
export const changePassword = async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    if (!oldPassword || !newPassword)
      return res.status(400).json({ message: "Missing fields" });

    const user = await User.findById(req.user.id);
    const ok = await bcrypt.compare(oldPassword, user.passwordHash);
    if (!ok) return res.status(401).json({ message: "Invalid old password" });

    user.passwordHash = await bcrypt.hash(newPassword, 10);
    await user.save();

    res.json({ success: true });
  } catch (err) {
    console.error("changePassword error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * FORGOT PASSWORD
 */
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email)
      return res.status(400).json({ message: "Email is required" });

    const user = await User.findOne({ email });

    // ตอบ success เสมอเพื่อไม่ให้คนเดา email ได้
    if (!user || user.accountStatus !== "APPROVED") {
      return res.json({ success: true });
    }

    await PasswordResetToken.deleteMany({ userId: user._id });

    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 นาที

    await PasswordResetToken.create({ userId: user._id, token, expiresAt });

    console.log("Password reset token:", token);

    res.json({
      success: true,
      resetToken: token, // สำหรับเทสต์
    });
  } catch (err) {
    console.error("forgotPassword error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * RESET PASSWORD
 */
export const resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    if (!token || !newPassword)
      return res.status(400).json({ message: "Missing fields" });

    const record = await PasswordResetToken.findOne({ token });
    if (!record || record.expiresAt < new Date()) {
      return res
        .status(400)
        .json({ message: "Invalid or expired reset token" });
    }

    const user = await User.findById(record.userId);
    if (!user) {
      return res.status(400).json({ message: "Invalid token" });
    }

    user.passwordHash = await bcrypt.hash(newPassword, 10);
    await user.save();
    await PasswordResetToken.deleteMany({ userId: user._id });

    res.json({ success: true });
  } catch (err) {
    console.error("resetPassword error:", err);
    res.status(500).json({ message: "Server error" });
  }
};
