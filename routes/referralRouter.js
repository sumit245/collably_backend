const express = require("express");
const router = express.Router();
const referralCtrl = require("../controllers/referralCtrl");
const Referral = require('../models/referralModel')
const Products = require('../models/productModel')
const Users = require('../models/userModel')

// Create referral
router.post("/ref", referralCtrl.createReferral);

// Search referral by ID
router.get("/ref/:id", referralCtrl.getReferralById);

// Search referral by name
router.get("/ref/name/:name", referralCtrl.getReferralByName);

// Get all referrals
router.get("/ref", referralCtrl.getAllReferrals);

// Test referal url
router.get('/ref/code/:code', async (req, res, next) => {
    try {
        const { code } = req.params
        const result = await Referral.findOne({ referralCode: code })
        const { productId, userId } = result
        if (productId) {
            const refferedProduct = await Products.findById(productId)
            const referredBy = await Users.findById(userId)
            if (refferedProduct) res.status(200).json({ refferedProduct, referredBy })
        } else {
            res.json({
                msg: "No Product Linked with this referral"
            }).status(404)
        }
        // res.json({
        //     productId
        // }).status(200)

    } catch (err) {
        res.send(err).status(500)
    }

})

module.exports = router;
