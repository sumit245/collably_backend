// routes/orderRouter.js
const router = require("express").Router();
const auth = require("../middleware/auth");
const brandauth = require("../middleware/brandauth");
const orderCtrl = require("../controllers/orderCtrl");

router.post("/order", auth, orderCtrl.createOrder);

router.get("/orders", orderCtrl.getUserOrders);

router.get("/order/:id", auth, orderCtrl.getOrderById);

router.patch("/order/:id/status", auth, orderCtrl.updateOrderStatus);

router.get("/brand/:brandId/orders", orderCtrl.getBrandOrders);

router.get("/getall/orders", auth, orderCtrl.getAllOrders);

router.patch("/order/:id/cancel", auth, orderCtrl.cancelOrder);

router.get("/bypassedadmin/orders", orderCtrl.getAllByPassedOrders);


module.exports = router;
