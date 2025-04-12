const mongoose = require("mongoose");
const Referral = require("../models/referralModel");
const Product = require("../models/productModel");
const Users = require("../models/userModel");
const Brand = require("../models/BrandModel"); // Added Brand model import
const generateReferralCode = require("../utils/generateReferralCode");
const puppeteer = require("puppeteer");

exports.createReferral = async (req, res) => {
  try {
    const { userId, productUrl } = req.body;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Invalid userId" });
    }

    const user = await Users.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const username = user.username;

    // Get brand match
    let urlParts = new URL(productUrl);
    let baseUrl = urlParts.origin;
    let path = urlParts.pathname;

    const brands = await Brand.find({}, "brandWebsite");

    function getDomain(url) {
      try {
        return new URL(url).hostname.replace("www.", "");
      } catch (error) {
        return null;
      }
    }

    const productDomain = getDomain(productUrl);
    const matchedBrand = brands.find(brand => {
      const brandDomain = getDomain(brand.brandWebsite);
      return brandDomain && productDomain.includes(brandDomain);
    });

    const brandId = matchedBrand ? matchedBrand._id : null;

    // Generate referral code
    const referralCode = generateReferralCode();

    const referralLink = `${baseUrl}${path}?referralCode=${referralCode}`;

    const referral = new Referral({
      userId,
      brandId,
      username,
      referralCode,
      referralLink,
      iscount: 0,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      product: {
        url: productUrl
      }
    });

    await referral.save();

    // Scrape product metadata
    let productData = { title: null, price: null, image: null, url: productUrl };

    try {
      const browser = await puppeteer.launch({
        headless: true,
        args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-blink-features=AutomationControlled"],
      });

      const page = await browser.newPage();

      await page.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36");
      await page.setExtraHTTPHeaders({ "Accept-Language": "en-US,en;q=0.9" });
      await page.setViewport({ width: 1280, height: 800 });

      await page.goto(productUrl, { waitUntil: "networkidle2", timeout: 30000 });
      await new Promise((resolve) => setTimeout(resolve, 3000));

      const metadata = await page.evaluate(() => {
        const getTitle = () =>
          document.querySelector('meta[property="og:title"]')?.content ||
          document.querySelector("h1")?.innerText ||
          document.title ||
          null;

        const getImage = () =>
          document.querySelector('meta[property="og:image"]')?.content ||
          Array.from(document.images)
            .filter((img) => img.width > 200 && img.height > 200)
            .sort((a, b) => b.width * b.height - a.width * a.height)[0]?.src || null;

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
          return priceMatch ? priceMatch[0] : null;
        };

        return {
          title: getTitle(),
          image: getImage(),
          price: getPrice(),
        };
      });

      await browser.close();

      // Initialize product data with scraped info
      productData = {
        title: metadata.title,
        price: metadata.price,
        image: metadata.image, // Original image URL
        url: productUrl,
      };

      // Upload the product image to S3 if an image URL was found
      if (metadata.image) {
        try {
          const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
          const path = require("path");
          const https = require("https");
          const http = require("http");
          const fs = require("fs");
          const os = require("os");

          // Create a temporary file path
          const tempFilePath = path.join(os.tmpdir(), `product-${Date.now()}.jpg`);
          
          // Download the image to a temporary file
          await new Promise((resolve, reject) => {
            const protocol = metadata.image.startsWith('https') ? https : http;
            const file = fs.createWriteStream(tempFilePath);
            
            protocol.get(metadata.image, (response) => {
              if (response.statusCode !== 200) {
                reject(new Error(`Failed to download image: ${response.statusCode}`));
                return;
              }
              
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
          
          // Read the file
          const fileContent = fs.readFileSync(tempFilePath);
          
          // Initialize S3 client (same as in your uploadMiddleware)
          const s3 = new S3Client({
            region: process.env.AWS_DEFAULT_REGION,
            credentials: {
              accessKeyId: process.env.AWS_ACCESS_KEY_ID,
              secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
            },
          });
          
          // Create a unique key for the image
          const uniqueKey = `products/${Date.now()}${path.extname(metadata.image) || '.jpg'}`;
          
          // Upload to S3
          const command = new PutObjectCommand({
            Bucket: process.env.AWS_BUCKET,
            Key: uniqueKey,
            Body: fileContent,
            ContentType: 'image/jpeg',
          });
          
          await s3.send(command);
          
          // Clean up the temporary file
          fs.unlinkSync(tempFilePath);
          
          // Update product data with S3 URL
          productData.image = `https://${process.env.AWS_BUCKET}.s3.${process.env.AWS_DEFAULT_REGION}.amazonaws.com/${uniqueKey}`;
          console.log('Product image uploaded to S3:', productData.image);
        } catch (uploadError) {
          console.error('Error uploading product image to S3:', uploadError);
          // Keep the original image URL if upload fails
        }
      }

      // Update referral with product info
      await Referral.findByIdAndUpdate(referral._id, {
        product: productData,
      });

      referral.product = productData;

    } catch (scrapeErr) {
      console.error("Error scraping product data:", scrapeErr);
    }

    return res.status(201).json({
      success: true,
      message: "Referral created successfully",
      referral,
      referralLink,
      user: {
        _id: user._id,
        email: user.email,
        username: user.username,
      },
    });
  } catch (error) {
    console.error("Error creating referral:", error);
    return res.status(500).json({ message: "Error creating referral" });
  }
};

exports.getReferralsByUserId = async (req, res) => {
  try {
    const { id } = req.params; 

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid userId" });
    }

    const referrals = await Referral.find({
      userId: new mongoose.Types.ObjectId(id),
    });

    if (referrals.length === 0) {
      return res
        .status(404)
        .json({ message: "No referrals found for this user" });
    }

    res.status(200).json(referrals);
  } catch (error) {
    console.error("Error fetching referrals:", error);
    res.status(500).json({ message: "Error fetching referrals for the user" });
  }
};

exports.getReferralsByBrandId = async (req, res) => {
  try {
    const { id } = req.params; 

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid brandId" });
    }

    const referrals = await Referral.find({
      brandId: new mongoose.Types.ObjectId(id),
    }).populate("userId", "fullname") 
    .exec(); // Execute the query;

    // if (referrals.length === 0) {
    //   return res
    //     .status(404)
    //     .json({ message: "No referrals found for this Brand" });
    // }

    res.status(200).json(referrals.length ? referrals : []);
  } catch (error) {
    console.error("Error fetching referrals:", error);
    res.status(500).json({ message: "Error fetching referrals for the Brand" });
  }
};

