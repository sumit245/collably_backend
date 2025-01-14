const mongoose = require("mongoose");

const ProductSchema = new mongoose.Schema(
  {
    brandname: {type: String, required: true},
    name: { type: String, required: true },
    description: { type: String, required: true },
    price: { type: Number, required: true },
    quantity: { type: Number, required: true },
    category: { type: String, required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Product", ProductSchema);
