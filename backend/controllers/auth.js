const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const sendEmail = require('../utils/sendEmail');
const generateOTP = require('../utils/generateOTP');
const crypto = require('crypto');

// Generate JWT
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: '30d',
    });
};

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res) => {
    const { name, email, password, contactNumber } = req.body;

    // Email domain validation
    const allowedDomains = ['gmail.com', 'vitapstudent.ac.in'];
    const emailDomain = email.split('@')[1];

    if (!allowedDomains.includes(emailDomain)) {
        return res.status(400).json({ msg: 'Registration is only allowed for @gmail.com and @vitapstudent.ac.in emails.' });
    }

    try {
        let user = await User.findOne({ email });
        if (user && user.isVerified) {
            return res.status(400).json({ msg: 'User already exists and is verified.' });
        }

        const otp = generateOTP();
        const otpExpires = Date.now() + 10 * 60 * 1000; // 10 minutes

        if (user && !user.isVerified) {
            // User exists but is not verified, update their info and resend OTP
            user.name = name;
            user.password = password; // Will be hashed by pre-save hook
            user.contactNumber = contactNumber;
            user.otp = otp;
            user.otpExpires = otpExpires;
            // Mark password as modified to ensure pre-save hook runs
            user.markModified('password');
            await user.save();
        } else {
            // Create new unverified user
            user = await User.create({ name, email, password, contactNumber, otp, otpExpires });
        }

        // Send OTP email
        const message = `<p>Your verification code for FoodFreaky is:</p><h2>${otp}</h2><p>This code will expire in 10 minutes.</p>`;
        await sendEmail({ email: user.email, subject: 'FoodFreaky - Email Verification', html: message });

        res.status(200).json({ success: true, msg: 'OTP sent to email. Please verify.' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ msg: 'Server error during registration.' });
    }
};

exports.verifyOtp = async (req, res) => {
    const { email, otp } = req.body;
    try {
        const user = await User.findOne({ email, otp, otpExpires: { $gt: Date.now() } });

        if (!user) {
            return res.status(400).json({ msg: 'Invalid OTP or OTP has expired.' });
        }

        user.isVerified = true;
        user.otp = undefined;
        user.otpExpires = undefined;
        await user.save();

        // Automatically log the user in by sending back a token
        const payload = { id: user._id, name: user.name, email: user.email, role: user.role, contactNumber: user.contactNumber, createdAt: user.createdAt };
        const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });

        res.status(200).json({ success: true, msg: 'Email verified successfully.', token, user: payload });
    } catch (error) {
        console.error(error);
        res.status(500).json({ msg: 'Server error during OTP verification.' });
    }
};

exports.login = async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await User.findOne({ email }).select('+password');
        if (!user) {
            return res.status(400).json({ msg: 'Invalid credentials.' });
        }
        
        if (!user.isVerified) {
            return res.status(401).json({ msg: 'Account not verified. Please check your email for an OTP.' });
        }
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ msg: 'Invalid credentials.' });
        }

        const payload = { id: user._id, name: user.name, email: user.email, role: user.role, contactNumber: user.contactNumber, createdAt: user.createdAt };
        const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });
        
        res.json({ token, user: payload });
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Server error during login.' });
    }
};

// @desc    Forgot password
// @route   POST /api/auth/forgotpassword
exports.forgotPassword = async (req, res) => {
    try {
        const user = await User.findOne({ email: req.body.email });

        if (!user) {
            return res.status(404).json({ msg: 'There is no user with that email' });
        }

        // Get reset token
        const resetToken = user.getResetPasswordToken();

        await user.save({ validateBeforeSave: false });

        // Create reset URL
        const resetUrl = `${process.env.FRONTEND_URL}/resetpassword/${resetToken}`;

        const message = `You are receiving this email because you (or someone else) has requested the reset of a password. Please click the link below to reset it. This link is valid for only 5 minutes. \n\n <a href="${resetUrl}">${resetUrl}</a>`;

        try {
            await sendEmail({
                email: user.email,
                subject: 'Password Reset Token',
                html: `<p>Please click the link to reset your password. This link is valid for only 5 minutes.</p><p><a href="${resetUrl}">${resetUrl}</a></p>`
            });

            res.status(200).json({ success: true, data: 'Email sent' });
        } catch (err) {
            console.error(err);
            user.resetPasswordToken = undefined;
            user.resetPasswordExpire = undefined;
            await user.save({ validateBeforeSave: false });
            return res.status(500).json({ msg: 'Email could not be sent' });
        }
    } catch (error) {
        res.status(500).json({ msg: 'Server Error' });
    }
};

// @desc    Reset password
// @route   PUT /api/auth/resetpassword/:resettoken
exports.resetPassword = async (req, res) => {
    try {
        // Get hashed token
        const resetPasswordToken = crypto
            .createHash('sha256')
            .update(req.params.resettoken)
            .digest('hex');

        const user = await User.findOne({
            resetPasswordToken,
            resetPasswordExpire: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({ msg: 'Invalid or expired token' });
        }

        // Set new password
        user.password = req.body.password;
        user.resetPasswordToken = undefined;
        user.resetPasswordExpire = undefined;
        await user.save();

        res.status(200).json({ success: true, data: 'Password reset successful' });

    } catch (error) {
        res.status(500).json({ msg: 'Server Error' });
    }
};

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res, next) => {
    try {
        const user = await User.findById(req.user.id);

        res.status(200).json({
            success: true,
            data: user,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, msg: 'Server error' });
    }
};
