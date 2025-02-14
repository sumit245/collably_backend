const express = require("express");
const router = express.Router();
const referralCtrl = require("../controllers/referralCtrl");
const Referral = require("../models/referralModel");
const Product = require("../models/productModel");
const Users = require("../models/userModel");

router.post("/createreferral", referralCtrl.createReferral);

router.get("/referral/:id", referralCtrl.getReferralsByUserId);

router.get("/referral/name/:name", referralCtrl.getReferralByName);

router.get("/referrals", referralCtrl.getAllReferrals);

router.get("/ref/code/:code", referralCtrl.getReferralByCode);

module.exports = router;
