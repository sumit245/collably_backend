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
      scope: ["public_profile", "email","user_posts"],
    })
  );
  
  // Facebook callback
 // Facebook callback
router.get(
    "/auth/facebook/callback",
    passport.authenticate("facebook", {
      failureRedirect: "/login",
      session: false,
    }),
    async (req, res) => {
      try {
        const { profile, accessToken } = req.user;
  
        // 🔥 Fetch Facebook user posts directly from backend
        const postsResponse = await fetch(
          `https://graph.facebook.com/me/posts?fields=id,message,story,created_time,full_picture,permalink_url&access_token=${accessToken}`
        );
  
        const postsData = await postsResponse.json();
  
        res.json({
          message: "Facebook login successful",
          profile,
          accessToken,
          posts: postsData.data, // <-- direct post array
        });
      } catch (err) {
        console.error("Error fetching user posts:", err);
        res.status(500).json({ error: "Failed to fetch user posts." });
      }
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


router.get("/auth/instagram", passport.authenticate("facebook"));

// IG Callback
router.get(
    "/auth/instagram/callback",
    passport.authenticate("facebook", { failureRedirect: "/login", session: false }),
    async (req, res) => {
      try {
        const { accessToken, profile } = req.user;
  
        const posts = [];
        const debugLogs = [];
  
        // Step 1: Get Pages linked to user
        const pagesRes = await fetch(`https://graph.facebook.com/v19.0/me/accounts?access_token=${accessToken}`);
        const pagesData = await pagesRes.json();
  
        if (!pagesData.data || pagesData.data.length === 0) {
          return res.json({
            message: "Facebook login successful",
            profile,
            accessToken,
            posts: [],
            debug: "No Facebook Pages found. Make sure your IG account is linked to a Facebook Page.",
          });
        }
  
        // Step 2: Loop through Pages
        for (const page of pagesData.data) {
          const pageToken = page.access_token;
  
          // Step 3: Get IG business account ID
          const igRes = await fetch(
            `https://graph.facebook.com/v19.0/${page.id}?fields=instagram_business_account&access_token=${pageToken}`
          );
          const igData = await igRes.json();
          const igId = igData?.instagram_business_account?.id;
  
          if (!igId) {
            debugLogs.push(`Page "${page.name}" has no linked IG account`);
            continue;
          }
  
          // Step 4: Get IG Username
          const usernameRes = await fetch(
            `https://graph.facebook.com/v19.0/${igId}?fields=username&access_token=${pageToken}`
          );
          const usernameData = await usernameRes.json();
          const igUsername = usernameData?.username || null;
  
          // Step 5: Get IG media
          const mediaRes = await fetch(
            `https://graph.facebook.com/v19.0/${igId}/media?fields=id,caption,media_type,media_url,permalink,timestamp&access_token=${pageToken}`
          );
          const mediaData = await mediaRes.json();
  
          if (!mediaData.data || mediaData.data.length === 0) {
            debugLogs.push(`No media found for IG account ${igUsername || igId}`);
          }
  
          posts.push({
            pageName: page.name,
            igId,
            igUsername,
            media: mediaData.data || [],
          });
        }
  
        res.json({
          message: "Facebook login successful",
          profile,
          accessToken,
          posts,
          debugLogs,
        });
      } catch (err) {
        console.error("Instagram Fetch Error:", err);
        res.status(500).json({ error: "Something went wrong while fetching Instagram data." });
      }
    }
  );
  
module.exports = router;
