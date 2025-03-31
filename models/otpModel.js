const mongoose = require("mongoose");

const otpSchema = new mongoose.Schema({
  contactNumber: { type: String, required: true, unique: true },
  otp: { type: String, required: true },
  expiry: { type: Date, required: true },
  createdAt: { type: Date, default: Date.now, expires: 300 } 
});

module.exports = mongoose.model("OTP", otpSchema);