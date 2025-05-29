const https = require("https");
const Product = require("../models/productModel");
const fetch = require("node-fetch");
const Order = require("../models/orderModel");
const User = require("../models/userModel");

exports.createOrderAndSyncShopify = async (req, res) => {
  try {
    const { items, shippingAddress, totalAmount, paymentStatus } = req.body;
   const user = await User.findOne(); // get any user temporarily for testing

    if (!user) return res.status(404).json({ msg: "User not found" });

    const shop = process.env.SHOPIFY_SHOP;
    const accessToken = process.env.SHOPIFY_ACCESS_TOKEN;

    const updatedItems = [];

    for (let item of items) {
      if (item.source === "shopify") {
        // Place order on Shopify
        const shopifyOrderPayload = {
          order: {
            line_items: [
              {
                variant_id: item.variantId,
                quantity: item.quantity,
              },
            ],
            customer: {
              email: user.email,
            },
            shipping_address: shippingAddress,
            financial_status: paymentStatus === "paid" ? "paid" : "pending",
          },
        };

        const response = await fetch(
          `https://${shop}.myshopify.com/admin/api/2023-10/orders.json`,
          {
            method: "POST",
            headers: {
              "X-Shopify-Access-Token": accessToken,
              "Content-Type": "application/json",
            },
            body: JSON.stringify(shopifyOrderPayload),
          }
        );

        if (!response.ok) {
          const errorData = await response.json();
          console.error("Shopify Order Error:", errorData);
          return res.status(response.status).json({
            msg: "Failed to place order on Shopify",
            error: errorData,
          });
        }

        const shopifyOrder = await response.json();

        // Push Shopify order as a reference
        updatedItems.push({
          product: item.id, // Shopify product ID
          quantity: item.quantity,
          price: item.price,
          source: "shopify",
          shopifyOrderId: shopifyOrder.order?.id,
        });
      } else {
        // Local product
        const product = await Product.findById(item.id);
        if (!product) {
          return res
            .status(404)
            .json({ msg: `Local product with ID ${item.id} not found` });
        }

        updatedItems.push({
          product: product._id,
          quantity: item.quantity,
          price: item.price,
          source: "local",
        });
      }
    }

    const newOrder = new Order({
      user: req.user._id,
      items: updatedItems,
      shippingAddress,
      totalAmount,
      paymentStatus,
    });

    await newOrder.save();

    const populatedOrder = await Order.findById(newOrder._id)
      .populate("items.product")
      .exec();

    res
      .status(201)
      .json({ msg: "Order created successfully", order: populatedOrder });
  } catch (err) {
    console.error("Order Creation Error:", err);
    res.status(500).json({ msg: "Error creating order", error: err.message });
  }
};

exports.syncShopifyProducts = async (req, res) => {
  try {
    const shop = process.env.SHOPIFY_SHOP;
    const accessToken = process.env.SHOPIFY_ACCESS_TOKEN;

    const response = await fetch(`https://${shop}.myshopify.com/admin/api/2023-10/products.json`, {
      method: "GET",
      headers: {
        "X-Shopify-Access-Token": accessToken,
        "Content-Type": "application/json"
      }
    });

    if (!response.ok) {
      return res.status(response.status).json({ error: `Shopify API error: ${response.statusText}` });
    }

    const data = await response.json();

    if (!data.products) {
      return res.status(400).json({ error: "No products found in Shopify response" });
    }

    // Fetch your local products from DB
    const localProducts = await Product.find().lean();

    // Normalize Shopify products if needed (optional)
    const shopifyProducts = data.products.map(p => ({
      id: p.id,
      title: p.title,
      price: p.variants?.[0]?.price || null,
      source: 'shopify',
      raw: p // Keep full raw data if you want
    }));

    // Normalize local products similarly if needed
    const normalizedLocalProducts = localProducts.map(p => ({
      id: p._id,
      title: p.name || p.title,
      price: p.price,
      source: 'local',
      raw: p
    }));

    // Combine both
    const combinedProducts = [...normalizedLocalProducts, ...shopifyProducts];

    res.status(200).json({
      count: combinedProducts.length,
      products: combinedProducts
    });

  } catch (error) {
    console.error("Shopify Sync Error:", error);
    res.status(500).json({ error: "Error processing Shopify data" });
  }
};

exports.ShopifyProducts = async (req, res) => {
  try {
    const shop = process.env.SHOPIFY_SHOP;
    const accessToken = process.env.SHOPIFY_ACCESS_TOKEN;

    console.log("Shop:", shop);
    console.log("Access Token:", accessToken);

    const response = await fetch(`https://${shop}.myshopify.com/admin/api/2023-10/products.json`, {
      method: "GET",
      headers: {
        "X-Shopify-Access-Token": accessToken,
        "Content-Type": "application/json"
      }
    });

    console.log("Status Code:", response.status);

    const data = await response.json();
    console.log("Response JSON:", data);

    if (!data.products) {
      return res.status(400).json({ error: "No products found in response" });
    }

    const productCount = data.products.length;

    // You can add logic here to save products to DB

    res.status(200).json({ 
      count: productCount,
      products: data.products 
    });

  } catch (error) {
    console.error("Shopify Sync Error:", error);
    res.status(500).json({ error: "Error processing Shopify data" });
  }
};

exports.getShopifyProductById = async (req, res) => {
  try {
    const { id } = req.params;
    const shop = process.env.SHOPIFY_SHOP;
    const accessToken = process.env.SHOPIFY_ACCESS_TOKEN;

    const response = await fetch(
      `https://${shop}.myshopify.com/admin/api/2023-10/products/${id}.json`,
      {
        method: "GET",
        headers: {
          "X-Shopify-Access-Token": accessToken,
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      return res.status(response.status).json({
        error: `Shopify API error: ${response.statusText}`,
      });
    }

    const data = await response.json();

    if (!data.product) {
      return res.status(404).json({ error: "Product not found" });
    }

    res.status(200).json({ product: data.product });
  } catch (error) {
    console.error("Error fetching Shopify product:", error);
    res.status(500).json({ error: "Failed to fetch product details" });
  }
};
