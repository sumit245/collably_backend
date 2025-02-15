const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Ensure upload folders exist
const ensureUploadFolderExists = (folder) => {
  if (!fs.existsSync(folder)) {
    fs.mkdirSync(folder, { recursive: true }); // Create folder if it doesn't exist
  }
};

// Configure storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const folder = file.mimetype.startsWith("image/") ? "uploads/images" : "uploads/videos";
    ensureUploadFolderExists(folder); // Ensure folder exists
    cb(null, folder);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

// File filter: Allow only images and videos
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image/") || file.mimetype.startsWith("video/")) {
    cb(null, true);
  } else {
    cb(new Error("Invalid file type. Only images and videos are allowed."), false);
  }
};

// Multer configuration for a single "media" field
const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB max file size
}).array("media", 5); // Accepts multiple images or one video under "media"

module.exports = upload;
