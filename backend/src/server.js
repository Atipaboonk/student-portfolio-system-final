import express from "express";
import dotenv from "dotenv";
import connectDB from "./config/db.js";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";

import authRoutes from "./routes/auth.js";
import userRoutes from "./routes/user.js";
import userRoutesV2 from "./routes/user.v2.js";
import portfolioRoutes from "./routes/portfolio.js";
import portfolioRoutesV2 from "./routes/portfolio.v2.js";

dotenv.config();
await connectDB();

const app = express();
app.use(express.json());

app.use(
  cors({
    origin: "http://localhost:5000", // แก้ให้ตรง frontend ของจริง
    credentials: true,
  })
);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// เสิร์ฟไฟล์ uploads (โปรไฟล์/portfolio)
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

app.use("/auth", authRoutes);
app.use("/api/user", userRoutes);
app.use("/api/user", userRoutesV2); // ถ้าไม่ใช้ v2 ลบได้
app.use("/api/portfolio", portfolioRoutes);
app.use("/api/portfolio", portfolioRoutesV2);

app.get("/", (req, res) => {
  res.send("StudentPort API is running 🚀");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on http://127.0.0.1:${PORT}`);
});
