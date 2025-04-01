const express = require("express");
// const { uploadBlog, viewBlogs } = require("../controllers/blogCtrl");
const blogCtrl =  require("../controllers/blogCtrl");
const router = express.Router();
const auth = require("../middleware/auth");

router.post("/upload", auth, blogCtrl.uploadBlog); 
router.get("/view_blogs", blogCtrl.viewBlogs); 
router.delete("/delete_blogs/:id", auth, blogCtrl.deleteBlog);
router.get("/view_blogs/:id", blogCtrl.getBlogById); 
module.exports = router;
