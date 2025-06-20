const Posts = require("../models/postModel");
const Comments = require("../models/commentModel");
const Users = require("../models/userModel");
const mongoose = require("mongoose");
const puppeteer = require("puppeteer");
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const path = require('path');
const https = require('https');
const http = require('http');
const fs = require('fs');
const os = require('os');

const postCtrl = {
 
  createPost: async (req, res) => {
    try {
      console.log("Uploaded files:", req.files);
  
      const mediaFiles = req.files.media || [];
      if (mediaFiles.length === 0) {
        return res.status(400).json({ msg: "Please add at least one image or video." });
      }
  
      let images = [];
      let video = null;
  
      mediaFiles.forEach((file) => {
        if (file.mimetype.startsWith("image/")) {
          images.push(file.location);
        } else if (file.mimetype.startsWith("video/")) {
          video = file.location;
        }
      });
  
      if (images.length > 0 && video) {
        return res.status(400).json({ msg: "Upload either images or a video, not both." });
      }
  
      const { content, caption, body, tags } = req.body;
      console.log("Extracted data:", { content, caption, body, tags });
  
      let products = [];
  
      // Extract up to 8 product URLs from caption
      const urlMatches = caption?.match(/(https?:\/\/[^\s]+)/g) || [];
      const productURLs = urlMatches.slice(0, 8);
  
      if (productURLs.length > 0) {
        const browser = await puppeteer.launch({
          headless: true,
          args: [
            "--no-sandbox",
            "--disable-setuid-sandbox",
            "--disable-blink-features=AutomationControlled",
          ],
        });
  
        // Process all product URLs in parallel
        products = await Promise.all(
          productURLs.map(async (productURL) => {
            const productData = {
              productTitle: null,
              productImage: null,
              productPrice: null,
              productURL,
            };
  
            try {
              const page = await browser.newPage();
              await page.setUserAgent(
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
              );
              await page.setExtraHTTPHeaders({
                "Accept-Language": "en-US,en;q=0.9",
              });
              await page.setViewport({ width: 1280, height: 800 });
  
              console.log("Navigating to product URL:", productURL);
              await page.goto(productURL, { waitUntil: "networkidle2", timeout: 60000 });
              await new Promise((resolve) => setTimeout(resolve, 3000));
  
              const metadata = await page.evaluate(() => {
                const getTitle = () =>
                  document.querySelector('meta[property="og:title"]')?.content ||
                  document.querySelector("h1")?.innerText ||
                  document.title ||
                  "N/A";
  
                const getImage = () =>
                  document.querySelector('meta[property="og:image"]')?.content ||
                  Array.from(document.images)
                    .filter((img) => img.width > 200 && img.height > 200)
                    .sort((a, b) => b.width * b.height - a.width * a.height)[0]?.src ||
                  "N/A";
  
                const getPrice = () => {
                  const priceSelectors = [
                    "._30jeq3",
                    ".price",
                    '[class*="price"]',
                  ];
                  for (const selector of priceSelectors) {
                    const price = document.querySelector(selector)?.innerText;
                    if (price) return price;
                  }
  
                  const bodyText = document.body.innerText;
                  const priceMatch =
                    bodyText.match(/₹\s?\d{1,3}(,\d{3})*(\.\d{2})?|₹\d+/) ||
                    bodyText.match(/\$\s?\d{1,3}(,\d{3})*(\.\d{2})?|\$\d+/) ||
                    bodyText.match(/Rs\.\s?\d+/);
                  return priceMatch ? priceMatch[0] : "N/A";
                };
  
                return {
                  title: getTitle(),
                  image: getImage(),
                  price: getPrice(),
                };
              });
  
              await page.close();
  
              productData.productTitle = metadata.title;
              productData.productImage = metadata.image;
              productData.productPrice = metadata.price;
  
              // Upload product image to S3 if available
              if (productData.productImage && productData.productImage !== "N/A") {
                try {
                  const tempFilePath = path.join(os.tmpdir(), `product-${Date.now()}-${Math.random().toString(36).substring(7)}.jpg`);
                  const protocol = productData.productImage.startsWith('https') ? https : http;
  
                  // Download image
                  await new Promise((resolve, reject) => {
                    const file = fs.createWriteStream(tempFilePath);
                    protocol.get(productData.productImage, (response) => {
                      if (response.statusCode !== 200) reject(new Error(`HTTP ${response.statusCode}`));
                      response.pipe(file);
                      file.on('finish', () => {
                        file.close();
                        resolve();
                      });
                    }).on('error', (err) => {
                      fs.unlink(tempFilePath, () => {});
                      reject(err);
                    });
                  });
  
                  // Upload to S3
                  const s3 = new S3Client({
                    region: process.env.AWS_DEFAULT_REGION,
                    credentials: {
                      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
                      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
                    },
                  });
  
                  const uniqueKey = `products/${Date.now()}-${Math.random().toString(36).substring(7)}${path.extname(productData.productImage) || '.jpg'}`;
                  const command = new PutObjectCommand({
                    Bucket: process.env.AWS_BUCKET,
                    Key: uniqueKey,
                    Body: fs.readFileSync(tempFilePath),
                    ContentType: 'image/jpeg',
                  });
  
                  await s3.send(command);
                  fs.unlinkSync(tempFilePath);
  
                  productData.productImage = `https://${process.env.AWS_BUCKET}.s3.${process.env.AWS_DEFAULT_REGION}.amazonaws.com/${uniqueKey}`;
                } catch (uploadError) {
                  console.error('Error uploading product image:', uploadError);
                  productData.productImage = null;
                }
              }
  
              return productData;
            } catch (error) {
              console.error(`Error processing product URL ${productURL}:`, error);
              return productData; // Return partial data with URL
            }
          })
        );
  
        await browser.close();
      }
  
      const newPost = new Posts({
        content,
        caption,
        body,
        tags: tags ? tags.split(",") : [],
        images,
        video,
        user: req.user._id,
        products: products.map(p => ({
          title: p.productTitle,
          image: p.productImage,
          price: p.productPrice,
          url: p.productURL,
        })),
      });
  
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
  
  updatePost: async (req, res) => {
    try {
      const mediaFiles = req.files?.media || [];
      // const brandLogoFile = req.files?.brandLogo?.[0];
  
      let images = [];
      let video = null;
  
      mediaFiles.forEach((file) => {
        if (file.mimetype.startsWith("image/")) {
          images.push(file.location);
        } else if (file.mimetype.startsWith("video/")) {
          video = file.location;
        }
      });
  
      if (images.length > 0 && video) {
        return res.status(400).json({ msg: "Upload either images or a video, not both." });
      }
  
      const { content, caption, body, tags } = req.body;
  
      const updateData = {
        content,
        caption,
        body,
        tags: tags ? tags.split(",") : [],
      };
  
      if (images.length > 0) updateData.images = images;
      if (video) updateData.video = video;
      // if (brandLogoFile) updateData.brandLogo = brandLogoFile.location;
  
      const post = await Posts.findOneAndUpdate(
        { _id: req.params.id },
        updateData,
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
  
      return res.json({
        msg: "Post updated successfully.",
        newPost: post,
      });
    } catch (err) {
      console.error("Error updating post:", err);
      return res.status(500).json({ msg: err.message });
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
  deleteAllPosts: async (req, res) => {
  try {
    // Delete all posts
    await Posts.deleteMany({});

    // Remove all saved references from users
    await Users.updateMany({}, { $set: { saved: [] } });

    res.json({ msg: "All posts have been deleted and unsaved from all users." });
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
    const post = await Posts.findByIdAndDelete(req.params.id);

    if (!post) {
      return res.status(404).json({ msg: "Post not found." });
    }

    // Delete related comments
    await Comments.deleteMany({ _id: { $in: post.comments } });

    // Unsave this post from all users
    await Users.updateMany(
      { saved: req.params.id },
      { $pull: { saved: req.params.id } }
    );

    res.json({
      msg: "Post deleted successfully and unsaved from all users.",
      newPost: post,
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
unSaveAllPosts: async (req, res) => {
  try {
    const user = await Users.findOneAndUpdate(
      { _id: req.user._id },
      { $set: { saved: [] } },
      { new: true }
    );

    if (!user) {
      return res.status(400).json({ msg: "User does not exist." });
    }

    res.json({
      msg: "All saved posts removed successfully.",
      saved: user.saved  // should be []
    });
  } catch (err) {
    console.error("Error in unSaveAllPosts:", err);
    return res.status(500).json({ msg: "Server error" });
  }
}
,

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
  extractProductInfo: async (req, res) => {
    try {
      const { url } = req.body;
      if (!url) {
        return res.status(400).json({ msg: "URL is required." });
      }

      const browser = await puppeteer.launch({
        headless: true,
        args: [
          "--no-sandbox",
          "--disable-setuid-sandbox",
          "--disable-blink-features=AutomationControlled",
        ],
      });

      const page = await browser.newPage();

      // Fake a real user agent and language
      await page.setUserAgent(
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
      );
      await page.setExtraHTTPHeaders({
        "Accept-Language": "en-US,en;q=0.9",
      });

      await page.setViewport({ width: 1280, height: 800 });

      await page.goto(url, { waitUntil: "networkidle2", timeout: 30000 });

      // Wait for common product selectors to appear (Flipkart fallback)
      await new Promise(resolve => setTimeout(resolve, 3000));


      const data = await page.evaluate(() => {
        const getTitle = () =>
          document.querySelector('meta[property="og:title"]')?.content ||
          document.querySelector("h1")?.innerText ||
          document.title ||
          "N/A";

        const getImage = () =>
          document.querySelector('meta[property="og:image"]')?.content ||
          Array.from(document.images)
            .filter((img) => img.width > 200 && img.height > 200)
            .sort((a, b) => b.width * b.height - a.width * a.height)[0]?.src ||
          "N/A";

        const getPrice = () => {
          const priceSelectors = [
            "._30jeq3", // Flipkart price
            ".price", // Generic class
            '[class*="price"]', // Fallback for unknown brand
          ];
          for (const selector of priceSelectors) {
            const price = document.querySelector(selector)?.innerText;
            if (price) return price;
          }

          const bodyText = document.body.innerText;
          const priceMatch =
            bodyText.match(/₹\s?\d{1,3}(,\d{3})*(\.\d{2})?|₹\d+/) ||
            bodyText.match(/\$\s?\d{1,3}(,\d{3})*(\.\d{2})?|\$\d+/) ||
            bodyText.match(/Rs\.\s?\d+/);
          return priceMatch ? priceMatch[0] : "N/A";
        };

        return {
          title: getTitle(),
          image: getImage(),
          price: getPrice(),
        };
      });

      await browser.close();
      return res.status(200).json(data);
    } catch (err) {
      console.error("Scraper error:", err);
      return res.status(500).json({ msg: err.message });
    }
  },

  searchPosts: async (req, res) => {
    try {
      const { q, category, sort } = req.query;
      
      // Base query conditions
      const queryConditions = [];
      
      // Add search query condition if provided
      if (q && q.trim() !== '') {
        queryConditions.push({
          $or: [
            { 'products.title': { $regex: q, $options: 'i' } },
            { 'products.price': { $regex: q, $options: 'i' } },
            { caption: { $regex: q, $options: 'i' } },
            { content: { $regex: q, $options: 'i' } },
            { tags: { $regex: q, $options: 'i' } }, // Add search in tags
            { 'user.username': { $regex: q, $options: 'i' } }, // Search in username
            { 'user.fullname': { $regex: q, $options: 'i' } }  // Search in fullname
          ]
        });
      }
      
      // Add category filter if provided
      if (category && category !== 'All Categories') {
        queryConditions.push({ tags: category });
      }
      
      // Combine all conditions with AND logic
      const finalQuery = queryConditions.length > 0 
        ? { $and: queryConditions } 
        : {};
      
      // Determine sort order
      let sortOption = { createdAt: -1 }; // Default: newest first
      if (sort === 'oldest') {
        sortOption = { createdAt: 1 };
      }
      
      // Find users whose username or fullname matches the search query for additional filtering
      if (q && q.trim() !== '') {
        const users = await Users.find({
          $or: [
            { username: { $regex: q, $options: 'i' } },
            { fullname: { $regex: q, $options: 'i' } }
          ]
        }).select('_id');
        
        const userIds = users.map(user => user._id);
        
        if (userIds.length > 0) {
          // If we have matching users, add them to the query with OR logic
          if (queryConditions.length > 0) {
            // If we already have other conditions, add user condition with OR
            finalQuery.$and[0].$or.push({ user: { $in: userIds } });
          } else {
            // If no other conditions, create a simple query
            finalQuery.$or = [
              { user: { $in: userIds } },
              ...(finalQuery.$or || [])
            ];
          }
        }
      }
      
      // Execute the query with proper sorting
      const posts = await Posts.find(finalQuery)
        .sort(sortOption)
        .populate('user likes', 'avatar username fullname followers')
        .populate({
          path: 'comments',
          populate: {
            path: 'user likes',
            select: '-password'
          }
        });
      
      return res.json({
        msg: "Search successful",
        result: posts.length,
        posts
      });
    } catch (err) {
      console.error("Search error:", err);
      return res.status(500).json({ msg: err.message });
    }
  }
  
  
  
  ,
};

module.exports = postCtrl;