const multer = require("multer");
const path = require("path");
const fs = require("fs");
require('dotenv').config();
const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
const multerS3 = require("multer-s3");

// AWS S3 Configuration
const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  }
});

// Ensure upload folders exist
const ensureUploadFolderExists = (folder) => {
  if (!fs.existsSync(folder)) {
    fs.mkdirSync(folder, { recursive: true }); // Create folder if it doesn't exist
  }
};

// Configure storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (!file) {
      return cb(new Error("No file provided"), false);
    }

    const folder = file.mimetype.startsWith("image/") ? "uploads/images" : "uploads/videos";
    console.log("Uploaded file:", file.originalname);
    ensureUploadFolderExists(folder); // Ensure folder exists
    cb(null, folder);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const s3Storage = multerS3({
  s3: s3,
  bucket: process.env.AWS_BUCKET_NAME,
  metadata: (req, file, cb) => {
    cb(null, { fieldName: file.fieldname });
  },
  key: (req, file, cb) => {
    cb(null, `uploads/${Date.now()}-${file.originalname}`);
  }
})

// File filter: Allow only images and videos
const fileFilter = (req, file, cb) => {
  if (!file) {
    return cb(new Error("No file uploaded"), false);
  }
  if (file.mimetype.startsWith("image/") || file.mimetype.startsWith("video/")) {
    cb(null, true);
  } else {
    cb(new Error("Invalid file type. Only images and videos are allowed."), false);
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
  uploadToS3(req, res, (err) => {
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

//modify the code now to take directory name and file name as argument and then return the path to api
// so that api can save the complete path to mongodb
const uploadToS3 = multer({
  storage: s3Storage,
  fileFilter,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB max file size
}).array("media", 5);


module.exports = uploadMiddleware;
// default export 
