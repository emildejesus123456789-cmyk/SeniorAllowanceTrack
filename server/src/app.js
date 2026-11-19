require("dotenv").config();
const express = require("express");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const db = require("./config/db");
const beneficiaryRoutes = require("./routes/beneficiaryRoutes");
const transactionRoutes = require("./routes/transactionRoutes"); // Ensure file is routes/transactions.js

const app = express();

app.use(
  cors({
    origin: "http://localhost:5173",
  }),
);
app.use(express.json());

// Middleware: Protect Admin Routes
const verifyToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  if (!token) {
    return res
      .status(401)
      .json({ message: "Access denied. No token provided." });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).json({ message: "Invalid or expired token." });
    }
    req.admin = decoded;
    next();
  });
};

// POST /api/login
app.post("/api/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const [rows] = await db.query("SELECT * FROM admins WHERE email = ?", [
      email,
    ]);
    if (rows.length === 0) {
      return res.status(401).json({ message: "Invalid email or password." });
    }

    const admin = rows[0];
    const isMatch = await bcrypt.compare(password, admin.password_hash);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid email or password." });
    }

    const token = jwt.sign(
      {
        admin_id: admin.admin_id,
        role: admin.role,
        full_name: admin.full_name,
      },
      process.env.JWT_SECRET,
      { expiresIn: "8h" },
    );

    res.json({
      token,
      admin: {
        admin_id: admin.admin_id,
        full_name: admin.full_name,
        email: admin.email,
        role: admin.role,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error during login." });
  }
});

// Test Protected Route
app.get("/api/me", verifyToken, (req, res) => {
  res.json({ message: "Authenticated", admin: req.admin });
});

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({ message: "API is running" });
});

// GET /api/dashboard - Aggregated KPIs, Barangay Breakdown & Recent Activity
app.get("/api/dashboard", verifyToken, async (req, res) => {
  try {
    const [[beneficiaryStats]] = await db.query(`
      SELECT 
        COUNT(*) AS total_beneficiaries,
        COALESCE(SUM(account_balance), 0) AS total_unclaimed_balance
      FROM beneficiaries
      WHERE status = 'ACTIVE'
    `);

    const [[transactionStats]] = await db.query(`
      SELECT 
        COALESCE(SUM(CASE WHEN type = 'DEPOSIT' THEN amount ELSE 0 END), 0) AS total_credited,
        COALESCE(SUM(CASE WHEN type = 'WITHDRAWAL' THEN amount ELSE 0 END), 0) AS total_withdrawn
      FROM transactions
    `);

    const [barangayBreakdown] = await db.query(`
      SELECT 
        b.barangay,
        COUNT(DISTINCT b.beneficiary_id) AS senior_count,
        COALESCE(SUM(b.account_balance), 0) AS unclaimed_balance,
        COALESCE((
          SELECT SUM(t.amount) 
          FROM transactions t 
          JOIN beneficiaries b2 ON t.beneficiary_id = b2.beneficiary_id 
          WHERE b2.barangay = b.barangay AND t.type = 'WITHDRAWAL'
        ), 0) AS total_withdrawn
      FROM beneficiaries b
      WHERE b.status = 'ACTIVE'
      GROUP BY b.barangay
      ORDER BY b.barangay ASC
    `);

    const [recentTransactions] = await db.query(`
      SELECT 
        t.transaction_id,
        t.reference_no,
        t.type,
        t.amount,
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
      LIMIT 5
    `);

    res.json({
      kpis: {
        total_beneficiaries: beneficiaryStats.total_beneficiaries,
        total_unclaimed_balance: Number(
          beneficiaryStats.total_unclaimed_balance,
        ),
        total_credited: Number(transactionStats.total_credited),
        total_withdrawn: Number(transactionStats.total_withdrawn),
      },
      barangayBreakdown,
      recentTransactions,
    });
  } catch (error) {
    console.error("Dashboard fetch error:", error);
    res.status(500).json({ message: "Failed to load dashboard metrics." });
  }
});

// Mount Protected Module Routes
app.use("/api/beneficiaries", verifyToken, beneficiaryRoutes);
app.use("/api/transactions", verifyToken, transactionRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
