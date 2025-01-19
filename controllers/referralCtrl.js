const Referral = require("../models/referralModel");
const Product = require("../models/productModel");
const generateReferralCode = require("../utils/generateReferralCode");

exports.createReferral = async (req, res) => {
  try {
    const { userId, brandId, productId } = req.body;

    // Step 1: Fetch product name to create the referral link
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // Step 2: Generate the 6-digit referral code
    const referralCode = generateReferralCode(); // e.g., "abx5fg"

    // Step 3: Create the referral link
    const referralLink = `collably${product.productname}${referralCode}`;

    // Step 4: Create the referral object and save it
    const referral = new Referral({
      userId,
      productId,
      brandId,
      referralCode,
      referralLink, // Store the generated referral link
    });

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
