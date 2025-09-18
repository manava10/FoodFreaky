const express = require('express');
const router = express.Router();
const { validateCoupon } = require('../controllers/coupons');

// @desc    Validate a coupon code
// @route   POST /api/coupons/validate
// @access  Public
router.post('/validate', validateCoupon);

module.exports = router;
