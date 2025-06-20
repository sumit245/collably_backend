const mongoose = require("mongoose");
const Referral = require("../models/referralModel");
const Product = require("../models/productModel");
const Users = require("../models/userModel");
const Brand = require("../models/BrandModel"); // Added Brand model import
const generateReferralCode = require("../utils/generateReferralCode");

 exports.createReferral = async (req, res) => {
  try {
    const { userId, productUrl } = req.body;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Invalid userId" });
    }

    const user = await Users.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const username = user.fullname;
    const referralCode = generateReferralCode();

    const existingReferral = await Referral.findOne({ referralCode });
    if (existingReferral) {
      return res.status(400).json({ message: "Referral code already exists" });
    }

    // Build actualLink (product URL + referral params)
    const parsedUrl = new URL(productUrl);
    parsedUrl.searchParams.set("c", username);
    parsedUrl.searchParams.set("referralCode", referralCode);
    const actualLink = parsedUrl.toString();

    // Construct referral link hosted on our app
    const encodedUsername = encodeURIComponent(username);
    const referralLink = `https://collably.in/${encodedUsername}/${referralCode}`;

    // Optional: brand detection
    const brands = await Brand.find({}, "brandWebsite");
    const getDomain = url => {
      try {
        return new URL(url).hostname.replace("www.", "");
      } catch {
        return null;
      }
    };
    const productDomain = getDomain(productUrl);
    const matchedBrand = brands.find(brand => {
      const brandDomain = getDomain(brand.brandWebsite);
      return brandDomain && productDomain.includes(brandDomain);
    });
    const brandId = matchedBrand ? matchedBrand._id : null;

    const referral = new Referral({
      userId,
      brandId,
      username,
      referralCode,
      referralLink,
      actualLink, // ✅ Save full redirectable product URL here
      iscount: 0,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    });

    await referral.save();

    res.status(201).json({
      message: "Referral created successfully",
      referral,
      referralLink,
      username,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error creating referral" });
  }
};





exports.getReferralsByUserId = async (req, res) => {
  try {
    const { id } = req.params; 

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid userId" });
    }

    const referrals = await Referral.find({
      userId: new mongoose.Types.ObjectId(id),
    });

    if (referrals.length === 0) {
      return res
        .status(404)
        .json({ message: "No referrals found for this user" });
    }

    res.status(200).json(referrals);
  } catch (error) {
    console.error("Error fetching referrals:", error);
    res.status(500).json({ message: "Error fetching referrals for the user" });
  }
};

exports.getReferralsByBrandId = async (req, res) => {
  try {
    const { id } = req.params; 

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid brandId" });
    }

    const referrals = await Referral.find({
      brandId: new mongoose.Types.ObjectId(id),
    }).populate("userId", "fullname") 
    .exec(); // Execute the query;

    // if (referrals.length === 0) {
    //   return res
    //     .status(404)
    //     .json({ message: "No referrals found for this Brand" });
    // }

    res.status(200).json(referrals.length ? referrals : []);
  } catch (error) {
    console.error("Error fetching referrals:", error);
    res.status(500).json({ message: "Error fetching referrals for the Brand" });
  }
};

exports.getReferralsByUserAndBrand = async (req, res) => {
  try {
    const { userId, brandId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(userId) || !mongoose.Types.ObjectId.isValid(brandId)) {
      return res.status(400).json({ message: "Invalid userId or brandId" });
    }

    const referrals = await Referral.find({
      userId: new mongoose.Types.ObjectId(userId),
      brandId: new mongoose.Types.ObjectId(brandId),
    }).populate("userId", "fullname");

    res.status(200).json(referrals.length ? referrals : []);
  } catch (error) {
    console.error("Error fetching referrals:", error);
    res.status(500).json({ message: "Error fetching referrals for the user and brand" });
  }
};

exports.getUsersByBrandId = async (req, res) => {
  try {
    const { brandId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(brandId)) {
      return res.status(400).json({ message: "Invalid brandId" });
    }

    const referrals = await Referral.find({ brandId: new mongoose.Types.ObjectId(brandId) })
      .populate("userId", "fullname email role" ) // Fetch user details
      .exec();

    // Extract unique users from referrals
    const uniqueUsers = [...new Map(referrals.map(ref => [ref.userId._id.toString(), ref.userId])).values()];

    res.status(200).json(uniqueUsers);
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ message: "Error fetching users for the brand" });
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
  try {
  
    const referrals = await Referral.find()
      .populate("userId", "fullname") 
      .exec(); // Execute the query

    if (referrals.length === 0) {
      return res.status(404).json({ message: "No referrals found" });
    }

    // Return the populated referrals with the username included
    res.status(200).json(referrals);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error fetching all referrals" });
  }
};

exports.getReferralByCode = async (req, res) => {
  try {
    const { code } = req.params;

    // Find the referral by referralCode
    const referral = await Referral.findOne({ referralCode: code });
    if (!referral) {
      return res.status(404).json({ msg: "Referral not found" });
    }

    // Increment the clicks field by 1
    referral.clicks += 1; // Increment the number of clicks
    await referral.save(); // Save the updated referral document

    // Redirect to the product page using the referral link
    const productUrl = referral.referralLink; // This is the full referral link

    if (!productUrl) {
      return res
        .status(404)
        .json({ msg: "No product URL linked with this referral" });
    }

    // Return the updated referral data (you can also return the click count here)
    res.status(200).json({
      message: "Referral link clicked",
      clicks: referral.clicks, // Include the updated clicks count
      redirectUrl: productUrl, // Return the referral link as a redirect URL
    });

    // Optionally, you can redirect the user:
    // res.redirect(productUrl);
  } catch (err) {
    console.error(err);
    res.status(500).send(err);
  }
};

exports.getReferralClicks = async (req, res) => {
  try {
    const { code } = req.params;

    // Find the referral by code
    const referral = await Referral.findOne({ referralCode: code });
    if (!referral) {
      return res.status(404).json({ message: "Referral not found" });
    }

    // Return the clicks count
    res.status(200).json({
      referralCode: referral.referralCode,
      clicks: referral.clicks, // Show the number of clicks
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error fetching referral clicks" });
  }
};