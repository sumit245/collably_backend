// controllers/brandController.js

const Brand = require("../models/brandModel");
const path = require("path");

// Create a new brand
exports.createBrand = async (req, res) => {
  try {
    const {
      brandName,
      brandDescription,
      brandCategory,
      contactEmail,
      brandWebsite,
      brandPhoneNumber,
      socialMediaLinks,
      gstNumber,
    } = req.body;
    const brandLogo = req.file ? req.file.path : null; // Assuming logo is uploaded via Multer

    const brand = new Brand({
      brandName,
      brandLogo,
      brandDescription,
      brandCategory,
      contactEmail,
      brandWebsite,
      brandPhoneNumber,
      socialMediaLinks,
      gstNumber,
    });

    await brand.save();
    res.status(201).json({ message: "Brand created successfully", brand });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error creating brand", error: err.message });
  }
};

// Get all brands
exports.getAllBrands = async (req, res) => {
  try {
    const brands = await Brand.find();
    res.status(200).json(brands);
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error fetching brands", error: err.message });
  }
};

// Get a single brand by ID
exports.getBrandById = async (req, res) => {
  try {
    const brand = await Brand.findById(req.params.id);
    if (!brand) {
      return res.status(404).json({ message: "Brand not found" });
    }
    res.status(200).json(brand);
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error fetching brand", error: err.message });
  }
};

// Update a brand by ID
exports.updateBrand = async (req, res) => {
  try {
    const {
      brandName,
      brandDescription,
      brandCategory,
      contactEmail,
      brandWebsite,
      brandPhoneNumber,
      socialMediaLinks,
      gstNumber,
    } = req.body;
    const updatedData = {
      brandName,
      brandDescription,
      brandCategory,
      contactEmail,
      brandWebsite,
      brandPhoneNumber,
      socialMediaLinks,
      gstNumber,
    };

    if (req.file) {
      updatedData.brandLogo = req.file.path;
    }

    const brand = await Brand.findByIdAndUpdate(req.params.id, updatedData, {
      new: true,
    });
    if (!brand) {
      return res.status(404).json({ message: "Brand not found" });
    }
    res.status(200).json({ message: "Brand updated successfully", brand });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error updating brand", error: err.message });
  }
};

// Delete a brand by ID
exports.deleteBrand = async (req, res) => {
  try {
    const brand = await Brand.findByIdAndDelete(req.params.id);
    if (!brand) {
      return res.status(404).json({ message: "Brand not found" });
    }
    res.status(200).json({ message: "Brand deleted successfully" });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error deleting brand", error: err.message });
  }
};
