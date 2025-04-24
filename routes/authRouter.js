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
router.get("/auth/instagram/callback",
  passport.authenticate("facebook", { failureRedirect: "/login", session: false }),
  async (req, res) => {
    const logs = [];
    try {
      const { accessToken, profile } = req.user;

      logs.push("✅ Facebook login successful");

      const pagesRes = await fetch(`https://graph.facebook.com/v19.0/me/accounts?access_token=${accessToken}`);
      const pagesData = await pagesRes.json();

      if (!pagesData.data || pagesData.data.length === 0) {
        logs.push("❌ No pages found.");
        return res.json({ success: false, message: "No pages found", logs });
      }

      const posts = [];

      for (const page of pagesData.data) {
        const pageToken = page.access_token;
        const pageName = page.name;

        const igRes = await fetch(`https://graph.facebook.com/v19.0/${page.id}?fields=instagram_business_account&access_token=${pageToken}`);
        const igData = await igRes.json();
        const igId = igData?.instagram_business_account?.id;

        if (!igId) {
          logs.push(`❌ No IG business account linked to ${pageName}`);
          continue;
        }

        const mediaRes = await fetch(
          `https://graph.facebook.com/v19.0/${igId}/media?fields=id,caption,media_type,media_url,permalink,timestamp&access_token=${pageToken}`
        );
        const mediaData = await mediaRes.json();

        posts.push({
          pageName,
          igId,
          media: mediaData.data || [],
        });

        logs.push(`✅ Media fetched for ${pageName}`);
      }

      res.json({ success: true, profile, accessToken, posts, logs });
    } catch (err) {
      logs.push("❌ Error: " + err.message);
      console.error("Instagram Fetch Error:", err);
      res.status(500).json({ success: false, message: "Failed to fetch Instagram posts", logs });
    }
  }
);



router.get('/login', (req, res) => {
  const { INSTAGRAM_CLIENT_ID, INSTAGRAM_REDIRECT_URI } = process.env;
  const authUrl = `https://api.instagram.com/oauth/authorize?client_id=${INSTAGRAM_CLIENT_ID}&redirect_uri=${INSTAGRAM_REDIRECT_URI}&scope=user_profile,user_media&response_type=code`;
  res.redirect(authUrl);
});

// Callback - exchange code for token
router.get('/callback', async (req, res) => {
  const code = req.query.code;
  const {
    INSTAGRAM_CLIENT_ID,
    INSTAGRAM_CLIENT_SECRET,
    INSTAGRAM_REDIRECT_URI,
  } = process.env;

  try {
    const tokenRes = await fetch('https://api.instagram.com/oauth/access_token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: INSTAGRAM_CLIENT_ID,
        client_secret: INSTAGRAM_CLIENT_SECRET,
        grant_type: 'authorization_code',
        redirect_uri: INSTAGRAM_REDIRECT_URI,
        code,
      }),
    });

    const tokenData = await tokenRes.json();

    if (tokenData.access_token) {
      // Optional: Save to DB for reuse
      res.json({
        message: 'Instagram Auth Successful',
        accessToken: tokenData.access_token,
        userId: tokenData.user_id,
      });
    } else {
      res.status(400).json({ error: 'Failed to get access token', details: tokenData });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get user's Instagram posts
router.get('/media', async (req, res) => {
  const { access_token } = req.query; // OR retrieve from DB

  if (!access_token) return res.status(400).json({ error: 'Access token required' });

  try {
    const mediaRes = await fetch(`https://graph.instagram.com/me/media?fields=id,caption,media_type,media_url,permalink,timestamp,thumbnail_url,username&access_token=${access_token}`);
    const mediaData = await mediaRes.json();
    res.json(mediaData);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch Instagram media' });
  }
});
  
  
module.exports = router;