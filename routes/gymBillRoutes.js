import express from "express";
import multer from "multer";
import fs from "fs";
import GymBill from "../models/GymBill.js";

const router = express.Router();

// ----------------------
// 🗂️ Multer Configuration
// ----------------------
const upload = multer({ dest: "uploads/" });

// -----------------------------
// 🔢 Sequential Numeric Member ID Generator
// -----------------------------
async function generateSequentialMemberId() {
  const lastBill = await GymBill.findOne().sort({ _id: -1 }).lean();
  let nextMemberId = 1;

  if (lastBill && lastBill.memberId) {
    const lastNumber = parseInt(lastBill.memberId, 10);
    if (!isNaN(lastNumber)) {
      nextMemberId = lastNumber + 1;
    }
  }

  return nextMemberId.toString(); // Return as string for consistency
}

// ----------------------
// 🖼️ Serve Image by ID
// ----------------------
router.get("/image/:id", async (req, res) => {
  try {
    const bill = await GymBill.findById(req.params.id);

    if (!bill || !bill.profilePicture?.data) {
      return res.status(404).json({ message: "Image not found" });
    }

    const imgBuffer = Buffer.from(bill.profilePicture.data);
    res.writeHead(200, {
      "Content-Type": bill.profilePicture.contentType,
      "Content-Length": imgBuffer.length,
      "Cache-Control": "public, max-age=31536000",
    });
    res.end(imgBuffer);
  } catch (error) {
    console.error("❌ Image fetch error:", error);
    res.status(500).json({ message: "Error fetching image", error: error.message });
  }
});

// ---------------------
// 🧾 Create New Gym Bill
// ---------------------
router.post("/", upload.single("profilePicture"), async (req, res) => {
  try {
    if (!req.body || Object.keys(req.body).length === 0)
      return res.status(400).json({ message: "No data provided" });

    // ✅ Generate sequential numeric ID
    const memberId = await generateSequentialMemberId();

    // ✅ Ensure valid status
    let status = req.body.status?.trim();
    if (!status || !["Active", "Inactive"].includes(status)) {
      status = "Active";
    }

    // ✅ Handle profile picture (convert to Buffer)
    let profilePicture = undefined;
    if (req.file) {
      const imageData = fs.readFileSync(req.file.path);
      profilePicture = {
        data: imageData,
        contentType: req.file.mimetype,
      };
      fs.unlinkSync(req.file.path);
    }

    const newBill = new GymBill({
      ...req.body,
      memberId,
      status,
      profilePicture,
    });

    await newBill.save();

    res.status(201).json({
      message: "✅ Gym Bill Created Successfully",
      memberId: newBill.memberId,
      data: newBill,
    });
  } catch (error) {
    console.error("❌ Error creating gym bill:", error);
    res.status(500).json({ message: "Error creating gym bill", error: error.message });
  }
});

// ----------------
// 📜 Get All Bills
// ----------------
router.get("/", async (req, res) => {
  try {
    const bills = await GymBill.find().sort({ _id: -1 });
    res.status(200).json(bills);
  } catch (error) {
    res.status(500).json({ message: "Error fetching bills", error: error.message });
  }
});

// ----------------------------
// 📋 Get Last Member ID (for UI)
// ----------------------------
router.get("/last-member-id", async (req, res) => {
  try {
    const lastBill = await GymBill.findOne().sort({ _id: -1 }).lean();

    let nextMemberId = 1;
    if (lastBill && lastBill.memberId) {
      const lastNumber = parseInt(lastBill.memberId, 10);
      if (!isNaN(lastNumber)) {
        nextMemberId = lastNumber + 1;
      }
    }

    res.json({ nextMemberId: nextMemberId.toString() });
  } catch (err) {
    console.error("❌ Error fetching next member ID:", err);
    res.status(500).json({ error: "Error fetching next member ID" });
  }
});

// ------------------
// 🔁 Renew Membership
// ------------------
router.put("/renew/:id", async (req, res) => {
  try {
    const { joiningDate, endDate, package: pkg, amountPaid } = req.body;

    const updatedClient = await GymBill.findByIdAndUpdate(
      req.params.id,
      {
        joiningDate,
        endDate,
        package: pkg,
        amountPaid,
        status: "Active",
      },
      { new: true }
    );

    res.json(updatedClient);
  } catch (err) {
    console.error("❌ Renewal error:", err);
    res.status(500).json({ error: "Renewal failed" });
  }
});

// -----------------
// ✏️ Update Gym Bill
// -----------------
router.put("/:id", upload.single("profilePicture"), async (req, res) => {
  try {
    let updatedData = { ...req.body };

    // ✅ Handle new profile image if provided
    if (req.file) {
      const imageData = fs.readFileSync(req.file.path);
      updatedData.profilePicture = {
        data: imageData,
        contentType: req.file.mimetype,
      };
      fs.unlinkSync(req.file.path);
    }

    if (
      !updatedData.status ||
      !["Active", "Inactive"].includes(updatedData.status)
    ) {
      updatedData.status = "Active";
    }

    const updated = await GymBill.findByIdAndUpdate(
      req.params.id,
      updatedData,
      { new: true }
    );

    res.json(updated);
  } catch (err) {
    console.error("❌ Update error:", err);
    res.status(500).json({ error: err.message });
  }
});

// -------------------
// ❌ Delete Gym Client
// -------------------
router.delete("/:id", async (req, res) => {
  try {
    await GymBill.findByIdAndDelete(req.params.id);
    res.json({ message: "Client deleted successfully" });
  } catch (err) {
    console.error("❌ Delete error:", err);
    res.status(500).json({ error: err.message });
  }
});

// ✅ Export router
export default router;
