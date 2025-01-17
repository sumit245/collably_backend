const express = require("express");
const multer = require("multer");
const path = require("path");
const brandController = require("../controllers/brandCtrl");
const mongoose = require("mongoose");

const router = express.Router();

// Utility function to check ObjectId validity
const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

// Set up Multer for file upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/logos");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({ storage });

router.post(
  "/createbrand",
  upload.single("brandLogo"),
  brandController.createBrand
);


router.post("/brandlogin", brandController.login);
router.get("/brands", brandController.getAllBrands);
router.get("/:id", brandController.getBrandById);

// Update brand by ID
router.put(
  "/:id",
  upload.single("brandLogo"),
  (req, res, next) => {
    const { id } = req.params;
    if (!isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid ObjectId format" });
    }
    next();
  },
  brandController.updateBrand
);

// Delete brand by ID
router.delete(
  "/:id",
  (req, res, next) => {
    const { id } = req.params;
    if (!isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid ObjectId format" });
    }
    next();
  },
  brandController.deleteBrand
);

module.exports = router;
