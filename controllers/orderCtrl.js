const Order = require("../models/orderModel");
const User = require("../models/userModel");
const Product = require("../models/productModel");
const Brand = require("../models/BrandModel");

const orderCtrl = {
  // Create a new order
  createOrder: async (req, res) => {
    try {
      const { items, shippingAddress, totalAmount, paymentStatus } = req.body;

      // Ensure the user exists
      const user = await User.findById(req.user._id);
      if (!user) {
        return res.status(404).json({ msg: "User not found" });
      }

      // Process the items and ensure brandId is added
      const updatedItems = [];
      for (let i = 0; i < items.length; i++) {
        const product = await Product.findById(items[i].product); // Get the product from DB
        if (!product) {
          return res
            .status(404)
            .json({ msg: `Product with id ${items[i].product} not found` });
        }

        // Attach the brandId to the order item
        updatedItems.push({
          product: product._id,
          quantity: items[i].quantity,
          price: items[i].price,
        });
      }

      // Create the order
      const newOrder = new Order({
        user: req.user._id,
        items: updatedItems,
        shippingAddress,
        totalAmount,
        paymentStatus,
      });

      await newOrder.save();

      // Fetch the newly created order and populate the 'product' field in the items
      const populatedOrder = await Order.findById(newOrder._id)
        .populate("items.product") // Populate the product details
        .exec();

      // Now that 'product' is populated, we can also access brandId from it
      populatedOrder.items.forEach((item) => {
        item.product.brandId = item.product.brandId; // Ensure brandId is included
      });

      res
        .status(201)
        .json({ msg: "Order created successfully", order: populatedOrder });
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
