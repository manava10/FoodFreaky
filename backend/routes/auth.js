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
const { authLimiter } = require('../middleware/rateLimiter');
const router = express.Router();

// Public auth routes with rate limiting to prevent brute-force attacks
router.post('/register', authLimiter, register);
router.post('/verify-otp', authLimiter, verifyOtp);
router.post('/login', authLimiter, login);
router.post('/forgotpassword', authLimiter, forgotPassword);
router.put('/resetpassword/:resettoken', authLimiter, resetPassword);

// Protected routes
router.get('/me', protect, getMe);

module.exports = router;

