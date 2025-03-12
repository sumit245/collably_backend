const mongoose = require("mongoose");
const { Schema } = mongoose;

const postSchema = new Schema(
  {
    content: { type: String, required: false },
    caption: { type: String },
    body: { type: String },
    tags: [{ type: String }],
    images: [{ type: String }], // Array of image paths
    video: { type: String }, // Single video path
    likes: [
      {
        type: mongoose.Types.ObjectId,
        ref: "user",
      },
    ],
    comments: [
      {
        type: mongoose.Types.ObjectId,
        ref: "comment",
      },
    ],
    user: {
      type: mongoose.Types.ObjectId,
      ref: "user",
    },
    reports: [
      {
        type: mongoose.Types.ObjectId,
        ref: "user",
      },
    ],
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Posts", postSchema);
