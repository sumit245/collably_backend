const Brand = require("../models/brandModel");
const jwt = require("jsonwebtoken");
const JWT_SECRET = "your_jwt_secret_key";


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
      password, 
    } = req.body;

    // Check if any file is uploaded
    const brandLogo =
      req.files && req.files.length > 0 ? req.files[0].path : null;

    // Check if brand email already exists
    const existingBrand = await Brand.findOne({ contactEmail });
    if (existingBrand) {
      return res
        .status(400)
        .json({ message: "Email address is already in use" });
    }

    // Create a new brand object
    const brand = new Brand({
      brandName,
      brandLogo, // Store logo path if uploaded
      brandDescription,
      brandCategory,
      contactEmail,
      brandWebsite,
      brandPhoneNumber,
      socialMediaLinks,
      gstNumber,
      password, 
    });

    // Save the brand to the database
    await brand.save();
    res.status(201).json({ message: "Brand created successfully", brand });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error creating brand", error: err.message });
  }
};


// Login (authenticate brand)
exports.login = async (req, res) => {
  try {
    const { contactEmail, password } = req.body;

    const brand = await Brand.findOne({ contactEmail });
    if (!brand) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // Check if the password is correct
    const isMatch = await brand.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // Create JWT token
    const token = jwt.sign({ brandId: brand._id }, JWT_SECRET, {
      expiresIn: "1h",
    });

    // Return token and brand data
    res.status(200).json({
      message: "Login successful",
      token,
      brand: {
        brandId: brand._id,
        brandName: brand.brandName,
        brandDescription: brand.brandDescription,
        brandCategory: brand.brandCategory,
        contactEmail: brand.contactEmail,
        brandWebsite: brand.brandWebsite,
        brandPhoneNumber: brand.brandPhoneNumber,
        socialMediaLinks: brand.socialMediaLinks,
        gstNumber: brand.gstNumber,
        brandLogo: brand.brandLogo,
      },
    });
  } catch (err) {
    res.status(500).json({ message: "Error logging in", error: err.message });
  }
};


// Get all brands
exports.getAllBrands = async (req, res) => {
  try {
    console.log("Request:", req.params); // Add logging here
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
  console.log("Request Params:", req.params); // Log the incoming parameters
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

    // Set updated data
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

    // Check if a new logo is uploaded
    if (req.files && req.files.length > 0) {
      updatedData.brandLogo = req.files[0].path; // Save the new logo path
    }

    // Find and update the brand
    const brand = await Brand.findByIdAndUpdate(req.params.id, updatedData, {
      new: true, // Return the updated brand
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

// Protected route to get brand details (requires JWT)
exports.getBrandDetails = async (req, res) => {
  try {
    const brand = await Brand.findById(req.brandId);
    if (!brand) {
      return res.status(404).json({ message: "Brand not found" });
    }
    res.status(200).json(brand);
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error fetching brand details", error: err.message });
  }
};