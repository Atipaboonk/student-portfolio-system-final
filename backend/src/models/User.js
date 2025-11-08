import mongoose from "mongoose";

const UserSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true },
    passwordHash: { type: String, required: true },
    displayName: { type: String },
    role: {
      type: String,
      enum: ["STUDENT", "RECRUITER"],
      default: "STUDENT",
    },
    accountStatus: {
      type: String,
      enum: ["Pending", "Fail", "Success"],
      default: "Pending",
    },
    // ✅ เพิ่ม idCardUrl สำหรับแนบไฟล์ตอนสมัคร
    idCardUrl: { type: String },

    // ✅ Email verification by SuperAdmin
    isEmailVerified: { type: Boolean, default: false },

    resetPasswordToken: String,
    resetPasswordExpire: Date,
  },
  { timestamps: true }
);

export default mongoose.model("User", UserSchema);
