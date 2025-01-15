const Order = require("../models/orderModel");
const User = require("../models/userModel");
const Product = require("../models/productModel"); 

const orderCtrl = {

  createOrder: async (req, res) => {
    try {
      const { items, shippingAddress, totalAmount, paymentStatus } = req.body;

      
      const user = await User.findById(req.user._id);
      if (!user) {
        return res.status(404).json({ msg: "User not found" });
      }

   
      // for (let item of items) {
      //   const product = await Product.findById(item.product);
      //   if (!product) {
      //     return res
      //       .status(404)
      //       .json({ msg: `Product with id ${item.product} not found` });
      //   }
      // }

  
      const newOrder = new Order({
        user: req.user._id,
        items,
        shippingAddress,
        totalAmount,
        paymentStatus,
      });

      await newOrder.save();

      res
        .status(201)
        .json({ msg: "Order created successfully", order: newOrder });
    } catch (err) {
      console.error(err);
      res.status(500).json({ msg: "Error creating order" });
    }
  },

 
  getUserOrders: async (req, res) => {
    try {
      const orders = await Order.find({ user: req.user._id });
      res.json({ orders });
    } catch (err) {
      console.error(err);
      res.status(500).json({ msg: "Error fetching orders" });
    }
  },


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
