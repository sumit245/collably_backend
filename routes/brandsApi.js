/**
 * Express router for brand-related API endpoints
 * 
 * Provides routes for brand operations including:
 * - Creating a new brand
 * - Brand login
 * - Retrieving all brands
 * - Retrieving a specific brand by ID
 * - Updating a brand
 * - Deleting a brand
 * 
 * Uses upload middleware for handling file uploads related to brands
 * Depends on brandController for handling the logic of each route
 * 
 * @module brandsApi
 */

const router = require("express").Router()
const brandController = require("../controllers/brandController")
const upload = require("../middleware/uploadMiddleware")


router.post("/createbrand", upload('brands'), brandController.createBrand);
router.post("/brandlogin", brandController.login);
router.get("/brands", brandController.getAllBrands);
router.get("/brand/:id", brandController.getBrandById);
router.put("/brands/:id", upload('brands'), brandController.updateBrand);
router.delete("/brand/:id", brandController.deleteBrand);

module.exports = router;
