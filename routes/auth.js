const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");

// Konfigurasi Email
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// --- 1. REGISTER + KIRIM OTP ---
router.post("/register", async (req, res) => {
  const { nama, email, password, nisn, kelas } = req.body;
  console.log(
    `[${new Date().toLocaleTimeString()}] --- Request Register Masuk ---`,
  );
  console.log("Target Email:", email);

  try {
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 1. Simpan ke Database
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
    console.log("Data user berhasil disimpan ke DB.");

    // 2. Kirim Email OTP
    console.log("Sedang mencoba kirim email...");
    await transporter.sendMail({
      from: `"SholatKu SMKN 10" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Kode OTP SholatKu",
      text: `Halo ${nama}, ini kode OTP lu: ${otp}. Masukin di aplikasi ya!`,
    });

    console.log("Email OTP Berhasil Terkirim ke:", email);
    res.status(201).json({ message: "OTP terkirim ke email!" });
  } catch (err) {
    console.error("!!! ERROR REGISTER:", err.message);
    // Kalau error karena DB (misal email duplikat), kasih tau spesifik
    if (err.code === "ER_DUP_ENTRY") {
      return res
        .status(400)
        .json({ message: "Email atau NISN sudah terdaftar!" });
    }
    res.status(500).json({ message: "Server error: " + err.message });
  }
});

// --- 2. VERIFIKASI OTP ---
router.post("/verify-otp", async (req, res) => {
  const { email, otp } = req.body;
  console.log(
    `[${new Date().toLocaleTimeString()}] Mencoba verifikasi OTP untuk: ${email}`,
  );

  try {
    const [rows] = await global.db
      .promise()
      .query("SELECT * FROM users WHERE email = ?", [email]);

    if (rows.length === 0) {
      return res.status(404).json({ message: "User tidak ditemukan" });
    }

    // Master Key '123456' biar aman pas demo
    if (rows[0].otp_code === otp || otp === "123456") {
      await global.db
        .promise()
        .query(
          "UPDATE users SET is_verified = 1, otp_code = NULL WHERE email = ?",
          [email],
        );
      console.log("Verifikasi SUKSES untuk:", email);
      res.status(200).json({ message: "Berhasil verifikasi!" });
    } else {
      console.log("Verifikasi GAGAL: OTP salah.");
      res.status(400).json({ message: "Kode OTP salah!" });
    }
  } catch (err) {
    console.error("ERROR VERIFY:", err.message);
    res.status(500).json({ message: err.message });
  }
});

// --- 3. LOGIN ---
router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  console.log(`[${new Date().toLocaleTimeString()}] Login attempt: ${email}`);

  try {
    const [rows] = await global.db
      .promise()
      .query("SELECT * FROM users WHERE email = ?", [email]);

    if (rows.length === 0) {
      return res.status(404).json({ message: "Email tidak terdaftar" });
    }

    const user = rows[0];

    // Cek status verifikasi
    if (user.is_verified === 0) {
      return res
        .status(401)
        .json({ message: "Akun belum diverifikasi, cek email!" });
    }

    // Cek Password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Password salah!" });
    }

    // Generate Token
    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET || "rahasia_smkn10",
      { expiresIn: "1d" },
    );

    console.log("Login SUKSES:", user.nama);
    res.json({
      token,
      user: { id: user.id, nama: user.nama, email: user.email },
    });
  } catch (err) {
    console.error("ERROR LOGIN:", err.message);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
