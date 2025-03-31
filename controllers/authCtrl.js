const Users = require("../models/userModel");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const passport = require("../middleware/passport");
const OTP = require("../models/otpModel");

const generateOTP = () => Math.floor(100000 + Math.random() * 900000); // 6-digit OTP
const OTP_EXPIRY_TIME = 5 * 60 * 1000; // 5 minutes
const RESEND_OTP_WAIT_TIME = 1 * 60 * 1000; // 1 minute

const authCtrl = {
  googleLogin: passport.authenticate("google", {
    scope: ["profile", "email"],
  }),

  googleCallback: async (req, res) => {
    passport.authenticate("google", {
      failureRedirect: "/auth/google",
    })(req, res, async () => {
      console.log("Google user data:", req);
      // try {
      //   const { email, name, id } = req.user;

      //   let user = await Users.findOne({ email });
      //   if (!user) {
      //     user = new Users({
      //       fullname: name,
      //       username: name.toLowerCase(),
      //       email,
      //       password: "",
      //       googleId: id,
      //     });
      //     await user.save();
      //   }

      //   const access_token = createAccessToken({ id: user._id });
      //   const refresh_token = createRefreshToken({ id: user._id });

      //   res.cookie("refreshtoken", refresh_token, {
      //     httpOnly: true,
      //     path: "/api/refresh_token",
      //     maxAge: 30 * 24 * 60 * 60 * 1000,
      //   });

      //   res.json({
      //     msg: "Login Successful!",
      //     access_token,
      //     user: {
      //       ...user._doc,
      //       password: "",
      //     },
      //   });
      // } catch (err) {
      //   return res.status(500).json({ msg: err.message });
      // }
    });
  },

  instagramLogin: passport.authenticate("instagram", {
    scope: ["user_profile", "user_media"],
  }),

  instagramCallback: (req, res) => {
    passport.authenticate("instagram", {
      failureRedirect: "/login",
    })(req, res, () => {
      res.redirect("/profile");
    });
  },

  // User registration route
  register: async (req, res) => {
    try {
      const { fullname, username, email, contactNumber, password, gender } =
        req.body;

      let newUserName = username.toLowerCase().replace(/ /g, "");

      const user_name = await Users.findOne({ username: newUserName });
      if (user_name) {
        return res.status(400).json({ msg: "This username is already taken." });
      }

      const user_email = await Users.findOne({ email });
      if (user_email) {
        return res
          .status(400)
          .json({ msg: "This email is already registered." });
      }

      const user_mobile = await Users.findOne({ contactNumber });
      if (user_mobile) {
        return res
          .status(400)
          .json({ msg: "This mobile number is already registered." });
      }

      if (password.length < 6) {
        return res
          .status(400)
          .json({ msg: "Password must be at least 6 characters long." });
      }

      const passwordHash = await bcrypt.hash(password, 12);

      const newUser = new Users({
        fullname,
        username: newUserName,
        email,
        contactNumber,
        password: passwordHash,
        gender,
      });

      const access_token = createAccessToken({ id: newUser._id });
      const refresh_token = createRefreshToken({ id: newUser._id });

      res.cookie("refreshtoken", refresh_token, {
        httpOnly: true,
        path: "/api/refresh_token",
        maxAge: 30 * 24 * 60 * 60 * 1000, //validity of 30 days
      });

      await newUser.save();

      res.json({
        msg: "Registered Successfully!",
        access_token,
        user: {
          ...newUser._doc,
          password: "",
        },
      });
    } catch (err) {
      return res.status(500).json({ msg: err.message });
    }
  },

  // Change password route
  changePassword: async (req, res) => {
    try {
      const { oldPassword, newPassword } = req.body;

      const user = await Users.findOne({ _id: req.user._id });

      const isMatch = await bcrypt.compare(oldPassword, user.password);
      if (!isMatch) {
        return res.status(400).json({ msg: "Your password is wrong." });
      }

      if (newPassword.length < 6) {
        return res
          .status(400)
          .json({ msg: "Password must be at least 6 characters long." });
      }

      const newPasswordHash = await bcrypt.hash(newPassword, 12);

      await Users.findOneAndUpdate(
        { _id: req.user._id },
        { password: newPasswordHash }
      );

      res.json({ msg: "Password updated successfully." });
    } catch (err) {
      return res.status(500).json({ msg: err.message });
    }
  },

  // Admin registration route
  registerAdmin: async (req, res) => {
    try {
      const { fullname, username, email, password, gender, role } = req.body;

      let newUserName = username.toLowerCase().replace(/ /g, "");

      const user_name = await Users.findOne({ username: newUserName });
      if (user_name) {
        return res.status(400).json({ msg: "This username is already taken." });
      }

      const user_email = await Users.findOne({ email });
      if (user_email) {
        return res
          .status(400)
          .json({ msg: "This email is already registered." });
      }

      if (password.length < 6) {
        return res
          .status(400)
          .json({ msg: "Password must be at least 6 characters long." });
      }

      const passwordHash = await bcrypt.hash(password, 12);

      const newUser = new Users({
        fullname,
        username: newUserName,
        email,
        password: passwordHash,
        gender,
        role,
      });

      await newUser.save();

      res.json({ msg: "Admin Registered Successfully." });
    } catch (err) {
      return res.status(500).json({ msg: err.message });
    }
  },

  // User login route
  login: async (req, res) => {
    try {
      const { email, contactNumber, password } = req.body;

      let user;

      // Check if the login is by email or contact number
      if (email) {
        user = await Users.findOne({ email, role: "user" }).populate(
          "followers following",
          "-password"
        );
      } else if (contactNumber) {
        user = await Users.findOne({
          contactNumber,
          role: "user",
        }).populate("followers following", "-password");

        // Skip the password check if logging in with contact
        if (!user) {
          return res.status(400).json({ msg: "Contact number is incorrect." });
        }
      }

      // If no user is found with the provided email or contact number
      if (!user) {
        return res
          .status(400)
          .json({ msg: "Email or Contact number is incorrect." });
      }

      // Check password only when logging in with email
      if (email) {
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
          return res.status(400).json({ msg: "Password is incorrect." });
        }
      }

      const access_token = createAccessToken({ id: user._id });
      const refresh_token = createRefreshToken({ id: user._id });

      res.cookie("refreshtoken", refresh_token, {
        httpOnly: true,
        path: "/api/refresh_token",
        sameSite: "lax",
        maxAge: 30 * 24 * 60 * 60 * 1000, // validity of 30 days
      });

      res.json({
        msg: "Logged in Successfully!",
        access_token,
        user: {
          ...user._doc,
          password: "", // Don't return the password in the response
        },
      });
    } catch (err) {
      return res.status(500).json({ msg: err.message });
    }
  },

  generateOTP: async (req, res) => {
    try {
      const { contactNumber } = req.body;

      const user = await Users.findOne({ contactNumber, role: "user" });
      if (!user) {
        return res
          .status(400)
          .json({ msg: "Contact number is not registered." });
      }

      const existingOTP = await OTP.findOne({ contactNumber });

      if (existingOTP) {
        const timeSinceLastOTP = Date.now() - existingOTP.createdAt.getTime();
        if (timeSinceLastOTP < RESEND_OTP_WAIT_TIME) {
          return res
            .status(400)
            .json({ msg: "Please wait before requesting a new OTP." });
        }
        await OTP.deleteOne({ contactNumber });
      }

      const otp = generateOTP();
      const expiry = Date.now() + OTP_EXPIRY_TIME;

      await OTP.create({ contactNumber, otp, expiry });

      console.log("Generated OTP:", otp); 

      res.json({
        msg: "OTP sent successfully. Check the console for testing.",
      });
    } catch (err) {
      return res.status(500).json({ msg: err.message });
    }
  },

  // Verify OTP and login
  verifyOTP: async (req, res) => {
    try {
      const { contactNumber, otp } = req.body;

      const otpRecord = await OTP.findOne({ contactNumber });

      if (!otpRecord || otpRecord.otp !== otp) {
        return res.status(400).json({ msg: "Invalid OTP." });
      }

      if (Date.now() > otpRecord.expiry) {
        return res.status(400).json({ msg: "OTP expired." });
      }

      const user = await Users.findOne({
        contactNumber,
        role: "user",
      }).populate("followers following", "-password");

      const access_token = createAccessToken({ id: user._id });
      const refresh_token = createRefreshToken({ id: user._id });

      res.cookie("refreshtoken", refresh_token, {
        httpOnly: true,
        path: "/api/refresh_token",
        sameSite: "lax",
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      });

      res.json({
        msg: "Logged in Successfully!",
        access_token,
        user: { ...user._doc, password: "" },
      });

      // Delete OTP after successful verification
      await OTP.deleteOne({ contactNumber });
    } catch (err) {
      return res.status(500).json({ msg: err.message });
    }
  },

  // Admin login route
  adminLogin: async (req, res) => {
    try {
      const { email, password } = req.body;

      const user = await Users.findOne({ email, role: "admin" });

      if (!user) {
        return res.status(400).json({ msg: "Email or Password is incorrect." });
      }

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(400).json({ msg: "Email or Password is incorrect." });
      }

      const access_token = createAccessToken({ id: user._id });
      const refresh_token = createRefreshToken({ id: user._id });

      res.cookie("refreshtoken", refresh_token, {
        httpOnly: true,
        path: "/api/refresh_token",
        maxAge: 30 * 24 * 60 * 60 * 1000, //validity of 30 days
      });

      res.json({
        msg: "Logged in Successfully!",
        access_token,
        user: {
          ...user._doc,
          password: "",
        },
      });
    } catch (err) {
      return res.status(500).json({ msg: err.message });
    }
  },

  // Logout route
  logout: async (req, res) => {
    try {
      res.clearCookie("refreshtoken", { path: "/api/refresh_token" });
      return res.json({ msg: "Logged out Successfully." });
    } catch (err) {
      return res.status(500).json({ msg: err.message });
    }
  },

  generateAccessToken: async (req, res) => {
    try {
      const rf_token = req.cookies.refreshtoken;

      if (!rf_token) {
        return res.status(400).json({ msg: "Please login again." });
      }
      jwt.verify(
        rf_token,
        process.env.REFRESH_TOKEN_SECRET,
        async (err, result) => {
          if (err) {
            return res.status(400).json({ msg: "Please login again." });
          }

          const user = await Users.findById(result.id)
            .select("-password")
            .populate("followers following", "-password");

          if (!user) {
            return res.status(400).json({ msg: "User does not exist." });
          }

          const access_token = createAccessToken({ id: result.id });
          res.json({ access_token, user });
        }
      );
    } catch (err) {
      return res.status(500).json({ msg: err.message });
    }
  },
};

// Helper functions to create access and refresh tokens
const createAccessToken = (payload) => {
  return jwt.sign(payload, process.env.ACCESS_TOKEN_SECRET, {
    expiresIn: "1d",
  });
};

const createRefreshToken = (payload) => {
  return jwt.sign(payload, process.env.REFRESH_TOKEN_SECRET, {
    expiresIn: "30d",
  });
};

module.exports = authCtrl;
