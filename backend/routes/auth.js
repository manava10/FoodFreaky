const express = require('express');
const {
    register,
    login,
    getMe,
    verifyOtp,
    forgotPassword,
    resetPassword
} = require('../controllers/auth');
const { protect } = require('../middleware/auth');
const {
    authLimiter,
    otpLimiter,
    passwordResetLimiter
} = require('../middleware/rateLimiter');
const router = express.Router();

// Public auth routes with appropriate rate limiting
// OTP-related routes (stricter per-email/phone limiting to prevent SMS/email bombing)
router.post('/register', otpLimiter, register);
router.post('/verify-otp', authLimiter, verifyOtp);

// Login (user-based + IP-based hybrid limiting)
router.post('/login', authLimiter, login);

// Password reset (stricter per-email limiting)
router.post('/forgotpassword', passwordResetLimiter, forgotPassword);
router.put('/resetpassword/:resettoken', passwordResetLimiter, resetPassword);

// Protected routes (no rate limiting needed - already authenticated)
router.get('/me', protect, getMe);

module.exports = router;
