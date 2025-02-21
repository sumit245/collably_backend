const router = require("express").Router();
const auth = require("../middleware/auth");
const postCtrl = require("../controllers/postCtrl");
const upload = require("../middleware/uploadMiddleware");

router.post("/posts", auth, upload, postCtrl.createPost); 
router.get("/posts", postCtrl.getPosts);  //getusername

router
  .route("/post/:id")
  .patch(auth, postCtrl.updatePost)
  .get( postCtrl.getPost)
  .delete(auth, postCtrl.deletePost);

router.patch("/post/:id/like", auth, postCtrl.likePost);
router.patch("/post/:id/unlike", auth, postCtrl.unLikePost);

router.patch("/post/:id/report", auth, postCtrl.reportPost);

router.get("/user_posts/:id", auth, postCtrl.getUserPosts);  //done

router.get("/post_discover", auth, postCtrl.getPostDiscover);

router.patch("/savePost/:id", auth, postCtrl.savePost);
router.patch("/unSavePost/:id", auth, postCtrl.unSavePost);
router.get("/getSavePosts", auth, postCtrl.getSavePost);

module.exports = router;
