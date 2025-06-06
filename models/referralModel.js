const mongoose = require("mongoose");

const referralSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true,
    },
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      // required: true,
    },
    brandId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Brand",
      // required: true,
    },
    discount: Number,
    expiresAt: Date,
    clicks: { type: Number, default: 0 },
    conversions: { type: Number, default: 0 },

    referralKey: { type: String, default: "https://collab.ly" },
    referralCode: { type: String, required: true, unique: true },
    referralLink: {
      type: String,
      required: true,
      unique: true,
    },
    product: {
      title: String,
      price: String,
      image: String,
      url: String
    },
    actualLink: {
  type: String,
  required: true,
},

    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

const Referral = mongoose.model("Referral", referralSchema);

module.exports = Referral;
