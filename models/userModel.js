const mongoose = require("mongoose");
const { Schema } = mongoose;
const generateReferralCode = require("../utils/generateReferralCode");

const userSchema = new Schema(
  {
    fullname: {
      type: String,
      trim: true,
      maxlength: 25,
    },
    username: {
      type: String,
      trim: true,
      maxlength: 25,
      unique: true,
    },
    email: {
      type: String,
      trim: true,
      // unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    avatar: {
      type: String,
      default:
        "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460__340.png",
    },
    role: {
      type: String,
      default: "user",
    },
    googleID: {
      type: String,
      required: false,
      unique: true,
    },
    instagramID: {
      type: String,
    },
    gender: {
      type: String,
      default: "male",
    },
    contactNumber: {
      type: String,
      default: "",
      required: true,
    },
    address: {
      type: String,
      default: "",
    },
    saved: [
      {
        type: mongoose.Types.ObjectId,
        ref: "post",
      },
    ],
    story: {
      type: String,
      default: "",
      maxlength: 200,
    },
    website: {
      type: String,
      default: "",
    },
    followers: [
      {
        type: mongoose.Types.ObjectId,
        ref: "user",
      },
    ],
    following: [
      {
        type: mongoose.Types.ObjectId,
        ref: "user",
      },
    ],
    // Referral Fields:
    referralCode: {
      type: String,
      unique: true,
      default: function () {
        return generateReferralCode();
      },
    },
    referredBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user", // This will store the referrer’s userId
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("user", userSchema);
