require("dotenv").config();
const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const InstagramStrategy = require("passport-instagram").Strategy;
const FacebookStrategy = require("passport-facebook").Strategy;

// Facebook Strategy
passport.use(
  new FacebookStrategy(
    {
      clientID: process.env.APP_ID,
      clientSecret: process.env.APP_SECRET,
      callbackURL: "https://newapp.collably.in/api/auth/facebook/callback",
      profileFields: ["id", "displayName", "emails"],
      scope: ["email", "public_profile", "pages_show_list", "instagram_basic", "pages_read_engagement", "instagram_content_publish"],
    },
    function (accessToken, refreshToken, profile, done) {
      return done(null, { profile, accessToken });
    }
  )
);

passport.serializeUser(function (user, done) {
  done(null, user);
});

passport.deserializeUser(function (obj, done) {
  done(null, obj);
});


// YouTube Strategy
passport.use(
  "youtube",
  new GoogleStrategy(
    {
      clientID: process.env.CLIENT_ID,
      clientSecret: process.env.CLIENT_SECRET,
      callbackURL: "http://localhost:5000/api/auth/youtube/callback",
    },
    (accessToken, refreshToken, profile, done) => {
      console.log("YouTube Profile:", profile);
      return done(null, { profile, accessToken });
    }
  )
);

// Instagram Strategy
// passport.use(
//   "instagram",
//   new InstagramStrategy(
//     {
//       clientID: process.env.INSTA_APP_ID,
//       clientSecret: process.env.INSTA_APP_SECRET,
//       callbackURL: "https://newapp.collably.in/api/auth/instagram/callback",
//     },
//     (accessToken, refreshToken, profile, done) => {
//       console.log("✅ Instagram Access Token:", accessToken);
//       console.log("✅ Instagram Profile:", profile);
//       return done(null, { accessToken, profile });
//     }
//   )
// );

// // Session handling
// passport.serializeUser((user, done) => {
//   done(null, user);
// });

// passport.deserializeUser((user, done) => {
//   done(null, user);
// });

module.exports = passport;