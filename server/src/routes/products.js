const express = require("express");
const router = express.Router();
const db = require("../config/db");
// GET: Load all products
router.get("/", async (req, res) => {
  try {
    const [products] = await db.query(
      "SELECT * FROM products ORDER BY id DESC",
    );
    res.json(products);
  } catch (error) {
    console.error("Error loading products:", error);
    res.status(500).json({
      message: "Failed to load products",
    });
  }
});
module.exports = router;
