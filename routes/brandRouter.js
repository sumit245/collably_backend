const express = require("express");
const multer = require("multer");
const path = require("path");
const brandController = require("../controllers/brandCtrl");
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
  "/brands",
  upload.single("brandLogo"),
  brandController.createBrand
);


router.post("/brandlogin", brandController.login);
router.get("/brands", brandController.getAllBrands);
router.get("/brand/:id", brandController.getBrandById);


router.put(
  "/brands/:id",
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

router.delete("/brands/:id", (req, res, next) => {
  const { id } = req.params;
  if (!isValidObjectId(id)) {
    return res.status(400).json({ message: "Invalid ObjectId format" });
  }
  next();
},
  brandController.deleteBrand
);

module.exports = router;
