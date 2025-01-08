// routes/orderRouter.js
const router = require("express").Router();
const auth = require("../middleware/auth");
const orderCtrl = require("../controllers/orderCtrl");


router.post("/order", auth, orderCtrl.createOrder);

router.get("/orders", auth, orderCtrl.getUserOrders);


router.get("/order/:id", auth, orderCtrl.getOrderById);


router.patch("/order/:id/status", auth, orderCtrl.updateOrderStatus);


router.get("/admin/orders", auth, orderCtrl.getAllOrders);


router.patch("/order/:id/cancel", auth, orderCtrl.cancelOrder);

module.exports = router;
