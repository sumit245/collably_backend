const mongoose = require("mongoose");
const Referral = require("../models/referralModel");
const Product = require("../models/productModel");
const Users = require("../models/userModel");
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
      referralLink,
      iscount: 0,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
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

exports.getReferralByCode = async (req, res) => {
  try {
    const { code } = req.params;

    // Find referral by code
    const referral = await Referral.findOne({ referralCode: code });
    if (!referral) {
      return res.status(404).json({ msg: "Referral not found" });
    }

    // Increment the clicks field by 1
    referral.clicks += 1;
    await referral.save();

    // Fetch the referred product and the user who created the referral
    const { productId, userId } = referral;
    const referredProduct = await Product.findById(productId, {
      productname: 1,
      description: 1,
      price: 1,
      category: 1,
    });
    const { productname, description, category, price } = referredProduct; //Object destructuring
    const productID = referredProduct._id;

    const referredBy = await Users.findById(userId, {
      fullname: 1,
      username: 1,
    });
    const { fullname, username } = referredBy;
    const userID = referredBy._id;
    if (referredProduct) {
      // Return the updated referral data
      res.status(200).json({
        productname,
        description,
        category,
        price,
        productID,
        fullname,
        username,
        userID,

        clicks: referral.clicks, // Send the updated click count
      });
    } else {
      res.status(404).json({
        msg: "No product linked with this referral",
      });
    }
  } catch (err) {
    console.error(err);
    res.status(500).send(err);
  }
};
