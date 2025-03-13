const multer = require("multer");
const path = require("path");
const fs = require("fs");
require('dotenv').config();
const { S3Client } = require("@aws-sdk/client-s3");
const multerS3 = require("multer-s3");

// AWS S3 Configuration
const s3 = new S3Client({
  region: process.env.AWS_DEFAULT_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  }
});

const s3Storage = (directory) => {
  return multerS3({
    s3: s3,
    bucket: process.env.AWS_BUCKET_NAME,
    metadata: (req, file, cb) => {
      cb(null, { fieldName: file.fieldname });
    },
    key: (req, file, cb) => {
      cb(null, `${directory}/${Date.now()}/${file.originalname}`);
    }
  })
}

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

// Middleware wrapper to catch errors
const uploadMiddleware = (directory) => {
  const uploadToS3 = multer({
    storage: s3Storage(directory),
    fileFilter,
    limits: { fileSize: 50 * 1024 * 1024 }
  }).array("media", 5);
  return (req, res, next) => {
    const timeout = setTimeout(() => {
      return res.status(408).json({ error: 'Upload timeout' });
    }, 30000);

    if (!req.headers['content-type']?.includes('multipart/form-data')) {
      return res.status(400).json({ error: 'Invalid content type' });
    }

    uploadToS3(req, res, (err) => {
      clearTimeout(timeout);
      if (err) {
        return res.status(400).json({
          error: err instanceof multer.MulterError ?
            `MulterError ${err.stack} ${err.message} ${err.field}` :
            `GeneralError ${err.message}`
        });
      }

      // Add file locations to request object
      if (req.files) {
        req.media = req.files.map(file => file.location);
      }
      next();
    });
  };
}


module.exports = uploadMiddleware;
// default export 
