import mongoose from "mongoose";

const subjectSchema = new mongoose.Schema({
  name: { type: String, required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
}, { timestamps: true });

export const Subject = mongoose.model("Subject", subjectSchema);

const topicSchema = new mongoose.Schema({
  title: { type: String, required: true },
  subjectId: { type: mongoose.Schema.Types.ObjectId, ref: "Subject", required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  order: { type: Number, default: 0 },
}, { timestamps: true });

export const Topic = mongoose.model("Topic", topicSchema);

const blockSchema = new mongoose.Schema({
  topicId: { type: mongoose.Schema.Types.ObjectId, ref: "Topic", required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  type: { type: String, enum: ["text", "code", "heading", "image"], required: true },
  content: { type: String, default: "" },
  language: { type: String }, // optional for code blocks
  order: { type: Number, default: 0 },
}, { timestamps: true });

export const Block = mongoose.model("Block", blockSchema);
