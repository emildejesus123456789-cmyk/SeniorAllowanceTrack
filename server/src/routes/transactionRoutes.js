const express = require("express");
const router = express.Router();
const db = require("../config/db");

// GET: Load all transactions (ledger)
router.get("/", async (req, res) => {
  try {
    const [transactions] = await db.query(`
      SELECT 
        t.transaction_id,
        t.reference_no,
        t.type,
        t.amount,
        t.balance_after,
        t.claimed_by,
        t.created_at,
        b.full_name AS beneficiary_name,
        b.card_id,
        b.barangay,
        a.full_name AS processed_by_name
      FROM transactions t
      JOIN beneficiaries b ON t.beneficiary_id = b.beneficiary_id
      JOIN admins a ON t.processed_by = a.admin_id
      ORDER BY t.created_at DESC
    `);
    res.json(transactions);
  } catch (error) {
    console.error("Error loading transactions:", error);
    res.status(500).json({ message: "Failed to load transaction ledger" });
  }
});

// POST: Process a Deposit or Withdrawal
router.post("/", async (req, res) => {
  try {
    const { beneficiary_id, type, amount, claimed_by } = req.body;
    const processed_by = req.admin.admin_id; // From JWT middleware

    // Validation
    if (
      !Number.isInteger(Number(beneficiary_id)) ||
      !["DEPOSIT", "WITHDRAWAL"].includes(type) ||
      !Number.isFinite(Number(amount)) ||
      Number(amount) <= 0
    ) {
      return res
        .status(400)
        .json({ message: "Please provide valid transaction details." });
    }

    const numericAmount = Number(amount);

    // Check if beneficiary exists and get current balance
    const [beneficiaries] = await db.query(
      "SELECT account_balance, status FROM beneficiaries WHERE beneficiary_id = ?",
      [beneficiary_id],
    );

    if (beneficiaries.length === 0) {
      return res.status(404).json({ message: "Beneficiary not found." });
    }

    const beneficiary = beneficiaries[0];

    if (beneficiary.status !== "ACTIVE") {
      return res.status(400).json({
        message:
          "Cannot process transactions for inactive or deceased beneficiaries.",
      });
    }

    let newBalance = Number(beneficiary.account_balance);

    if (type === "DEPOSIT") {
      newBalance += numericAmount;
    } else {
      // WITHDRAWAL check
      if (newBalance < numericAmount) {
        return res.status(400).json({
          message: "Insufficient account balance for this withdrawal.",
        });
      }
      newBalance -= numericAmount;
    }

    // Generate unique reference number
    const reference_no = `REF-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    // 1. Insert into transactions table (including balance_after)
    await db.query(
      `INSERT INTO transactions (reference_no, beneficiary_id, type, amount, balance_after, claimed_by, processed_by)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        reference_no,
        beneficiary_id,
        type,
        numericAmount,
        newBalance,
        claimed_by
          ? claimed_by.trim()
          : type === "WITHDRAWAL"
            ? "Self"
            : "Municipal Treasury",
        processed_by,
      ],
    );

    // 2. Update beneficiary account balance
    await db.query(
      "UPDATE beneficiaries SET account_balance = ? WHERE beneficiary_id = ?",
      [newBalance, beneficiary_id],
    );

    res.status(201).json({
      message: `${type === "DEPOSIT" ? "Deposit" : "Withdrawal"} processed successfully`,
      reference_no,
      new_balance: newBalance,
    });
  } catch (error) {
    console.error("Transaction error:", error);
    res
      .status(500)
      .json({ message: error.sqlMessage || "Failed to process transaction." });
  }
});

// POST: Deposit an amount to ALL ACTIVE beneficiaries
router.post("/batch-deposit", async (req, res) => {
  try {
    const { amount, claimed_by } = req.body;
    const processed_by = req.admin?.admin_id;
    const numericAmount = Number(amount);

    if (!processed_by) {
      return res.status(401).json({ message: "Admin ID missing from token." });
    }

    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      return res
        .status(400)
        .json({
          message: "Please enter a valid deposit amount greater than ₱0.",
        });
    }

    const [activeBeneficiaries] = await db.query(
      "SELECT beneficiary_id, account_balance FROM beneficiaries WHERE status = 'ACTIVE'",
    );

    if (activeBeneficiaries.length === 0) {
      return res
        .status(400)
        .json({
          message: "No active beneficiaries found to receive a deposit.",
        });
    }

    const batchTimestamp = Date.now();
    const claimSource =
      claimed_by && claimed_by.trim()
        ? claimed_by.trim()
        : "Municipal Batch Treasury";

    for (let i = 0; i < activeBeneficiaries.length; i++) {
      const ben = activeBeneficiaries[i];
      const currentBalance = Number(ben.account_balance || 0);
      const newBalance = Number((currentBalance + numericAmount).toFixed(2));
      const reference_no = `BATCH-${batchTimestamp}-${ben.beneficiary_id}-${i}`;

      await db.query(
        `INSERT INTO transactions (reference_no, beneficiary_id, type, amount, balance_after, claimed_by, processed_by)
         VALUES (?, ?, 'DEPOSIT', ?, ?, ?, ?)`,
        [
          reference_no,
          ben.beneficiary_id,
          numericAmount,
          newBalance,
          claimSource,
          processed_by,
        ],
      );

      await db.query(
        "UPDATE beneficiaries SET account_balance = ? WHERE beneficiary_id = ?",
        [newBalance, ben.beneficiary_id],
      );
    }

    res.status(201).json({
      message: `Deposited ₱${numericAmount.toFixed(2)} to ${activeBeneficiaries.length} active beneficiaries.`,
      credited_count: activeBeneficiaries.length,
      amount_per_beneficiary: numericAmount,
      total_disbursed: Number(
        (numericAmount * activeBeneficiaries.length).toFixed(2),
      ),
    });
  } catch (error) {
    console.error("Batch deposit error:", error);
    res.status(500).json({
      message:
        error.sqlMessage || error.message || "Failed to process batch deposit.",
    });
  }
});
module.exports = router;
