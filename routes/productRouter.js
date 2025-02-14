const express = require("express");
const router = express.Router();
const productCtrl = require("../controllers/productCtrl");

router.post("/create/product", productCtrl.createProduct);
router.get( "/getallproducts", productCtrl.getProducts ); 
router.get("/brand/products", productCtrl.getBrandProducts);
router.get("/product/:id", productCtrl.getProductById);
router.put("/updateproduct/:id", productCtrl.updateProduct);
router.delete("/deleteproduct/:id", productCtrl.deleteProduct);

module.exports = router;
