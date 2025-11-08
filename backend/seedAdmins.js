// seedAdmins.js
import dotenv from "dotenv";
import mongoose from "mongoose";
import bcrypt from "bcrypt";
import User from "./src/models/User.js";

dotenv.config();

const MONGO_URI = process.env.MONGO_URI;

const run = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("MongoDB connected (seed)");

    // 1) Super Admin
    const superEmail = "superadmin@studentport.com";
    const superExists = await User.findOne({ email: superEmail });
    if (!superExists) {
      const superPassHash = await bcrypt.hash("Super123!", 10);
      await User.create({
        name: "Super Admin",
        email: superEmail,
        passwordHash: superPassHash,
        role: "SUPER_ADMIN",
        accountStatus: "APPROVED"
      });
      console.log(`Created SUPER_ADMIN -> ${superEmail} / Super123!`);
    } else {
      console.log("SUPER_ADMIN already exists, skipped");
    }

    // 2) Advisor Admin
    const advEmail = "advisor@studentport.com";
    const advExists = await User.findOne({ email: advEmail });
    if (!advExists) {
      const advPassHash = await bcrypt.hash("Advisor123!", 10);
      await User.create({
        name: "Advisor Admin",
        email: advEmail,
        passwordHash: advPassHash,
        role: "ADVISOR_ADMIN",
        accountStatus: "APPROVED"
      });
      console.log(`Created ADVISOR_ADMIN -> ${advEmail} / Advisor123!`);
    } else {
      console.log("ADVISOR_ADMIN already exists, skipped");
    }

    await mongoose.disconnect();
    console.log("Done seeding admins");
    process.exit(0);
  } catch (err) {
    console.error("Seed error:", err);
    process.exit(1);
  }
};

run();
