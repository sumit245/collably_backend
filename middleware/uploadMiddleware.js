const multer = require("multer");
const multerS3 = require("multer-s3");
const { S3Client } = require("@aws-sdk/client-s3"); // Correct AWS SDK v3 import
const path = require("path");
require("dotenv").config();

// ✅ Correct S3 client initialization
const s3 = new S3Client({
  region: process.env.AWS_DEFAULT_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

// ✅ Remove ACL option to prevent errors
const storage = multerS3({
  s3: s3,
  bucket: process.env.AWS_BUCKET, // Your S3 bucket name
  metadata: (req, file, cb) => {
    cb(null, { fieldName: file.fieldname });
  },
  key: (req, file, cb) => {
    const fileExtension = path.extname(file.originalname);
    const uniqueKey = `media/${Date.now()}${fileExtension}`;
    cb(null, uniqueKey);
  },
});

// ✅ File filter to allow only images/videos
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image/") || file.mimetype.startsWith("video/")) {
    cb(null, true);
  } else {
    cb(new Error("Invalid file type. Only images and videos are allowed."), false);
  }
};

// ✅ Configure Multer with field-based upload
const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB max file size
}).fields([
  { name: "media", maxCount: 5 }, // Multiple media files
  { name: "brandLogo", maxCount: 1 }, // Single brand logo
  { name: "productPhoto", maxCount: 1 },
  {name: "avatar", maxCount: 1 },
  { name: "blogImage", maxCount: 1 }
]);

// ✅ Middleware for handling upload errors
const uploadMiddleware = (req, res, next) => {
  upload(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      console.error("Multer error:", err);
      return res.status(400).json({ error: `Multer error: ${err.message}` });
    } else if (err) {
      console.error("S3 Upload Error:", err);
      return res.status(500).json({ error: `S3 upload error: ${err.message}` });
    }
    next(); // Proceed if no errors
  });
};

module.exports = uploadMiddleware;
