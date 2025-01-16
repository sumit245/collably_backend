const express = require("express");
const multer = require("multer");
const path = require("path");
const brandController = require("../controllers/brandCtrl");

const router = express.Router();

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
router.get("/getallbrands", brandController.getAllBrands); 
router.get("/getbrand/:id", brandController.getBrandById); 
router.put("/:id", upload.single("brandLogo"), brandController.updateBrand); 
router.delete("/deletebrand/:id", brandController.deleteBrand); 

module.exports = router;
