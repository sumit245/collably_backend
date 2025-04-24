require("dotenv").config();
const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const InstagramStrategy = require("passport-instagram").Strategy;

passport.use(
  "google",
  new GoogleStrategy(
    {
      clientID: process.env.CLIENT_ID,
      clientSecret: process.env.CLIENT_SECRET,
      callbackURL: "http://127.0.0.1:5000/api/auth/google/callback",
    },
    (accessToken, refreshToken, profile, callback) => {
      console.log("Google Profile:", profile);
    }
  )
);

passport.use(
  "instagram",
  new InstagramStrategy(
    {
      clientID: process.env.APP_ID,
      clientSecret: process.env.APP_SECRET,
      callbackURL: "http://localhost:5000/api/auth/instagram/callback",
    },
    (accessToken, refreshToken, profile, done) => {
      console.log("✅ Instagram Access Token:", accessToken);
      console.log("✅ Instagram Profile:", profile);
      // Send the user object to req.user
      return done(null, { accessToken, profile });
    }
  )
);


// required for session support
passport.serializeUser((user, done) => {
  done(null, user);
});

passport.deserializeUser((user, done) => {
  done(null, user);
});

module.exports = passport;