const mongoose = require("mongoose");

const referralSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  referralCode: {
    type: String,
    required: true,
    unique: true,
  },
  referredBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Referral",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Referral = mongoose.model("Referral", referralSchema);

module.exports = Referral;
