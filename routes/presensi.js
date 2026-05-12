const express = require("express");
const router = express.Router();
const db = require("../config/db");
const auth = require("../middleware/authMiddleware"); // Import satpamnya

// 1. API INPUT ABSEN (Hanya bisa diakses kalau punya Token)
router.post("/absen", auth, async (req, res) => {
  const { jenis_sholat, lokasi } = req.body;
  const userId = req.user.id; // Diambil otomatis dari Token JWT

  try {
    const tanggal = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
    const waktu = new Date().toLocaleTimeString("it-IT"); // HH:mm:ss

    await db.query(
      "INSERT INTO presensi (user_id, jenis_sholat, tanggal, waktu, lokasi) VALUES (?, ?, ?, ?, ?)",
      [userId, jenis_sholat, tanggal, waktu, lokasi],
    );

    res.status(201).json({ message: "Absen berhasil tersimpan di server!" });
  } catch (err) {
    console.error("Error Absen:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// 2. API AMBIL RIWAYAT (Sudah diperbaiki urutannya berdasarkan ID)
router.get("/riwayat", auth, async (req, res) => {
  const userId = req.user.id;

  try {
    // Menggunakan ORDER BY id DESC karena kolom created_at tidak ditemukan di tabel kamu
    const [rows] = await db.query(
      "SELECT * FROM presensi WHERE user_id = ? ORDER BY id DESC",
      [userId],
    );

    // Kirim data list ke Flutter
    res.status(200).json(rows);
  } catch (err) {
    console.error("Error Riwayat:", err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
