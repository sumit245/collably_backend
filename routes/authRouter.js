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
  
  
  
router.get("/auth/google", authCtrl.googleLogin);
router.get("/auth/google/callback", authCtrl.googleCallback);


router.get("/auth/instagram", authCtrl.instagramLogin);
router.get("/auth/instagram/callback", authCtrl.instagramCallback);



module.exports = router;
