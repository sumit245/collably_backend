const mongoose = require("mongoose");
const Referral = require("../models/referralModel");
const Product = require("../models/productModel");
const generateReferralCode = require("../utils/generateReferralCode");

exports.createReferral = async (req, res) => {
  try {
    const { userId, brandId, productId } = req.body;

    // Ensure valid ObjectId format
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Invalid userId" });
    }
    if (!mongoose.Types.ObjectId.isValid(brandId)) {
      return res.status(400).json({ message: "Invalid brandId" });
    }
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({ message: "Invalid productId" });
    }

    // Step 1: Fetch product name to create the referral link
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // Step 2: Generate the 6-digit referral code
    const referralCode = generateReferralCode(); // e.g., "abx5fg"

    // Check if referralCode already exists
    const existingReferral = await Referral.findOne({ referralCode });
    if (existingReferral) {
      return res.status(400).json({ message: "Referral code already exists" });
    }

    // Step 3: Create the referral link
    const referralLink = `https://collab.ly/${product.productname.toLowerCase()}/${referralCode}`;

    // Step 4: Create the referral object and save it
    const referral = new Referral({
      userId,
      productId,
      brandId,
      referralCode,
      referralLink, // Store the generated referral link
    });

    console.log("Referral to be saved:", referral);

    await referral.save();

    // Step 5: Return the referral data
    res.status(201).json({
      message: "Referral created successfully",
      referral,
      referralLink, // Send back the referral link
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error creating referral" });
  }
};

exports.getReferralById = async (req, res) => {
  try {
    const referral = await Referral.findById(req.params.id);

    if (!referral) {
      return res.status(404).json({ message: "Referral not found" });
    }

    res.json(referral);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error fetching referral" });
  }
};

exports.getReferralByName = async (req, res) => {
  try {
    const referrals = await Referral.find({
      name: new RegExp(req.params.name, "i"),
    });

    if (referrals.length === 0) {
      return res
        .status(404)
        .json({ message: "No referrals found by that name" });
    }

    res.json(referrals);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error fetching referrals by name" });
  }
};

exports.getAllReferrals = async (req, res) => {
  // res.json({ "message": "I am hit" })
  try {
    const referrals = await Referral.find();
    res.json(referrals);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error fetching all referrals" });
  }
};

// Referral Controller
exports.getProductInfoFromReferral = async (req, res) => {
  const { productname, referralCode } = req.params;

  console.log("Entering referral logic...");
  console.log("Received referralCode:", referralCode);
  console.log("Received productname:", productname);

  try {
    // Step 1: Find the referral by referralCode
    const referral = await Referral.findOne({ referralCode });
    if (!referral) {
      return res.status(404).json({ message: `Referral not found for code: ${referralCode}` });
    }
    console.log("Referral found:", referral);

    // Step 2: Find the product associated with the referral
    const product = await Product.findById(referral.productId);
    if (!product) {
      return res.status(404).json({ message: `Product not found for referral` });
    }
    console.log("Product found:", product);

    // Step 3: Compare product names (case insensitive)
    if (product.productname.toLowerCase() !== productname.toLowerCase()) {
      return res.status(404).json({ message: `Product name mismatch: Expected '${productname}', but got '${product.productname}'` });
    }

    // Step 4: Return product info if everything matches
    res.json({
      message: "Product found",
      product: {
        id: product._id,
        name: product.productname,
        description: product.description,
        price: product.price,
      },
    });

  } catch (error) {
    console.error("Error in referral logic:", error);
    res.status(500).json({ message: "Error fetching product info", error: error.message });
  }
};


