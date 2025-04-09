const express = require("express");
const router = express.Router();
const productCtrl = require("../controllers/productCtrl");
const uploadMiddleware = require("../middleware/uploadMiddleware");

router.post("/create/product", uploadMiddleware, productCtrl.createProduct);
router.get("/getallproducts", productCtrl.getProducts);
router.get("/brand/products", productCtrl.getBrandProducts);
router.get("/product/:id", productCtrl.getProductById);
router.put("/updateproduct/:id", uploadMiddleware, productCtrl.updateProduct);
router.delete("/deleteproduct/:id", productCtrl.deleteProduct);

module.exports = router;
