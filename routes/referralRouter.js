const express = require("express");
const router = express.Router();
const referralCtrl = require("../controllers/referralCtrl");


router.post("/createreferral", referralCtrl.createReferral); //referalcreate
router.get( "/:productname/:referralCode", referralCtrl.getProductInfoFromReferral
);

// Search referral by ID
router.get("/referral/:id", referralCtrl.getReferralById);

// Search referral by name
router.get("/referral/name/:name", referralCtrl.getReferralByName);

// Get all referrals
router.get("/referrals", referralCtrl.getAllReferrals);

module.exports = router;
