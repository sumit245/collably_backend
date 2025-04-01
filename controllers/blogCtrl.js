const Blog = require("../models/blogModel");
const User = require("../models/userModel");

// ✅ Upload Blog - Author is automatically assigned
exports.uploadBlog = async (req, res) => {
  try {
    console.log("📩 Received request to upload blog");

    const { title, content } = req.body;
    const userId = req.user.id; // Extracted from the auth middleware

    if (!title || !content) {
      console.log("❌ Missing title or content");
      return res.status(400).json({ msg: "Title and Content are required." });
    }

    const newBlog = new Blog({ title, content, author: userId });
    await newBlog.save();

    console.log("✅ Blog saved to database:", newBlog);
    res.json({ msg: "Blog uploaded successfully!", blog: newBlog });
  } catch (err) {
    console.log("❌ Error while uploading blog:", err);
    res.status(500).json({ msg: err.message });
  }
};

// ✅ View All Blogs (Public)
exports.viewBlogs = async (req, res) => {
    try {
      const blogs = await Blog.find()
        .populate({
          path: "author",
          model: "user", // Fix: Ensure "user" (not "User")
          select: "fullname email avatar", // Fetch only necessary fields
        })
        .sort({ createdAt: -1 });
  
      res.json({ msg: "Blogs fetched successfully!", blogs });
    } catch (err) {
      console.log("Error while fetching blogs:", err);
      res.status(500).json({ msg: err.message });
    }
  };

// ✅ Delete Blog (Only Author or Admin)
exports.deleteBlog = async (req, res) => {
  try {
    console.log("📩 Received request to delete blog");

    const blogId = req.params.id;
    const userId = req.user.id;

    // Find the blog
    const blog = await Blog.findById(blogId);
    if (!blog) {
      console.log("❌ Blog not found");
      return res.status(404).json({ msg: "Blog not found." });
    }

    // Check if the logged-in user is the author or an admin
    const user = await User.findById(userId);
    if (blog.author.toString() !== userId && user.role !== "admin") {
      console.log("❌ Unauthorized: Not the author or admin");
      return res.status(403).json({ msg: "Unauthorized. You can only delete your own blogs." });
    }

    await blog.deleteOne();
    console.log("✅ Blog deleted successfully:", blogId);

    res.json({ msg: "Blog deleted successfully!" });
  } catch (err) {
    console.log("❌ Error while deleting blog:", err);
    res.status(500).json({ msg: err.message });
  }
};

exports.getBlogById = async (req, res) => {
    try {
      const { id } = req.params; // Get blog ID from URL
  
      const blog = await Blog.findById(id).populate({
        path: "author",
        model: "user", // Ensure correct model name
        select: "username email avatar", // Fetch only required fields
      });
  
      if (!blog) {
        return res.status(404).json({ msg: "Blog not found" });
      }
  
      res.json({ msg: "Blog fetched successfully!", blog });
    } catch (err) {
      console.log("Error fetching blog:", err);
      res.status(500).json({ msg: err.message });
    }
  };