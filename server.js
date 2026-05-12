const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Log Request biar lu tau kalau HP lu berhasil konek
app.use((req, res, next) => {
  console.log(`${req.method} request ke ${req.url}`);
  next();
});

// Cek Server Jalan
app.get("/", (req, res) => {
  res.send("API SholatKu Berjalan Mulus!");
});

// Import Routes
const authRoutes = require("./routes/auth");
const presensiRoutes = require("./routes/presensi");

app.use("/api/auth", authRoutes);
app.use("/api/presensi", presensiRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, "0.0.0.0", () => {
  // "0.0.0.0" biar bisa diakses lewat IP Hotspot
  console.log(`Server nyala di port: ${PORT}`);
  console.log(`Cek riwayat di: http://localhost:${PORT}/api/presensi/riwayat`);
});
