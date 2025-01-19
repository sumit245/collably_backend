const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

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
    unique: true,
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
  password: {
    type: String,
    required: true, 
  },
});


BrandSchema.pre("save", async function (next) {
  if (this.isModified("password")) {
    this.password = await bcrypt.hash(this.password, 10);
  }
  next();
});


BrandSchema.methods.comparePassword = async function (password) {
  return await bcrypt.compare(password, this.password);
};

module.exports = mongoose.model("Brand", BrandSchema);
