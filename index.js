const Referral = require('./models/referralModel');  

require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const SocketServer = require("./socketServer");
const session = require("express-session");
const passport = require("./middleware/passport");
// const passport = require('passport');
const corsOptions = {
  credentials: "true",
  origin: "*",
};

const app = express();

app.use(cors(corsOptions));
app.use(express.json());

app.options("*", cors(corsOptions));
// app.use(cors(corsOptions)); 
app.use(cookieParser());
app.use(
  session({
    secret: process.env.ACCESS_TOKEN_SECRET,
  })
);
app.use(passport.initialize());
app.use(passport.session());
app.use("/uploads", express.static("uploads"));
app.use("/uploads", express.static("uploads"));

//#region // !Socket
const http = require("http").createServer(app);
const io = require("socket.io")(http);

io.on("connection", (socket) => {
  SocketServer(socket);
});

//#endregion

//#region // !Routes

app.use("/api", require("./routes/blogRouter"));
app.use("/api", require("./routes/authRouter"));
app.use("/api", require("./routes/userRouter"));
app.use("/api", require("./routes/postRouter"));
app.use("/api", require("./routes/commentRouter"));
app.use("/api", require("./routes/adminRouter"));
app.use("/api", require("./routes/notifyRouter"));
app.use("/api", require("./routes/messageRouter"));
app.use("/api", require("./routes/productRouter"));
app.use("/api", require("./routes/referralRouter"));
app.use("/api", require("./routes/orderRouter"));
app.use("/api", require("./routes/brandsApi"));
app.get('/:username/:referralCode', async (req, res) => {
  try {
    const referralCode = req.params.referralCode;

    console.log('Redirect request for referral code:', referralCode);

    // Just find by referralCode (ignore username)
    const referral = await Referral.findOne({ referralCode });

    if (!referral) {
      console.log('Referral not found');
      return res.status(404).send('Referral not found');
    }

    console.log('Redirecting to:', referral.actualLink);
    return res.redirect(referral.actualLink);
  } catch (err) {
    console.error('Redirect route error:', err);
    return res.status(500).send('Error redirecting referral');
  }
});




//#endregion

// Passport setup
// require(".//middleware/passport");

const URI = process.env.MONGODB_URL;
mongoose
  .connect(URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("Database Connected!!");
  })
  .catch((err) => {
    console.error("Error connecting to the database:", err);
  });

const port = process.env.PORT || 5000;

app.listen(port, () => {
  console.log("Listening on ", port);
});
