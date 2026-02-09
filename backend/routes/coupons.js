const express = require('express');
const router = express.Router();
const { validateCoupon } = require('../controllers/coupons');
const { couponLimiter } = require('../middleware/rateLimiter');
const { validate, schemas } = require('../middleware/validate');

// @desc    Validate a coupon code
// @route   POST /api/coupons/validate
// @access  Public (with rate limiting to prevent abuse)
router.post('/validate', couponLimiter, validate(schemas.validateCoupon), validateCoupon);

module.exports = router;

