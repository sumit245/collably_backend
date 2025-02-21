const mongoose = require("mongoose");
const Referral = require("../models/referralModel");
const Product = require("../models/productModel");
const Users = require("../models/userModel");
const generateReferralCode = require("../utils/generateReferralCode");

// exports.createReferral = async (req, res) => {
//   try {
//     const { userId, brandId, productId } = req.body;

//     // Ensure valid ObjectId format
//     if (!mongoose.Types.ObjectId.isValid(userId)) {
//       return res.status(400).json({ message: "Invalid userId" });
//     }
//     if (!mongoose.Types.ObjectId.isValid(brandId)) {
//       return res.status(400).json({ message: "Invalid brandId" });
//     }
//     if (!mongoose.Types.ObjectId.isValid(productId)) {
//       return res.status(400).json({ message: "Invalid productId" });
//     }

//     // Step 1: Fetch product name to create the referral link
//     const product = await Product.findById(productId);
//     if (!product) {
//       return res.status(404).json({ message: "Product not found" });
//     }

//     // Step 2: Generate the 6-digit referral code
//     const referralCode = generateReferralCode(); // e.g., "abx5fg"

//     // Check if referralCode already exists
//     const existingReferral = await Referral.findOne({ referralCode });
//     if (existingReferral) {
//       return res.status(400).json({ message: "Referral code already exists" });
//     }

//     // Step 3: Create the referral link
//     const referralLink = `https://collab.ly/${product.productname.toLowerCase()}/${referralCode}`;

//     // Step 4: Create the referral object and save it
//     const referral = new Referral({
//       userId,
//       productId,
//       brandId,
//       referralCode,
//       referralLink,
//       iscount: 0,
//       expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
//     });

//     console.log("Referral to be saved:", referral);

//     await referral.save();

//     // Step 5: Return the referral data
//     res.status(201).json({
//       message: "Referral created successfully",
//       referral,
//       referralLink, // Send back the referral link
//     });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ message: "Error creating referral" });
//   }
// };

exports.createReferral = async (req, res) => {
  try {
    const { userId, productUrl } = req.body;

    // Validate the userId
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Invalid userId" });
    }

    // Query the Users collection to get the username
    const user = await Users.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const username = user.username;

    // Make sure to preserve the entire URL
    let urlParts = new URL(productUrl); // Using URL constructor ensures we get the full URL
    let baseUrl = urlParts.origin; // This will give the full domain + protocol (e.g., https://www.example.com)
    let path = urlParts.pathname; // This will give the path (e.g., /product/123)

    // Generate a unique referral code
    const referralCode = generateReferralCode();

    // Check if the referral code already exists
    const existingReferral = await Referral.findOne({ referralCode });
    if (existingReferral) {
      return res.status(400).json({ message: "Referral code already exists" });
    }

    // Construct the referral link using the full URL (base + path)
    const referralLink = `${baseUrl}${path}?referralCode=${referralCode}`;

    // Create the new referral object
    const referral = new Referral({
      userId,
      username,
      referralCode,
      referralLink,
      iscount: 0,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    });

    console.log("Referral to be saved:", referral);

    await referral.save();

    // Return the response with the referral and username
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

