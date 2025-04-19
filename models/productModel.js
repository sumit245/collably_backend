const mongoose = require("mongoose");

const ProductSchema = new mongoose.Schema(
  {
    brandId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Brand",
      required: true,
    },
    productname: { type: String, required: true },
    description: { type: String, required: true },
    price: { type: Number, required: true },
    quantity: { type: Number, required: true },
    category: { type: String, required: true },
    productPhotos: [String], 
  },
  { timestamps: true }
);

module.exports = mongoose.model("Product", ProductSchema);
