const express = require("express");
const path = require("path");
const brandController = require("../controllers/brandCtrl");
const upload = require("../middleware/uploadMiddleware");
const mongoose = require("mongoose");

const router = express.Router();

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);


router.post("/createbrand", upload, brandController.createBrand);


router.post("/brandlogin", brandController.login);
router.get("/brands", brandController.getAllBrands);
router.get("/brand/:id", brandController.getBrandById);


router.put(
  "/brands/:id",
  upload,
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
