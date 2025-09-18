const Coupon = require('../models/Coupon');

// @desc    Get all coupons
// @route   GET /api/admin/coupons
// @access  Private (Admin)
exports.getCoupons = async (req, res) => {
    try {
        const coupons = await Coupon.find().sort({ createdAt: -1 });
        res.json({ success: true, data: coupons });
    } catch (error) {
        res.status(500).json({ msg: 'Server Error' });
    }
};

// @desc    Create a coupon
// @route   POST /api/admin/coupons
// @access  Private (Admin)
exports.createCoupon = async (req, res) => {
    try {
        const { code, discountType, value, expiresAt, usageLimit } = req.body;
        const couponData = { code, discountType, value, expiresAt, usageLimit };

        // Mongoose will ignore usageLimit if it's undefined or null, using the schema default
        const coupon = await Coupon.create(couponData);
        res.status(201).json({ success: true, data: coupon });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({ msg: 'Coupon code already exists' });
        }
        res.status(500).json({ msg: 'Server Error' });
    }
};

// @desc    Delete a coupon
// @route   DELETE /api/admin/coupons/:id
// @access  Private (Admin)
exports.deleteCoupon = async (req, res) => {
    try {
        const coupon = await Coupon.findById(req.params.id);
        if (!coupon) {
            return res.status(404).json({ msg: 'Coupon not found' });
        }
        await coupon.deleteOne();
        res.json({ success: true, data: {} });
    } catch (error) {
        res.status(500).json({ msg: 'Server Error' });
    }
};

// @desc    Validate a coupon code
// @route   POST /api/coupons/validate
// @access  Public
exports.validateCoupon = async (req, res) => {
    try {
        const { code } = req.body;
        if (!code) {
            return res.status(400).json({ msg: 'Coupon code is required' });
        }

        const coupon = await Coupon.findOne({ code: code.toUpperCase(), isActive: true });

        if (!coupon) {
            return res.status(404).json({ msg: 'Invalid or inactive coupon code' });
        }

        if (coupon.expiresAt && new Date(coupon.expiresAt) < new Date()) {
            return res.status(400).json({ msg: 'This coupon has expired' });
        }

        if (coupon.usageLimit !== null && coupon.timesUsed >= coupon.usageLimit) {
            return res.status(400).json({ msg: 'This coupon has reached its usage limit' });
        }

        res.json({ success: true, data: coupon });

    } catch (error) {
        console.error('Coupon validation error:', error);
        res.status(500).json({ msg: 'Server Error' });
    }
};
