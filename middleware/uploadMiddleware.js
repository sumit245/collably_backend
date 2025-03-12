const multer = require("multer");
const multerS3 = require("multer-s3");
const AWS = require("aws-sdk");
const path = require("path");

// Set up AWS S3 configuration
const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_DEFAULT_REGION,
});

// Configure multer storage to upload directly to S3
const storage = multerS3({
  s3: s3,
  bucket: process.env.AWS_BUCKET, // Your S3 Bucket name
  acl: "public-read",
  metadata: (req, file, cb) => {
    cb(null, { fieldName: file.fieldname });
  },
  key: (req, file, cb) => {
    // Generate a unique key for the file in S3
    const fileExtension = path.extname(file.originalname);
    const uniqueKey = Date.now() + fileExtension; // Ensuring the file name is unique
    cb(null, `media/${uniqueKey}`);
  },
});

// File filter to only allow image/video files
const fileFilter = (req, file, cb) => {
  if (
    file.mimetype.startsWith("image/") ||
    file.mimetype.startsWith("video/")
  ) {
    cb(null, true);
  } else {
    cb(
      new Error("Invalid file type. Only images and videos are allowed."),
      false
    );
  }
};

// Multer configuration for multiple file uploads (max 5 files)
const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB max file size
}).array("media", 5); // Accepts multiple images or one video under "media"

// Middleware wrapper to catch errors
const uploadMiddleware = (req, res, next) => {
  upload(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      // Multer-specific errors (e.g., unexpected field, too many files)
      return res.status(400).json({ error: `Multer error: ${err.message}` });
    } else if (err) {
      // Other errors (e.g., invalid file type, no file uploaded)
      return res.status(400).json({ error: err.message });
    }
    next(); // Proceed if no errors
  });
};

module.exports = uploadMiddleware;
