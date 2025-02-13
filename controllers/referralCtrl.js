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

    // Query the Users collection to get the username (Use 'Users' instead of 'User')
    const user = await Users.findById(userId); // Corrected here
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const username = user.username; // Assuming 'username' is the field in your User model

    let urlParts = productUrl.split("?")[0];
    let path = urlParts.substring(urlParts.indexOf("https://") + 8);

    const referralCode = generateReferralCode();

    // Check if the referral code already exists
    const existingReferral = await Referral.findOne({ referralCode });
    if (existingReferral) {
      return res.status(400).json({ message: "Referral code already exists" });
    }

    const referralLink = `collably//${path}//${referralCode}`;

    // Create the new referral
    const referral = new Referral({
      userId,
      username, // Include the username here
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
      username, // Return the username in the response
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
    // Fetch all referrals and populate the 'userId' field with the username from the User model
    const referrals = await Referral.find()
      .populate("userId", "username") // Populating the 'userId' field with 'username'
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
