const express = require('express');
const router = express.Router();
const Coupon = require('../models/Coupon');

// @desc    Validate a coupon code
// @route   POST /api/coupons/validate
// @access  Public
router.post('/validate', async (req, res) => {
    try {
        const { code } = req.body;
        if (!code) {
            return res.status(400).json({ msg: 'Coupon code is required' });
        }

        const coupon = await Coupon.findOne({ code: code.toUpperCase(), isActive: true });

        if (!coupon) {
            return res.status(404).json({ msg: 'Invalid coupon code' });
        }

        if (coupon.expiresAt && new Date(coupon.expiresAt) < new Date()) {
            return res.status(400).json({ msg: 'This coupon has expired' });
        }

        res.json({ success: true, data: coupon });

    } catch (error) {
        res.status(500).json({ msg: 'Server Error' });
    }
});

module.exports = router;
