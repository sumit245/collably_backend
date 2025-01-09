const mongoose = require("mongoose");
const { Schema } = mongoose;
<<<<<<< HEAD
=======
const generateReferralCode = require("../utils/generateReferralCode");
>>>>>>> 2a35ce108b00174719c771dcf7f53cc2128fea78

const userSchema = new Schema(
  {
    fullname: {
      type: String,
      required: true,
      trim: true,
      maxlength: 25,
    },
    username: {
      type: String,
      required: true,
      trim: true,
      maxlength: 25,
      unique: true,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      unique: true,
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
    },
    instagramID: {
      type: String,
    },
<<<<<<< HEAD

=======
>>>>>>> 2a35ce108b00174719c771dcf7f53cc2128fea78
    gender: {
      type: String,
      default: "male",
    },
    mobile: {
      type: String,
      default: "",
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
<<<<<<< HEAD
=======
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
>>>>>>> 2a35ce108b00174719c771dcf7f53cc2128fea78
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("user", userSchema);
