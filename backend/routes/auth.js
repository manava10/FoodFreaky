const express = require('express');
const {
    register,
    login,
    getMe,
    verifyOtp,
    forgotPassword,
    resetPassword,
    googleAuth,
    updateProfile
} = require('../controllers/auth');
const { protect } = require('../middleware/auth');
const {
    authLimiter,
    otpLimiter,
    passwordResetLimiter
} = require('../middleware/rateLimiter');
const { validate, schemas } = require('../middleware/validate');
const router = express.Router();

// Public auth routes with appropriate rate limiting and validation
// OTP-related routes (stricter per-email/phone limiting to prevent SMS/email bombing)
router.post('/register', otpLimiter, validate(schemas.register), register);
router.post('/verify-otp', authLimiter, validate(schemas.verifyOtp), verifyOtp);

// Login (user-based + IP-based hybrid limiting)
router.post('/login', authLimiter, validate(schemas.login), login);

// Google OAuth authentication
router.post('/google', authLimiter, validate(schemas.googleAuth), googleAuth);

// Password reset (stricter per-email limiting)
router.post('/forgotpassword', passwordResetLimiter, validate(schemas.forgotPassword), forgotPassword);
router.put('/resetpassword/:resettoken', passwordResetLimiter, validate(schemas.resetPassword), resetPassword);

// Protected routes (no rate limiting needed - already authenticated)
router.get('/me', protect, getMe);
router.put('/profile', protect, validate(schemas.updateProfile), updateProfile);

module.exports = router;
