require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const SocketServer = require("./socketServer");
const session = require("express-session");
const passport = require("./middleware/passport");

const corsOptions = {
  Credential: "true",
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

//#region // !Socket
const http = require("http").createServer(app);
const io = require("socket.io")(http);

io.on("connection", (socket) => {
  SocketServer(socket);
});

//#endregion

//#region // !Routes
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
app.use("/api", require("./routes/brandRouter"));
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

http.listen(port, () => {
  console.log("Listening on ", port);
});
