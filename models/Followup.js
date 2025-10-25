import mongoose from "mongoose";

const followupSchema = new mongoose.Schema(
  {
    client: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Client",
      required: true,
    },
    followupType: {
      type: String,
      enum: ["Call", "Message", "Visit", "Other"],
      required: true,
    },
    scheduleDate: { type: Date, required: true },
    scheduleTime: { type: String },
    response: { type: String },
    createdBy: { type: String, default: "admin" },
    status: {
      type: String,
      enum: ["Pending", "Completed"],
      default: "Pending",
    },
  },
  { timestamps: true }
);

export default mongoose.model("Followup", followupSchema);
