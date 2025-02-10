const multer = require("multer");
const path = require("path");


const videoStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/logos/");
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

const videoFileFilter = (req, file, cb) => {
  const allowedTypes = ["video/mp4", "video/webm", "video/ogg"];
  if (!allowedTypes.includes(file.mimetype)) {
    return cb(new Error("Only mp4, webm, or ogg videos are allowed"), false);
  }
  cb(null, true);
};

const imageStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/logos/");
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

const imageFileFilter = (req, file, cb) => {
  const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/jpg"];
  if (!allowedTypes.includes(file.mimetype)) {
    return cb(
      new Error("Only jpg, jpeg, png, or gif images are allowed"),
      false
    );
  }
  cb(null, true);
};

const uploadVideo = multer({
  storage: videoStorage,
  fileFilter: videoFileFilter,
  limits: { fileSize: 50 * 1024 * 1024 }, 
}).single("video"); 

const uploadImages = multer({
  storage: imageStorage,
  fileFilter: imageFileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, 
}).array("images", 5); 

module.exports = { uploadVideo, uploadImages };
