const express = require("express");
const router = express.Router();
const db = require("../config/db");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");

// Konfigurasi Email (Ambil dari .env)
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// --- 1. API DAFTAR (Register + Kirim OTP) ---
router.post("/register", async (req, res) => {
  const { nama, email, password, nisn, kelas } = req.body;
  try {
    // Generate OTP 6 digit
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Simpan ke DB dengan status is_verified = 0
    await db.query(
      "INSERT INTO users (nama, email, password, nisn, kelas, otp_code, is_verified) VALUES (?, ?, ?, ?, ?, ?, 0)",
      [nama, email, hashedPassword, nisn, kelas, otp],
    );

    // Kirim Email OTP
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Kode Verifikasi E-Presensi SMKN 10",
      text: `Halo ${nama}, kode OTP lu adalah: ${otp}. Masukin di aplikasi ya!`,
    };

    await transporter.sendMail(mailOptions);

    res.status(201).json({ message: "User terdaftar, cek email buat OTP!" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- 2. API VERIFIKASI OTP ---
router.post("/verify-otp", async (req, res) => {
  const { email, otp } = req.body;
  try {
    const [rows] = await db.query("SELECT * FROM users WHERE email = ?", [
      email,
    ]);
    if (rows.length === 0)
      return res.status(404).json({ message: "User tidak ditemukan" });

    const user = rows[0];

    // Cek OTP (Pake "123456" sebagai master key pas demo kalau internet macet)
    if (user.otp_code === otp || otp === "123456") {
      await db.query(
        "UPDATE users SET is_verified = 1, otp_code = NULL WHERE email = ?",
        [email],
      );
      res.status(200).json({ message: "Verifikasi Berhasil!" });
    } else {
      res.status(400).json({ message: "Kode OTP Salah!" });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- 3. API MASUK (Login) ---
router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  try {
    const [rows] = await db.query("SELECT * FROM users WHERE email = ?", [
      email,
    ]);
    if (rows.length === 0)
      return res.status(404).json({ message: "User tidak ditemukan" });

    const user = rows[0];

    // WAJIB CEK: Apakah sudah verifikasi?
    if (user.is_verified === 0) {
      return res
        .status(401)
        .json({ message: "Akun lu belum diverifikasi, cek email!" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Password salah!" });

    // BUAT TOKEN JWT
    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "1d" },
    );

    res.json({
      token,
      user: {
        id: user.id,
        nama: user.nama,
        email: user.email,
        nisn: user.nisn,
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
