const jwt = require("jsonwebtoken");
const Brand = require("../models/BrandModel");

const authenticateBrand = async (req, res, next) => {
  try {
   
    const token = req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
      console.log("No token found");
      return res.status(401).json({ msg: "Authentication token is missing" });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);

    if (!decoded) {
      console.log("Token verification failed");
      return res.status(401).json({ msg: "Invalid or expired token" });
    }

    // Find brand by decoded token ID
    const brand = await Brand.findById(decoded._id);

    if (!brand) {
      console.log("Brand not found");
      return res.status(404).json({ msg: "Brand not found" });
    }

    req.brand = brand; // Attach brand to request
    console.log("Authenticated brand:", brand);
    next(); // Continue to next middleware or route handler
  } catch (err) {
    console.error("Error during authentication:", err);
    return res
      .status(401)
      .json({ msg: "Invalid or expired token", error: err });
  }
};

module.exports = authenticateBrand;
