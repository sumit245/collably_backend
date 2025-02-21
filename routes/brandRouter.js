const express = require("express");
const multer = require("multer");
const path = require("path");
const brandController = require("../controllers/BrandCtrl");
const mongoose = require("mongoose");

const router = express.Router();

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

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
router.get("/brand/:id", brandController.getBrandById);


router.put(
  "/brandupdate/:id",
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

router.delete("/brand/:id", (req, res, next) => {
  const { id } = req.params;
  if (!isValidObjectId(id)) {
    return res.status(400).json({ message: "Invalid ObjectId format" });
  }
  next();
},
  brandController.deleteBrand
);

module.exports = router;
