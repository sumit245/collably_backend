const mongoose = require("mongoose");
const { Schema } = mongoose;

<<<<<<< HEAD
=======

>>>>>>> 2a35ce108b00174719c771dcf7f53cc2128fea78
const postSchema = new Schema(
  {
    content: String,
    images: {
      type: Array,
      required: true,
    },
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

<<<<<<< HEAD
module.exports = mongoose.model("post", postSchema);
=======

module.exports = mongoose.model('post', postSchema);
>>>>>>> 2a35ce108b00174719c771dcf7f53cc2128fea78
