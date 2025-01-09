const mongoose = require("mongoose");
const { Schema } = mongoose;

const notifySchema = new Schema(
  {
    id: mongoose.Types.ObjectId,
    user: { type: mongoose.Types.ObjectId, ref: "user" },
    recipients: [mongoose.Types.ObjectId],
    url: String,
    text: String,
    content: String,
    image: String,
<<<<<<< HEAD
    isRead: { type: Boolean, default: false },
=======
    isRead: {type:Boolean, default: false}
>>>>>>> 2a35ce108b00174719c771dcf7f53cc2128fea78
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("notify", notifySchema);
