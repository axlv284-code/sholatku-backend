const express = require("express");
const cors = require("cors");
const mysql = require("mysql2");
require("dotenv").config();

const app = express();

// LOGIKA KONEKSI BIAR GAK STUCK
const dbConfig = {
  host: process.env.DB_HOST || "mysql.railway.internal",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASS || "JjFmsJdXxnzFasvLmlmbCjZsiIPQuFof",
  database: process.env.DB_NAME || "railway",
  port: process.env.DB_PORT || 57844, // Sesuain sama port di gambar pertama lu
};

const db = mysql.createConnection(dbConfig);

db.connect((err) => {
  if (err) {
    console.error("!!! KONEKSI DATABASE GAGAL:", err.message);
  } else {
    console.log("--- DATABASE TERHUBUNG (RAILWAY) ---");
  }
});

global.db = db;

app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
  console.log(
    `[${new Date().toLocaleTimeString()}] ${req.method} ke ${req.url}`,
  );
  next();
});

app.get("/", (req, res) => res.send("API SholatKu Aktif!"));

const authRoutes = require("./routes/auth");
const presensiRoutes = require("./routes/presensi");
app.use("/api/auth", authRoutes);
app.use("/api/presensi", presensiRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server nyala di port: ${PORT}`);
});
