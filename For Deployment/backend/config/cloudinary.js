const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');
require('dotenv').config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

console.log("✅ Cloudinary configured");
console.log("   cloud_name:", process.env.CLOUDINARY_CLOUD_NAME ? "SET" : "MISSING ⚠️");
console.log("   api_key:", process.env.CLOUDINARY_API_KEY ? "SET" : "MISSING ⚠️");
console.log("   api_secret:", process.env.CLOUDINARY_API_SECRET ? "SET" : "MISSING ⚠️");

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "event-ticket-system",
    allowed_formats: ["jpg", "jpeg", "png", "gif", "webp"],
    // NOTE: transformation removed — it can cause silent failures in some versions
    // of multer-storage-cloudinary. Images upload at original quality.
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }
});

module.exports = { cloudinary, upload };
