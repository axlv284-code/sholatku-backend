const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");

// --- KONFIGURASI EMAIL (SSL Port 465) ---
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  tls: {
    rejectUnauthorized: false,
  },
});

// --- 1. REGISTER (VERSI ANTI-STUCK) ---
router.post("/register", async (req, res) => {
  const { nama, email, password, nisn, kelas } = req.body;
  console.log(
    `[${new Date().toLocaleTimeString()}] --- Register: ${email} ---`,
  );

  try {
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 1. Simpan ke Database (Prioritas Utama)
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
    console.log("-> DB: Data user aman.");

    // 2. LANGSUNG KIRIM RESPON KE FLUTTER
    // Ini biar loading di HP lu kelar dan bisa pindah ke hal verifikasi
    res
      .status(201)
      .json({ message: "Daftar berhasil! Cek email lu beberapa saat lagi." });

    // 3. KIRIM EMAIL DI BACKGROUND (Tanpa 'await')
    // Biar kalau timeout/error ENETUNREACH, Flutter lu gak kena imbasnya
    console.log("-> Mail: Mencoba kirim di background...");
    transporter
      .sendMail({
        from: `"SholatKu SMKN 10" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: "Kode OTP SholatKu",
        text: `Halo ${nama}, ini kode OTP lu: ${otp}. Masukin di aplikasi ya!`,
      })
      .then(() => {
        console.log("-> Mail: OTP Terkirim!");
      })
      .catch((mailErr) => {
        console.error("-> Mail Error (Background):", mailErr.message);
      });
  } catch (err) {
    console.error("!!! ERROR REGISTER:", err.message);
    if (err.code === "ER_DUP_ENTRY") {
      return res
        .status(400)
        .json({ message: "Email atau NISN sudah terdaftar!" });
    }
    // Hanya kirim error jika gagal di level Database
    if (!res.headersSent) {
      res.status(500).json({ message: "Server error: " + err.message });
    }
  }
});

// --- 2. VERIFIKASI OTP ---
router.post("/verify-otp", async (req, res) => {
  const { email, otp } = req.body;
  console.log(`[${new Date().toLocaleTimeString()}] Verifikasi OTP: ${email}`);

  try {
    const [rows] = await global.db
      .promise()
      .query("SELECT * FROM users WHERE email = ?", [email]);
    if (rows.length === 0)
      return res.status(404).json({ message: "User tidak ditemukan" });

    // Cek OTP (Gue sisain 123456 buat darurat aja kalau email tetep gak masuk)
    if (rows[0].otp_code === otp || otp === "123456") {
      await global.db
        .promise()
        .query(
          "UPDATE users SET is_verified = 1, otp_code = NULL WHERE email = ?",
          [email],
        );
      console.log("-> Verifikasi SUKSES!");
      res.status(200).json({ message: "Berhasil verifikasi!" });
    } else {
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
  try {
    const [rows] = await global.db
      .promise()
      .query("SELECT * FROM users WHERE email = ?", [email]);
    if (rows.length === 0)
      return res.status(404).json({ message: "Email tidak terdaftar" });

    const user = rows[0];
    if (user.is_verified === 0)
      return res.status(401).json({ message: "Verifikasi dulu!" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Password salah!" });

    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET || "rahasia_smkn10",
      { expiresIn: "1d" },
    );
    res.json({ token, user: { id: user.id, nama: user.nama } });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
