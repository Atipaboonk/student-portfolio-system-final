import mongoose from "mongoose";

const PortfolioSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    title: { type: String, required: true },
    description: { type: String, default: "" },

    year: {
      type: Number,
      required: true,
      enum: [2020, 2021, 2022, 2023, 2024, 2025],
    },

    university: { type: String, default: "KMUTT" },

    category: {
      type: String,
      required: true,
      enum: [
        "AI",
        "ML",
        "BI",
        "QA",
        "UX/UI",
        "Database",
        "Software Engineering",
        "IOT",
        "Gaming",
        "Web Development",
        "Coding",
        "Data Science",
        "Hackathon",
        "Bigdata",
        "Data Analytics",
      ],
    },

    // ไฟล์ทั้งหมดที่อัปโหลด (1-10)
    files: [String],

    // ใช้ไฟล์แรกเป็น cover/thumbnail เวลาแสดงหน้ารวม
    coverFileUrl: String,

    visibility: {
      type: String,
      enum: ["PUBLIC", "PRIVATE"],
      default: "PRIVATE",
    },

    status: {
      type: String,
      enum: ["Draft", "Pending", "In Process", "Approve", "Rejected"],
      default: "Pending",
    },

    rejectComment: String,
  },
  { timestamps: true }
);

export default mongoose.model("Portfolio", PortfolioSchema);
