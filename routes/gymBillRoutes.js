import express from "express";
import multer from "multer";
import fs from "fs";
import GymBill from "../models/GymBill.js";

const router = express.Router();

// ----------------------
// 🗂️ Multer Configuration
// ----------------------
// Store file temporarily in 'uploads' (we’ll delete after reading)
const upload = multer({ dest: "uploads/" });

// -----------------------------
// 🔢 Sequential Member ID Maker
// -----------------------------
async function generateSequentialId(prefix, field) {
  const records = await GymBill.find({
    [field]: { $regex: `^${prefix}` },
  }).lean();

  const numbers = records
    .map((r) => {
      const num = parseInt(r[field]?.replace(prefix, ""), 10);
      return isNaN(num) ? 0 : num;
    })
    .filter((n) => n > 0);

  const lastId = numbers.length > 0 ? Math.max(...numbers) : 0;
  return `${prefix}${(lastId + 1).toString().padStart(3, "0")}`;
}

// ---------------------
// 🧾 Create New Gym Bill
// ---------------------
router.post("/", upload.single("profilePicture"), async (req, res) => {
  try {
    if (!req.body || Object.keys(req.body).length === 0)
      return res.status(400).json({ message: "No data provided" });

    const memberId = await generateSequentialId("MEM", "memberId");

    // ✅ Ensure valid status
    let status = req.body.status?.trim();
    if (!status || !["Active", "Inactive"].includes(status)) {
      status = "Active";
    }

    // ✅ Convert uploaded image to Buffer
    let profilePicture = undefined;
    if (req.file) {
      const imageData = fs.readFileSync(req.file.path);
      profilePicture = {
        data: imageData,
        contentType: req.file.mimetype,
      };
      fs.unlinkSync(req.file.path); // remove temp file
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
    const allBills = await GymBill.find({
      memberId: { $regex: "^H40" },
    }).lean();

    const lastNumber =
      allBills.length > 0
        ? Math.max(...allBills.map((b) => parseInt(b.memberId.replace("H40", ""), 10)))
        : 0;

    const nextNumber = lastNumber + 1;
    const nextMemberId = `H40${String(nextNumber).padStart(3, "0")}`;

    res.json({ nextMemberId });
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

    if (!updatedData.status || !["Active", "Inactive"].includes(updatedData.status)) {
      updatedData.status = "Active";
    }

    const updated = await GymBill.findByIdAndUpdate(req.params.id, updatedData, {
      new: true,
    });

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

// ----------------------
// 🖼️ Serve Image by ID
// ----------------------
router.get("/image/:id", async (req, res) => {
  try {
    const bill = await GymBill.findById(req.params.id);
    if (!bill || !bill.profilePicture?.data) {
      return res.status(404).send("Image not found");
    }

    res.set("Content-Type", bill.profilePicture.contentType);
    res.send(bill.profilePicture.data);
  } catch (error) {
    console.error("❌ Image fetch error:", error);
    res.status(500).send("Error fetching image");
  }
});

// ✅ Export router as default
export default router;
