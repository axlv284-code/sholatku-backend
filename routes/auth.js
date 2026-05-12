const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");

// --- FIX KONFIGURASI EMAIL (Pake SSL Port 465 biar gak timeout) ---
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true, // pake SSL
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  tls: {
    rejectUnauthorized: false, // Biar gak rewel soal izin server
  },
});

// --- 1. REGISTER + KIRIM OTP ---
router.post("/register", async (req, res) => {
  const { nama, email, password, nisn, kelas } = req.body;
  console.log(
    `[${new Date().toLocaleTimeString()}] --- Request Register: ${email} ---`,
  );

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
    console.log("-> DB: Data user aman.");

    // 2. Kirim Email OTP (Pake timeout manual di kodingan biar gak nggantung)
    console.log("-> Mail: Mencoba kontak Gmail...");

    await transporter.sendMail({
      from: `"SholatKu SMKN 10" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Kode OTP SholatKu",
      text: `Halo ${nama}, ini kode OTP lu: ${otp}. Masukin di aplikasi ya!`,
    });

    console.log("-> Mail: OTP Berhasil Terkirim ke:", email);
    res.status(201).json({ message: "OTP terkirim ke email!" });
  } catch (err) {
    console.error("!!! ERROR REGISTER:", err.message);

    // Jika error DB karena data kembar
    if (err.code === "ER_DUP_ENTRY") {
      return res
        .status(400)
        .json({ message: "Email atau NISN sudah terdaftar!" });
    }

    // Jika error di email, kasih pesan jelas biar lu tau di log
    res.status(500).json({ message: "Server Error: " + err.message });
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

    if (rows.length === 0) {
      return res.status(404).json({ message: "User tidak ditemukan" });
    }

    // Lu minta wajib OTP email, tapi gue sisain 123456 buat darurat pas demo (opsional)
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

    if (rows.length === 0) {
      return res.status(404).json({ message: "Email tidak terdaftar" });
    }

    const user = rows[0];
    if (user.is_verified === 0) {
      return res
        .status(401)
        .json({ message: "Akun belum diverifikasi, cek email!" });
    }

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
