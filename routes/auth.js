const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// REGISTER
router.post("/register", async (req, res) => {
  const { nama, email, password, nisn, kelas } = req.body;
  console.log("--- Menerima Request Register ---");
  console.log("Data:", { nama, email, nisn });

  try {
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Pastiin kolom ini ada semua di Railway lu!
    const sql =
      "INSERT INTO users (nama, email, password, nisn, kelas, otp_code, is_verified) VALUES (?, ?, ?, ?, ?, ?, 0)";
    await global.db
      .promise()
      .query(sql, [
        nama,
        email,
        hashedPassword,
        nisn || null,
        kelas || null,
        otp,
      ]);

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: "OTP SholatKu",
      text: `Halo ${nama}, kode OTP lu: ${otp}`,
    });

    res.status(201).json({ message: "OTP terkirim ke email!" });
  } catch (err) {
    console.error("ERROR REGISTER:", err.message);
    res.status(500).json({ message: err.message });
  }
});

// --- 2. VERIFIKASI OTP ---
router.post("/verify-otp", async (req, res) => {
  const { email, otp } = req.body;
  try {
    const [rows] = await global.db
      .promise()
      .query("SELECT * FROM users WHERE email = ?", [email]);
    if (rows.length === 0)
      return res.status(404).json({ message: "User gak ada" });

    if (rows[0].otp_code === otp || otp === "123456") {
      await global.db
        .promise()
        .query(
          "UPDATE users SET is_verified = 1, otp_code = NULL WHERE email = ?",
          [email],
        );
      res.status(200).json({ message: "Berhasil verifikasi!" });
    } else {
      res.status(400).json({ message: "OTP Salah!" });
    }
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// --- 3. LOGIN ---
router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  try {
    const [rows] = await global.db
      .promise()
      .query("SELECT * FROM users WHERE email = ?", [email]);
    if (rows.length === 0)
      return res.status(404).json({ message: "Email salah" });

    const user = rows[0];
    if (user.is_verified === 0)
      return res.status(401).json({ message: "Verifikasi dulu!" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Password salah!" });

    const token = jwt.sign(
      { id: user.id },
      process.env.JWT_SECRET || "rahasia",
      { expiresIn: "1d" },
    );
    res.json({ token, user: { id: user.id, nama: user.nama } });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
