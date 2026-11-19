const express = require("express");
const router = express.Router();
const db = require("../config/db");

// GET: Load all beneficiaries
router.get("/", async (req, res) => {
  try {
    const [beneficiaries] = await db.query(
      "SELECT * FROM beneficiaries ORDER BY beneficiary_id DESC",
    );
    res.json(beneficiaries);
  } catch (error) {
    console.error("Error loading beneficiaries:", error);
    res.status(500).json({
      message: "Failed to load beneficiaries",
    });
  }
});

// POST: Save a new beneficiary
router.post("/", async (req, res) => {
  try {
    const {
      card_id,
      full_name,
      contact_number,
      birthdate,
      sex,
      barangay,
      address,
      photo_url,
      representative_name,
      representative_relation,
      account_balance,
      status,
    } = req.body;

    if (
      !card_id ||
      typeof card_id !== "string" ||
      !card_id.trim() ||
      !full_name ||
      typeof full_name !== "string" ||
      !full_name.trim() ||
      !birthdate ||
      !barangay ||
      typeof barangay !== "string" ||
      !barangay.trim()
    ) {
      return res.status(400).json({
        message:
          "Please enter valid beneficiary details (Card ID, Full Name, Birth Date, and Barangay are required).",
      });
    }

    const [result] = await db.query(
      `INSERT INTO beneficiaries (card_id, full_name, contact_number, birthdate, sex, barangay, address, representative_name, representative_relation, account_balance, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        card_id.trim(),
        full_name.trim(),
        contact_number ? contact_number.trim() : null,
        birth_date,
        sex && ["MALE", "FEMALE"].includes(sex) ? sex : null,
        barangay.trim(),
        address ? address.trim() : null,
        photo_url ? photo_url.trim() : null,
        representative_name ? representative_name.trim() : null,
        representative_relation ? representative_relation.trim() : null,
        Number.isFinite(Number(account_balance))
          ? Number(account_balance)
          : 0.0,
        status && ["ACTIVE", "DECEASED"].includes(status) ? status : "ACTIVE",
      ],
    );

    res.status(201).json({
      message: "Beneficiary registered successfully",
      beneficiary_id: result.insertId,
    });
  } catch (error) {
    console.error("Error saving beneficiary:", error);
    if (error.code === "ER_DUP_ENTRY") {
      return res.status(400).json({ message: "Card ID already exists." });
    }
    res.status(500).json({
      message: "Failed to register beneficiary",
    });
  }
});

// PUT: Update an existing beneficiary
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const {
      card_id,
      full_name,
      birth_date,
      barangay,
      photo_url,
      representative_name,
      representative_relation,
      account_balance,
      status,
    } = req.body;

    if (
      !Number.isInteger(Number(id)) ||
      Number(id) < 1 ||
      !card_id ||
      typeof card_id !== "string" ||
      !card_id.trim() ||
      !full_name ||
      typeof full_name !== "string" ||
      !full_name.trim() ||
      !birth_date ||
      !barangay ||
      typeof barangay !== "string" ||
      !barangay.trim()
    ) {
      return res.status(400).json({
        message: "Please enter valid beneficiary details.",
      });
    }

    const [result] = await db.query(
      `UPDATE beneficiaries
       SET card_id = ?, full_name = ?, birth_date = ?, barangay = ?, photo_url ? photo_url.trim() : null, representative_name = ?, representative_relation = ?, account_balance = ?, status = ?
       WHERE beneficiary_id = ?`,
      [
        card_id.trim(),
        full_name.trim(),
        birth_date,
        barangay.trim(),
        representative_name ? representative_name.trim() : null,
        representative_relation ? representative_relation.trim() : null,
        Number.isFinite(Number(account_balance))
          ? Number(account_balance)
          : 0.0,
        status && ["ACTIVE", "DECEASED"].includes(status) ? status : "ACTIVE",
        Number(id),
      ],
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        message: "Beneficiary not found.",
      });
    }

    res.json({
      message: "Beneficiary updated successfully",
    });
  } catch (error) {
    console.error("Error updating beneficiary:", error);
    res.status(500).json({
      message: "Failed to update beneficiary",
    });
  }
});

// DELETE: Remove a beneficiary
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    if (!Number.isInteger(Number(id)) || Number(id) < 1) {
      return res.status(400).json({
        message: "Invalid beneficiary ID.",
      });
    }

    const [result] = await db.query(
      "DELETE FROM beneficiaries WHERE beneficiary_id = ?",
      [Number(id)],
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        message: "Beneficiary not found.",
      });
    }

    res.json({
      message: "Beneficiary deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting beneficiary:", error);
    res.status(500).json({
      message: "Failed to delete beneficiary",
    });
  }
});

module.exports = router;
