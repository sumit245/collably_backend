const mongoose = require("mongoose");

const BlogSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    content: { type: String, required: true },
    author: { type: mongoose.Schema.Types.ObjectId, ref: "user", required: true }, 
    image: {
      type: String,
      default: "", 
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Blog", BlogSchema);
