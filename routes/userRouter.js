const router = require("express").Router();
const auth = require("../middleware/auth");
const userCtrl = require("../controllers/userCtrl");
const uploadMiddleware = require("../middleware/uploadMiddleware");

router.get("/search", auth, userCtrl.searchUser);

router.get("/user/:id", userCtrl.getUser);

router.get("/user", userCtrl.getAllUsers);

router.patch("/user", uploadMiddleware, auth, userCtrl.updateUser);

router.patch("/user/:id/follow", auth, userCtrl.follow);
router.patch("/user/:id/unfollow", auth, userCtrl.unfollow);

router.get("/suggestionsUser", auth, userCtrl.suggestionsUser);

module.exports = router;
