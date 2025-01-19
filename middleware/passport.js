require("dotenv").config();
const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const InstagramStrategy = require("passport-instagram").Strategy;
const clientID = process.env.CLIENT_ID;
const clientSecret = process.env.CLIENT_SECRET;

passport.use(
  "google",
  new GoogleStrategy(
    {
      clientID: clientID,
      clientSecret: clientSecret,
      callbackURL: `http://127.0.0.1:5000/api/auth/google/callback`,
    },
    (accessToken, refreshToken, profile, callback) => {
      console.log(profile)
    }
  )
);

// passport.use(
//   "instagram",
//   new InstagramStrategy(
//     {
//       clientID: process.env.APP_ID,
//       clientSecret: process.env.APP_SECRET,
//       callbackURL: "http://localhost:5000/api/auth/instagram/callback",
//     },
//     (accessToken, refreshToken, profile, done) => {
//       done(null, profile);
//     }
//   )
// );

module.exports = passport;
