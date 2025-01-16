// models/Brand.js

const mongoose = require("mongoose");

const BrandSchema = new mongoose.Schema({
  brandName: {
    type: String,
    required: true,
  },
  brandLogo: {
    type: String, 
    required: true,
  },
  brandDescription: {
    type: String,
    required: true,
  },
  brandCategory: {
    type: String,
    required: true,
  },
  contactEmail: {
    type: String,
    required: true,
    unique: true,
  },
  brandWebsite: {
    type: String,
    required: true,
  },
  brandPhoneNumber: {
    type: String,
    required: true,
  },
  socialMediaLinks: {
    type: Map,
    of: String, 
    default: {},
  },
  gstNumber: {
    type: String,
    required: true,
    unique: true,
  },
});

module.exports = mongoose.model("Brand", BrandSchema);
