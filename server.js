const dns = require("dns");
// FIX PENTING: Paksa pake IPv4 biar gak kena error ENETUNREACH pas kontak Gmail
dns.setDefaultResultOrder("ipv4first");

const express = require("express");
const cors = require("cors");
const mysql = require("mysql2");
require("dotenv").config();

const app = express();

// Konfigurasi Database
const dbConfig = {
  host: process.env.DB_HOST || "mysql.railway.internal",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "JjFmsJdXxnzFasvLmlmbCjZsiIPQuFof",
  database: process.env.DB_NAME || "railway",
  port: process.env.DB_PORT || 57844,
};

// Pake createPool biar lebih stabil daripada createConnection biasa
const db = mysql.createPool(dbConfig);

// Cek Koneksi
db.getConnection((err, connection) => {
  if (err) {
    console.error("!!! KONEKSI DATABASE GAGAL:", err.message);
  } else {
    console.log("--- DATABASE TERHUBUNG (RAILWAY POOL) ---");
    connection.release(); // Balikin koneksi ke pool
  }
});

// Masukin ke global biar bisa dipake di routes/auth.js
global.db = db;

app.use(cors());
app.use(express.json());

// Log Request buat monitoring
app.use((req, res, next) => {
  console.log(
    `[${new Date().toLocaleTimeString()}] ${req.method} ke ${req.url}`,
  );
  next();
});

app.get("/", (req, res) => res.send("API SholatKu Aktif!"));

// Routes
const authRoutes = require("./routes/auth");
const presensiRoutes = require("./routes/presensi");

app.use("/api/auth", authRoutes);
app.use("/api/presensi", presensiRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server nyala di port: ${PORT}`);
});
