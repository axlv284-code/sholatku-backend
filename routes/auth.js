const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { google } = require("googleapis");

// Konfigurasi Gmail API
const authClient = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  "https://developers.google.com/oauthplayground",
);

authClient.setCredentials({ refresh_token: process.env.GOOGLE_REFRESH_TOKEN });
const gmail = google.gmail({ version: "v1", auth: authClient });

// Fungsi Kirim Email via HTTP (Anti-Blokir Railway)
async function sendMailViaAPI(to, subject, body) {
  const message = [
    `To: ${to}`,
    "Content-Type: text/html; charset=utf-8",
    "MIME-Version: 1.0",
    `Subject: ${subject}`,
    "",
    body,
  ].join("\n");

  const encodedMessage = Buffer.from(message)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

  return gmail.users.messages.send({
    userId: "me",
    requestBody: { raw: encodedMessage },
  });
}

// --- 1. REGISTER ---
router.post("/register", async (req, res) => {
  const { nama, email, password, nisn, kelas } = req.body;
  try {
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const hashedPassword = await bcrypt.hash(password, 10);

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

    // Respon cepat ke Flutter
    res.status(201).json({ message: "Daftar berhasil! Cek email lu." });

    // Kirim Email di background
    sendMailViaAPI(
      email,
      "Kode OTP SholatKu",
      `Halo <b>${nama}</b>,<br><br>Ini kode OTP lu: <b>${otp}</b><br>Masukin di aplikasi buat verifikasi ya!`,
    )
      .then(() => console.log(`-> OTP Terkirim ke ${email}`))
      .catch((e) => console.log("-> API Gmail Error:", e.message));
  } catch (err) {
    console.error("ERROR REGISTER:", err.message);
    if (!res.headersSent) res.status(500).json({ message: err.message });
  }
});

// --- 2. VERIFIKASI OTP ---
router.post("/verify-otp", async (req, res) => {
  const { email, otp } = req.body;
  try {
    const [rows] = await global.db
      .promise()
      .query("SELECT * FROM users WHERE email = ?", [email]);

    // Backdoor 123456 buat jaga-jaga demo besok
    if (rows.length > 0 && (rows[0].otp_code === otp || otp === "123456")) {
      await global.db
        .promise()
        .query(
          "UPDATE users SET is_verified = 1, otp_code = NULL WHERE email = ?",
          [email],
        );
      return res.status(200).json({ message: "Berhasil verifikasi!" });
    }
    res.status(400).json({ message: "Kode OTP salah!" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// --- 3. LOGIN (LENGKAP UNTUK PROFILE) ---
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
      return res.status(401).json({ message: "Verifikasi email dulu!" });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(400).json({ message: "Password salah!" });

    const token = jwt.sign(
      { id: user.id },
      process.env.JWT_SECRET || "rahasia",
      { expiresIn: "1d" },
    );

    // Sekarang kirim SEMUA data biar Profile di Flutter nggak kosong
    res.json({
      token,
      user: {
        id: user.id,
        nama: user.nama,
        email: user.email,
        nisn: user.nisn || "Belum diisi",
        kelas: user.kelas || "Belum diisi",
      },
    });
  } catch (err) {
    res.status(500).json({ message: "Server Error" });
  }
});

module.exports = router;
