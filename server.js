import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import authRoutes from "./routes/authRoutes.js";
import inquiryRoutes from "./routes/inquiryRoutes.js";
import trainerRoutes from "./routes/trainerRoutes.js";
import clientRoutes from "./routes/clientRoutes.js";
import membershipRoutes from "./routes/membershipRoutes.js";
import groupClassRoutes from "./routes/groupClassRoutes.js";
import ptRoutes from "./routes/ptRoutes.js";
import subRoutes from "./routes/subscriptionRoutes.js";
import followupRoutes from "./routes/followupRoutes.js";

dotenv.config();
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/inquiries", inquiryRoutes);
app.use("/api/trainers", trainerRoutes);
app.use("/api/clients", clientRoutes);
app.use("/api/memberships", membershipRoutes);
app.use("/api/groupclasses", groupClassRoutes);
app.use("/api/personaltrainings", ptRoutes);
app.use("/api/subscriptions", subRoutes);
app.use("/api/followups", followupRoutes);

// DB connection
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => console.error("❌ MongoDB Connection Failed:", err));

app.listen(process.env.PORT, () => {
  console.log(`🚀 Server running on port ${process.env.PORT}`);
});
