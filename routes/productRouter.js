const express = require("express");
const router = express.Router();
const productCtrl = require("../controllers/productCtrl");
const ShopifyProducts = require("../controllers/syncShopifyProducts");
const uploadMiddleware = require("../middleware/uploadMiddleware");

router.post("/create/product", uploadMiddleware, productCtrl.createProduct);
router.get("/getallproducts", productCtrl.getProducts);
router.get("/brand/products", productCtrl.getBrandProducts);
router.get("/product/:id", productCtrl.getProductById);
router.put("/updateproduct/:id", uploadMiddleware, productCtrl.updateProduct);
router.delete("/deleteproduct/:id", productCtrl.deleteProduct);
router.get("/shopify/sync", ShopifyProducts.syncShopifyProducts);
router.get("/fetch/shopify", ShopifyProducts.ShopifyProducts);
router.post("/order/shopify", ShopifyProducts.createOrderAndSyncShopify);
router.get("/shopify/product/:id", ShopifyProducts.getShopifyProductById);
module.exports = router;
