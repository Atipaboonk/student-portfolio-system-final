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
    yearOfProject: { type: Number, required: true },
    category: { type: String, required: true },

    images: { type: [String], default: [] },
    coverImageUrl: { type: String },

    visibility: {
      type: String,
      enum: ["public", "private"],
      default: "private",
      index: true,
    },

    statusV2: {
      type: String,
      enum: ["Draft", "Pending", "InProcess", "Approved", "Rejected"],
      default: "Draft",
      index: true,
    },

    reviewComment: { type: String },
    reviewer: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    revision: { type: Number, default: 0 },

    // optional metadata
    tags: [{ type: String }],
    workDate: { type: Date },
    award: { type: String },
    awardYear: { type: Number },
  },
  { timestamps: true }
);

PortfolioSchema.index({
  visibility: 1,
  statusV2: 1,
  yearOfProject: 1,
  category: 1,
  owner: 1,
});

const Portfolio = mongoose.model("Portfolio", PortfolioSchema);
export default Portfolio;
