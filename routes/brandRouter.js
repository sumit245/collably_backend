const router = require("express").Router();
const brandController = require("../controllers/brandCtrl");

router.post("/createbrand", brandController.createBrand);


router.post("/brandlogin", brandController.login);
router.get("/brands", brandController.getAllBrands);
router.get("/brand/:id", brandController.getBrandById);


router.put("/brands/:id", brandController.updateBrand);
router.delete("/brands/:id", brandController.deleteBrand);

module.exports = router;
