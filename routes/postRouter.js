/**
 * Router for handling post-related API endpoints
 * @module postRouter
 * @requires express
 * @requires ../middleware/auth
 * @requires ../controllers/postCtrl
 * @requires ../middleware/uploadMiddleware
 * 
 * @description Defines routes for creating, reading, updating, and deleting posts
 * Includes functionality for liking, unliking, reporting, and saving posts
 */
const router = require("express").Router();
const auth = require("../middleware/auth");
const postCtrl = require("../controllers/postCtrl");
const upload = require("../middleware/uploadMiddleware");

router.post("/posts", auth, upload(`posts`), postCtrl.createPost);

router.get("/posts", postCtrl.getPosts);  //getusername

router
  .route("/post/:id")
  .patch(auth, postCtrl.updatePost)
  .get(postCtrl.getPost)
  .delete(auth, postCtrl.deletePost);

router.patch("/post/:id/like", auth, postCtrl.likePost);
router.patch("/post/:id/unlike", auth, postCtrl.unLikePost);
/**
 * Route to report a post by its ID
 * @route PATCH /post/:id/report
 * @middleware auth - Requires user authentication
 * @param {string} id - The unique identifier of the post to be reported
 */
router.patch("/post/:id/report", auth, postCtrl.reportPost);

router.get("/user_posts/:id", auth, postCtrl.getUserPosts);

router.get("/post_discover", auth, postCtrl.getPostDiscover);
router.patch("/savePost/:id", auth, postCtrl.savePost);
router.patch("/unSavePost/:id", auth, postCtrl.unSavePost);
router.get("/getSavePosts", auth, postCtrl.getSavePost);

module.exports = router;
