import express from "express";
import Followup from "../models/Followup.js";
import Client from "../models/Client.js";

const router = express.Router();

// ✅ CREATE follow-up
router.post("/", async (req, res) => {
  try {
    const {
      clientId, // could be _id or custom ID
      followupType,
      scheduleDate,
      scheduleTime,
      response,
      createdBy,
    } = req.body;

    // Try finding client by Mongo _id first, else by custom clientId field
    let client =
      (await Client.findById(clientId)) || (await Client.findOne({ clientId }));

    if (!client) {
      console.error("❌ Client not found for ID:", clientId);
      return res.status(404).json({ message: "Client not found" });
    }

    const followup = new Followup({
      client: client._id,
      followupType,
      scheduleDate,
      scheduleTime,
      response,
      createdBy,
    });

    await followup.save();
    console.log("✅ Follow-up created for client:", client.name);

    res.status(201).json(followup);
  } catch (err) {
    console.error("❌ Error creating follow-up:", err.message);
    res.status(500).json({ message: "Error creating followup", error: err.message });
  }
});

// ✅ GET all follow-ups (populate client name)
router.get("/", async (req, res) => {
  try {
    const followups = await Followup.find()
      .populate("client", "name contactNumber clientId") // include ID field too
      .sort({ createdAt: -1 });

    res.status(200).json(followups);
  } catch (err) {
    console.error("❌ Error fetching follow-ups:", err.message);
    res.status(500).json({ message: "Error fetching followups" });
  }
});

// ✅ UPDATE follow-up status
router.put("/:id/status", async (req, res) => {
  try {
    const { status } = req.body;
    const updated = await Followup.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ message: "Follow-up not found" });
    }

    res.status(200).json(updated);
  } catch (err) {
    console.error("❌ Error updating follow-up status:", err.message);
    res.status(500).json({ message: "Error updating status" });
  }
});

// ✅ DELETE follow-up
router.delete("/:id", async (req, res) => {
  try {
    const deleted = await Followup.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ message: "Follow-up not found" });
    }

    res.status(200).json({ message: "Follow-up deleted successfully" });
  } catch (err) {
    console.error("❌ Error deleting follow-up:", err.message);
    res.status(500).json({ message: "Error deleting follow-up" });
  }
});

export default router;
