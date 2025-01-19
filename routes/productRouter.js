const express = require("express");
const router = express.Router();
const productCtrl = require("../controllers/productCtrl");

router.post("/products", productCtrl.createProduct);
router.get("/products", productCtrl.getProducts);
router.get("/products/:id", productCtrl.getProductById);
router.put("/products/:id", productCtrl.updateProduct);
router.delete("/products/:id", productCtrl.deleteProduct);

module.exports = router;
