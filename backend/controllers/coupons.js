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
        const { code, discountType, value, expiresAt } = req.body;
        const coupon = await Coupon.create({ code, discountType, value, expiresAt });
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
