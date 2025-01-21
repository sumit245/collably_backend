const express = require("express");
const router = express.Router();
const referralCtrl = require("../controllers/referralCtrl");
const Product = require("../models/productModel");
const User = require("../models/userModel");

router.post("/createreferral", referralCtrl.createReferral);
// router.get(
//   "/:productname/:referralCode",
//   referralCtrl.getProductInfoFromReferral
// );

router.get("/referral/:id", referralCtrl.getReferralById);

router.get("/referral/name/:name", referralCtrl.getReferralByName);

router.get("/referrals", referralCtrl.getAllReferrals);

router.get("/ref/code/:code", async (req, res, next) => {
  try {
    const { code } = req.params;
    const result = await Referral.findOne({ referralCode: code });
    const { productId, userId } = result;
    if (productId) {
      const refferedProduct = await Product.findById(productId);
      const referredBy = await User.findById(userId);
      if (refferedProduct)
        res.status(200).json({ refferedProduct, referredBy });
    } else {
      res
        .json({
          msg: "No Product Linked with this referral",
        })
        .status(404);
    }
  } catch (err) {
    res.send(err).status(500);
  }
});

module.exports = router;
