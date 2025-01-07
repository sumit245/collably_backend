const express = require("express");
const router = express.Router();
const referralCtrl = require("../controllers/referralCtrl");

// Get all referrals
router.get("/referrals", referralCtrl.getAllReferrals);
// Create referral
router.post("/referral", referralCtrl.createReferral);

// Search referral by ID
router.get("/referral/:id", referralCtrl.getReferralById);

// Search referral by name
router.get("/referral/name/:name", referralCtrl.getReferralByName);

module.exports = router;
