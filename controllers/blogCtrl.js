const Blog = require("../models/blogModel");
const User = require("../models/userModel");

// ✅ Upload Blog - Author is automatically assigned
exports.uploadBlog = async (req, res) => {
  try {
    console.log("📩 Received request to upload blog");

    const { title, content, category } = req.body;
    const userId = req.user.id;

    if (!title || !content) {
      return res.status(400).json({ msg: "Title and Content are required." });
    }

    // ✅ Handle image upload like brandLogo
    let blogImage = null;
    if (req.files && req.files.blogImage && req.files.blogImage.length > 0) {
      blogImage = req.files.blogImage[0].location; // S3 image URL (from multerS3)
    }

    // ✅ Create new blog entry
    const newBlog = new Blog({
      title,
      content,
      author: userId,
      category,
      image: blogImage, // Store image URL
    });

    await newBlog.save();

    console.log("✅ Blog saved to database:", newBlog);
    res.json({ msg: "Blog uploaded successfully!", blog: newBlog });
  } catch (err) {
    console.error("❌ Error while uploading blog:", err);
    res.status(500).json({ msg: err.message });
  }
};

exports.updateBlog = async (req, res) => {
  try {
    const blogId = req.params.id;
    const userId = req.user.id;

    console.log("🛠️ Received update request for blog:", blogId);
    console.log("📦 Body:", req.body);
    console.log("🖼️ Files:", req.files);

    const blog = await Blog.findById(blogId);
    if (!blog) {
      console.log("❌ Blog not found");
      return res.status(404).json({ msg: "Blog not found." });
    }

    if (blog.author.toString() !== userId) {
      console.log("⛔ Unauthorized access attempt");
      return res.status(403).json({ msg: "Unauthorized to update this blog." });
    }

    const { title, content, category } = req.body;

    // 🔁 Update fields
    if (title) blog.title = title;
    if (content) blog.content = content;
    if (category) blog.category = category;

    // 🖼️ Check if a new image is being uploaded
    if (req.files && req.files.blogImage && req.files.blogImage.length > 0) {
      const imagePath = req.files.blogImage[0].location;
      console.log("✅ New blog image received:", imagePath);
      blog.image = imagePath;
    } else {
      console.log("ℹ️ No new blog image uploaded");
    }

    await blog.save();

    console.log("✅ Blog updated successfully:", blog);
    res.json({ msg: "Blog updated successfully!", blog });

  } catch (err) {
    console.error("❌ Error while updating blog:", err);
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
        select: "username fullname email avatar", // Fetch only required fields
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