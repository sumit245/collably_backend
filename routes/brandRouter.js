const express = require("express");
const multer = require("multer");
const path = require("path");
const brandController = require("../controllers/brandController");

const router = express.Router();

// Set up Multer for file upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/logos"); // Specify the folder to store the logo
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname)); // Save file with timestamp to avoid conflicts
  },
});

const upload = multer({ storage });

// Define routes
router.post(
  "/createbrand",
  upload.single("brandLogo"),
  brandController.createBrand
); // POST to create a new brand
router.get("/getallbrands", brandController.getAllBrands); 
router.get("/getbrand/:id", brandController.getBrandById); 
router.put("/:id", upload.single("brandLogo"), brandController.updateBrand); 
router.delete("/deletebrand/:id", brandController.deleteBrand); 

module.exports = router;
