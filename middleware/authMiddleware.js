const jwt = require("jsonwebtoken");

module.exports = (req, res, next) => {
  // Ambil token dari header 'Authorization'
  const token = req.header("Authorization");

  if (!token) {
    return res.status(401).json({ message: "Akses ditolak, token tidak ada!" });
  }

  try {
    // Verifikasi token pake secret key di .env
    const verified = jwt.verify(token, process.env.JWT_SECRET);
    req.user = verified;
    next(); // Lanjut ke fungsi berikutnya kalau token bener
  } catch (err) {
    res.status(400).json({ message: "Token tidak valid!" });
  }
};
