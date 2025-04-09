const express = require("express");
const path = require("path");
const brandController = require("../controllers/brandController");
const upload = require("../middleware/uploadMiddleware");
const uploadMiddleware = require("../middleware/uploadMiddleware");
const mongoose = require("mongoose");
const { isValidObjectId } = require("mongoose");

const router = express.Router();

const validateObjectId = (req, res, next) => {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ message: "Invalid ObjectId format" });
    }
    next();
};


router.post("/createbrand", uploadMiddleware, brandController.createBrand);


router.post("/brandlogin", brandController.login);
router.get("/brands", brandController.getAllBrands);
router.get("/brand/:id", brandController.getBrandById);


router.put(
    "/brands/:id",
    uploadMiddleware,
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
