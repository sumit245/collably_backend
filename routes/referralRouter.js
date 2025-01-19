const express = require("express");
const router = express.Router();
const referralCtrl = require("../controllers/referralCtrl");


router.post("/createreferral", referralCtrl.createReferral); 
router.get(
  "/:productname/:referralCode",
  referralCtrl.getProductInfoFromReferral
);

router.get("/referral/:id", referralCtrl.getReferralById);

router.get("/referral/name/:name", referralCtrl.getReferralByName);

router.get("/referrals", referralCtrl.getAllReferrals);

module.exports = router;
