const router = require('express').Router();
const authCtrl = require('../controllers/authCtrl');
const auth = require('../middleware/auth');
const uploadMiddleware = require("../middleware/uploadMiddleware");
const passport = require("../middleware/passport");

router.post('/register', uploadMiddleware, authCtrl.register);
router.delete('/user/:id',  authCtrl.deleteUser);
// router.post('/register-by-ig',authCtrl.igRegister)
router.post("/register_admin", authCtrl.registerAdmin);
router.post("/changePassword", auth, authCtrl.changePassword);


router.post( "/login", authCtrl.login );
router.post("/admin_login", authCtrl.adminLogin);


router.post("/logout", authCtrl.logout);

router.post("/generate_otp", authCtrl.generateOTP);  
router.post("/verify_otp", authCtrl.verifyOTP);   

router.post("/refresh_token", authCtrl.generateAccessToken);


// Start YouTube OAuth login
router.get("/auth/youtube", passport.authenticate("youtube", {
    scope: ["https://www.googleapis.com/auth/youtube.readonly", "profile", "email"]
  }));
  
  // YouTube callback
  router.get(
    "/auth/youtube/callback",
    passport.authenticate("youtube", {
      failureRedirect: "/login",
      session: false,
    }),
    (req, res) => {
      res.json({
        message: "YouTube login successful",
        user: req.user.profile,
        accessToken: req.user.accessToken,
      });
    }
  );
  router.get(
    "/auth/facebook",
    passport.authenticate("facebook", {
      scope: ["email", "pages_show_list", "instagram_basic", "pages_read_engagement"],
    })
  );
  
  // Facebook callback
  router.get(
    "/auth/facebook/callback",
    passport.authenticate("facebook", {
      failureRedirect: "/login",
      session: false,
    }),
    (req, res) => {
      const { profile, accessToken } = req.user;
      res.json({
        message: "Facebook login successful",
        profile,
        accessToken,
      });
    }
  );
  router.get("/auth/facebook/fetch", async (req, res) => {
    try {
      const token = req.query.accessToken;
  
      const response = await fetch(`https://graph.facebook.com/v19.0/me/accounts?access_token=${token}`);
      const { data: pages } = await response.json();
  
      const igAccounts = [];
  
      for (const page of pages) {
        const pageId = page.id;
        const pageToken = page.access_token;
  
        // Check if IG is linked
        const igRes = await fetch(
          `https://graph.facebook.com/v19.0/${pageId}?fields=instagram_business_account&access_token=${pageToken}`
        );
        const { instagram_business_account } = await igRes.json();
  
        if (instagram_business_account?.id) {
          const igId = instagram_business_account.id;
  
          const igDetailsRes = await fetch(
            `https://graph.facebook.com/v19.0/${igId}?fields=username,followers_count,media_count,profile_picture_url&access_token=${pageToken}`
          );
          const igDetails = await igDetailsRes.json();
  
          igAccounts.push({
            pageName: page.name,
            igDetails,
          });
        }
      }
  
      res.json({ success: true, data: igAccounts });
    } catch (error) {
      console.error("Facebook fetch error:", error);
      res.status(500).json({ success: false, error: "Failed to fetch Facebook/IG data" });
    }
  });
    
  
  
router.get("/auth/google", authCtrl.googleLogin);
router.get("/auth/google/callback", authCtrl.googleCallback);


router.get("/auth/instagram", authCtrl.instagramLogin);
router.get("/auth/instagram/callback", authCtrl.instagramCallback);



module.exports = router;
