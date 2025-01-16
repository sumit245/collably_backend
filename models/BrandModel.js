// models/Brand.js

const mongoose = require("mongoose");

const BrandSchema = new mongoose.Schema({
  brandName: {
    type: String,
    required: false,
  },
  brandLogo: {
    type: String,
    required: false,
  },
  brandDescription: {
    type: String,
    required: false,
  },
  brandCategory: {
    type: String,
    required: false,
  },
  contactEmail: {
    type: String,
    required: false,
    unique: false,
  },
  brandWebsite: {
    type: String,
    required: false,
  },
  brandPhoneNumber: {
    type: String,
    required: false,
  },
  socialMediaLinks: {
    type: Map,
    of: String,
    default: {},
  },
  gstNumber: {
    type: String,
    required: false,
    unique: false,
  },
});

module.exports = mongoose.model("Brand", BrandSchema);
