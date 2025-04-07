const Posts = require("../models/postModel");
const Comments = require("../models/commentModel");
const Users = require("../models/userModel");
const mongoose = require("mongoose");


const postCtrl = {
  
   createPost: async (req, res) => {
    try {
      console.log("Uploaded files:", req.files);

      // Check if files are uploaded
      if (!req.files || req.files.length === 0) {
        return res.status(400).json({ msg: "Please add an image or a video." });
      }

      let images = [];
      let video = null;

      // Determine if uploaded media is images or a video
      req.files.forEach((file) => {
        if (file.mimetype.startsWith("image/")) {
          images.push(file.location); // S3 URL
        } else if (file.mimetype.startsWith("video/")) {
          video = file.location; // S3 URL
        }
      });

      // Ensure either images OR video is uploaded, not both
      if (images.length > 0 && video) {
        return res
          .status(400)
          .json({ msg: "You can upload either images or a video, not both." });
      }

      // Extract text data from request
      const { content, caption, body, tags } = req.body;
      console.log("Extracted data:", { content, caption, body, tags });

      // Create a new post
      const newPost = new Posts({
        content,
        caption,
        body,
        tags: tags ? tags.split(",") : [],
        images,
        video,
        user: req.user._id,  // Assuming you have a `user` in req.user (JWT/Authentication)
      });

      // Save to database
      await newPost.save();

      return res.json({
        msg: "Post created successfully.",
        newPost,
      });
    } catch (err) {
      console.error("Error creating post:", err);
      return res.status(500).json({ msg: "Server error. Please try again later." });
    }
  },

  getPosts: async (req, res) => {
    try {
      const posts = await Posts.find()
        .sort("-createdAt")
        .populate("user likes", "avatar username fullname followers")
        .populate({
          path: "comments",
          populate: {
            path: "user likes",
            select: "-password",
          },
        });

      res.json({
        msg: "Success",
        result: posts.length,
        posts,
      });
    } catch (err) {
      return res.status(500).json({ msg: err.message });
    }
  },

  updatePost: async (req, res) => {
    try {
      const { content, images } = req.body;

      const post = await Posts.findOneAndUpdate(
        { _id: req.params.id },
        {
          content,
          images,
        },
        { new: true }
      )
        .populate("user likes", "avatar username fullname")
        .populate({
          path: "comments",
          populate: {
            path: "user likes",
            select: "-password",
          },
        });

      res.json({
        msg: "Post updated successfully.",
        newPost: {
          ...post._doc,
          content,
          images,
        },
      });
    } catch (err) {
      return res.status(500).json({ msg: err.message });
    }
  },

  likePost: async (req, res) => {
    try {
      const post = await Posts.find({
        _id: req.params.id,
        likes: req.user._id,
      });
      if (post.length > 0) {
        return res
          .status(400)
          .json({ msg: "You have already liked this post" });
      }

      const like = await Posts.findOneAndUpdate(
        { _id: req.params.id },
        {
          $push: { likes: req.user._id },
        },
        {
          new: true,
        }
      );

      if (!like) {
        return res.status(400).json({ msg: "Post does not exist." });
      }

      res.json({ msg: "Post liked successfully." });
    } catch (err) {
      return res.status(500).json({ msg: err.message });
    }
  },

  unLikePost: async (req, res) => {
    try {
      const like = await Posts.findOneAndUpdate(
        { _id: req.params.id },
        {
          $pull: { likes: req.user._id },
        },
        {
          new: true,
        }
      );

      if (!like) {
        return res.status(400).json({ msg: "Post does not exist." });
      }

      res.json({ msg: "Post unliked successfully." });
    } catch (err) {
      return res.status(500).json({ msg: err.message });
    }
  },

  getUserPosts: async (req, res) => {
    try {
      const { page = 1, limit = 10 } = req.query;
      const skip = (page - 1) * limit;
      const userId = req.params.id || req.user._id;

      console.log("Fetching posts for user ID:", userId);

      // Fetch posts for the given user
      const posts = await Posts.find({ user: userId })
        .sort("-createdAt")
        .skip(skip) // Implement pagination
        .limit(Number(limit)) // Implement pagination limit
        .populate("user", "avatar username fullname followers") // Populate user details
        .populate({
          path: "comments", // Populate comments with user and likes data
          populate: {
            path: "user likes",
            select: "-password", // Exclude password for privacy
          },
        });

      console.log("Fetched posts:", posts); // Log the populated posts to verify the result

      const totalPosts = await Posts.countDocuments({ user: userId });

      res.json({
        msg: "User posts fetched successfully",
        posts,
        totalPosts,
        totalPages: Math.ceil(totalPosts / limit),
        currentPage: Number(page),
      });
    } catch (err) {
      return res.status(500).json({ msg: err.message });
    }
  },

  getPost: async (req, res) => {
    try {
      const { id } = req.params;

      // Validate the ID
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ msg: "Invalid post ID" });
      }

      // Fetch the post
      const post = await Posts.findById(id)
        .populate("user likes", "avatar username fullname followers")
        .populate({
          path: "comments",
          populate: {
            path: "user likes",
            select: "-password",
          },
        });

      console.log("Post ID:", id);
      console.log("Fetched Post:", post);

      if (!post) {
        return res.status(400).json({ msg: "Post does not exist." });
      }

      res.json({ post });
    } catch (err) {
      return res.status(500).json({ msg: err.message });
    }
  },

  getPostDiscover: async (req, res) => {
    try {
      const newArr = [...req.user.following, req.user._id];

      const num = req.query.num || 8;

      const posts = await Posts.aggregate([
        { $match: { user: { $nin: newArr } } },
        { $sample: { size: Number(num) } },
      ]);

      res.json({
        msg: "Success",
        result: posts.length,
        posts,
      });
    } catch (err) {
      return res.status(500).json({ msg: err.message });
    }
  },

  deletePost: async (req, res) => {
    try {
      const post = await Posts.findOneAndDelete({
        _id: req.params.id,
        user: req.user._id,
      });

      await Comments.deleteMany({ _id: { $in: post.comments } });

      res.json({
        msg: "Post deleted successfully.",
        newPost: {
          ...post,
          user: req.user,
        },
      });
    } catch (err) {
      return res.status(500).json({ msg: err.message });
    }
  },

  reportPost: async (req, res) => {
    try {
      const post = await Posts.find({
        _id: req.params.id,
        reports: req.user._id,
      });
      if (post.length > 0) {
        return res
          .status(400)
          .json({ msg: "You have already reported this post" });
      }

      const report = await Posts.findOneAndUpdate(
        { _id: req.params.id },
        {
          $push: { reports: req.user._id },
        },
        {
          new: true,
        }
      );

      if (!report) {
        return res.status(400).json({ msg: "Post does not exist." });
      }

      res.json({ msg: "Post reported successfully." });
    } catch (err) {
      return res.status(500).json({ msg: err.message });
    }
  },

  savePost: async (req, res) => {
    try {
      const user = await Users.find({
        _id: req.user._id,
        saved: req.params.id,
      });
      if (user.length > 0) {
        return res
          .status(400)
          .json({ msg: "You have already saved this post." });
      }

      const save = await Users.findOneAndUpdate(
        { _id: req.user._id },
        {
          $push: { saved: req.params.id },
        },
        {
          new: true,
        }
      );

      if (!save) {
        return res.status(400).json({ msg: "User does not exist." });
      }

      res.json({ msg: "Post saved successfully." });
    } catch (err) {
      return res.status(500).json({ msg: err.message });
    }
  },

  unSavePost: async (req, res) => {
    try {
      const save = await Users.findOneAndUpdate(
        { _id: req.user._id },
        {
          $pull: { saved: req.params.id },
        },
        {
          new: true,
        }
      );

      if (!save) {
        return res.status(400).json({ msg: "User does not exist." });
      }

      res.json({ msg: "Post removed from collection successfully." });
    } catch (err) {
      return res.status(500).json({ msg: err.message });
    }
  },

  getSavePost: async (req, res) => {
    try {
      const user = await Users.findById(req.user._id).select("saved");

      if (!user) {
        return res.status(404).json({ msg: "User not found" });
      }

      const savedPosts = await Posts.find({
        _id: { $in: user.saved },
      }).sort("-createdAt");

      res.json({
        savedPosts,
        result: savedPosts.length,
      });
    } catch (err) {
      return res.status(500).json({ msg: err.message });
    }
  },

};

module.exports = postCtrl;
