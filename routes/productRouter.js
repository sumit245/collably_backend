const express = require("express");
const router = express.Router();
const productCtrl = require("../controllers/productCtrl");

router.post("/create", productCtrl.createProduct);
router.get( "/", productCtrl.getProducts); 
router.get("/:id", productCtrl.getProductById);
router.put("/:id", productCtrl.updateProduct);
router.delete("/:id", productCtrl.deleteProduct);

module.exports = router;