exports.getReferralsByUserAndBrand = async (req, res) => {
  try {
    const { userId, brandId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(userId) || !mongoose.Types.ObjectId.isValid(brandId)) {
      return res.status(400).json({ message: "Invalid userId or brandId" });
    }

    const referrals = await Referral.find({
      userId: new mongoose.Types.ObjectId(userId),
      brandId: new mongoose.Types.ObjectId(brandId),
    }).populate("userId", "fullname");

    res.status(200).json(referrals.length ? referrals : []);
  } catch (error) {
    console.error("Error fetching referrals:", error);
    res.status(500).json({ message: "Error fetching referrals for the user and brand" });
  }
};

exports.getUsersByBrandId = async (req, res) => {
  try {
    const { brandId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(brandId)) {
      return res.status(400).json({ message: "Invalid brandId" });
    }

    const referrals = await Referral.find({ brandId: new mongoose.Types.ObjectId(brandId) })
      .populate("userId", "fullname email role" ) // Fetch user details
      .exec();

    // Extract unique users from referrals
    const uniqueUsers = [...new Map(referrals.map(ref => [ref.userId._id.toString(), ref.userId])).values()];

    res.status(200).json(uniqueUsers);
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ message: "Error fetching users for the brand" });
  }
};


exports.getReferralByName = async (req, res) => {
  try {
    const referrals = await Referral.find({
      name: new RegExp(req.params.name, "i"),
    });

    if (referrals.length === 0) {
      return res
        .status(404)
        .json({ message: "No referrals found by that name" });
    }

    res.json(referrals);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error fetching referrals by name" });
  }
};

exports.getAllReferrals = async (req, res) => {
  try {
  
    const referrals = await Referral.find()
      .populate("userId", "fullname") 
      .exec(); // Execute the query

    if (referrals.length === 0) {
      return res.status(404).json({ message: "No referrals found" });
    }

    // Return the populated referrals with the username included
    res.status(200).json(referrals);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error fetching all referrals" });
  }
};

exports.getReferralByCode = async (req, res) => {
  try {
    const { code } = req.params;

    // Find the referral by referralCode
    const referral = await Referral.findOne({ referralCode: code });
    if (!referral) {
      return res.status(404).json({ msg: "Referral not found" });
    }

    // Increment the clicks field by 1
    referral.clicks += 1; // Increment the number of clicks
    await referral.save(); // Save the updated referral document

    // Redirect to the product page using the referral link
    const productUrl = referral.referralLink; // This is the full referral link

    if (!productUrl) {
      return res
        .status(404)
        .json({ msg: "No product URL linked with this referral" });
    }

    // Return the updated referral data (you can also return the click count here)
    res.status(200).json({
      message: "Referral link clicked",
      clicks: referral.clicks, // Include the updated clicks count
      redirectUrl: productUrl, // Return the referral link as a redirect URL
    });

    // Optionally, you can redirect the user:
    // res.redirect(productUrl);
  } catch (err) {
    console.error(err);
    res.status(500).send(err);
  }
};

exports.getReferralClicks = async (req, res) => {
  try {
    const { code } = req.params;

    // Find the referral by code
    const referral = await Referral.findOne({ referralCode: code });
    if (!referral) {
      return res.status(404).json({ message: "Referral not found" });
    }

    // Return the clicks count
    res.status(200).json({
      referralCode: referral.referralCode,
      clicks: referral.clicks, // Show the number of clicks
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error fetching referral clicks" });
  }
};