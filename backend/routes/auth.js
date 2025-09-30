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
const { loginLimiter, registerLimiter, passwordResetLimiter } = require('../middleware/rateLimit');

const router = express.Router();

router.post('/register', registerLimiter, register);
router.post('/verify-otp', verifyOtp);
router.post('/login', loginLimiter, login);
router.post('/forgotpassword', passwordResetLimiter, forgotPassword);
router.put('/resetpassword/:resettoken', passwordResetLimiter, resetPassword);
router.get('/me', protect, getMe);

module.exports = router;
