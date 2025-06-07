const Order = require("../models/orderModel");
const User = require("../models/userModel");
const Product = require("../models/productModel");
const Brand = require("../models/BrandModel");
const https = require("https");


const orderCtrl = {
  // Create a new order


createOrder: async (req, res) => {
  try {
    const { items, shippingAddress, totalAmount, paymentStatus } = req.body;

    // Ensure the user exists
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ msg: "User not found" });

    // Process items
    const updatedItems = [];
    for (let i = 0; i < items.length; i++) {
      const product = await Product.findById(items[i].product);
      if (!product) {
        return res
          .status(404)
          .json({ msg: `Product with id ${items[i].product} not found` });
      }

      updatedItems.push({
        product: product._id,
        quantity: items[i].quantity,
        price: items[i].price,
      });
    }

    // 🔥 Generate orderId like CollabJune25251
    const currentDate = new Date();
    const month = currentDate.toLocaleString("default", { month: "long" });
    const year = currentDate.getFullYear();

    const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const monthlyOrderCount = await Order.countDocuments({ createdAt: { $gte: startOfMonth } });

    const orderId = `Collab${month}${year}${monthlyOrderCount + 1}`;

    // Create and save the order
    const newOrder = new Order({
      user: req.user._id,
      items: updatedItems,
      shippingAddress,
      totalAmount,
      paymentStatus,
      orderId // ← Save the custom orderId
    });

    await newOrder.save();

    // Get product details
    const populatedOrder = await Order.findById(newOrder._id).populate("items.product").exec();

    // 🟢 Prepare WhatsApp message
    const userName = (
      user.fullname || user.name || user.firstName || user.username || "Customer"
    ).trim();

    const payload = {
      apiKey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY3ZWZjN2ZlYTVmMjc2NDM3NTI1NmM5YiIsIm5hbWUiOiJSaWp1bCBCaGF0aWEiLCJhcHBOYW1lIjoiQWlTZW5zeSIsImNsaWVudElkIjoiNjdlZmM3ZmVhNWYyNzY0Mzc1MjU2Yzk0IiwiYWN0aXZlUGxhbiI6IkJBU0lDX1RSSUFMIiwiaWF0IjoxNzQzNzY3NTUwfQ.yHiZ--dfXGC4qFbZOZ1JNM5tZ9S6znGoM7KDE_txF54",
      campaignName: "order_whatsapp",
      destination: `+91${user.contactNumber}`,
      userName: userName,
      source: "order-confirmation",
      templateParams: [
        userName,
        orderId
      ],
      paramsFallbackValue: {
        FirstName: "Customer"
      }
    };

    const data = JSON.stringify(payload);

    const options = {
      hostname: "backend.api-wa.co",
      path: "/campaign/digintra/api/v2",
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(data)
      }
    };

    const request = https.request(options, (response) => {
      let responseBody = "";
      response.on("data", (chunk) => { responseBody += chunk; });
      response.on("end", () => { console.log("WhatsApp API response:", responseBody); });
    });

    request.on("error", (error) => {
      console.error("WhatsApp API error:", error.message);
    });

    request.write(data);
    request.end();

    res.status(201).json({ msg: "Order created successfully", order: populatedOrder });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Error creating order" });
  }
},


  // Get orders by product's brand
  getBrandOrders: async (req, res) => {
    try {
      const brandId = req.params.brandId;
  
      const orders = await Order.find()
        .populate({
          path: "items.product",
          populate: { path: "brandId", select: "name" }, // fix: populate brandId
        })
        .populate("user", "fullname"); // helpful if you want fullname
  
      const filteredOrders = orders.filter((order) =>
        order.items.some((item) =>
          item.product &&
          item.product.brandId &&
          item.product.brandId._id.toString() === brandId
        )
      );
  
      if (filteredOrders.length > 0) {
        const result = filteredOrders.map((order) => ({
          ...order.toObject(),
          fullname: order.user?.fullname || "Unknown",
        }));
  
        console.log("Filtered Orders with Fullnames: ", result);
        return res.json(result);
      } else {
        return res.status(404).json({ message: "No orders found for this brand" });
      }
    } catch (err) {
      console.error("Error: ", err);
      return res.status(500).json({ message: "Error fetching orders", error: err.message });
    }
  },
  

  // Get all orders for a specific user
  getUserOrders: async (req, res) => {
    try {
      const orders = await Order.find();
      res.json({ orders });
    } catch (err) {
      console.error(err);
      res.status(500).json({ msg: "Error fetching orders" });
    }
  },

  // Get a specific order by its ID
  getOrderById: async (req, res) => {
    try {
      const order = await Order.findById(req.params.id).populate(
        "items.product"
      );
      if (!order) {
        return res.status(404).json({ msg: "Order not found" });
      }
      res.json({ order });
    } catch (err) {
      console.error(err);
      res.status(500).json({ msg: "Error fetching order" });
    }
  },

  // Update order status (e.g., from 'pending' to 'shipped')
  updateOrderStatus: async (req, res) => {
    try {
      const { status } = req.body;
      const validStatuses = ["pending", "shipped", "delivered", "cancelled"];

      if (!validStatuses.includes(status)) {
        return res.status(400).json({ msg: "Invalid status" });
      }

      const order = await Order.findByIdAndUpdate(
        req.params.id,
        { orderStatus: status },
        { new: true }
      );

      if (!order) {
        return res.status(404).json({ msg: "Order not found" });
      }

      res.json({ msg: "Order status updated", order });
    } catch (err) {
      console.error(err);
      res.status(500).json({ msg: "Error updating order status" });
    }
  },

  // Get all orders (for admins)
  getAllOrders: async (req, res) => {
    try {
      const orders = await Order.find()
        .populate("user")
        .populate("items.product");
      res.json({ orders });
    } catch (err) {
      console.error(err);
      res.status(500).json({ msg: "Error fetching orders" });
    }
  },

  getAllByPassedOrders: async (req, res) => {
    try {
      const orders = await Order.find();
      res.json({ orders });
    } catch (err) {
      console.error(err);
    }
  },

  // Cancel an order (by user)
  cancelOrder: async (req, res) => {
    try {
      const order = await Order.findById(req.params.id);
      if (!order) {
        return res.status(404).json({ msg: "Order not found" });
      }

      if (order.user.toString() !== req.user._id.toString()) {
        return res
          .status(403)
          .json({ msg: "You are not authorized to cancel this order" });
      }

      if (
        order.orderStatus === "shipped" ||
        order.orderStatus === "delivered"
      ) {
        return res
          .status(400)
          .json({ msg: "Cannot cancel a shipped or delivered order" });
      }

      order.orderStatus = "cancelled";
      await order.save();

      res.json({ msg: "Order cancelled successfully", order });
    } catch (err) {
      console.error(err);
      res.status(500).json({ msg: "Error cancelling order" });
    }
  },
};

module.exports = orderCtrl;
