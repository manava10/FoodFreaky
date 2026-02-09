const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const sendEmail = require('../utils/sendEmail');
const generateOTP = require('../utils/generateOTP');
const crypto = require('crypto');
const logger = require('../utils/logger');

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

        logger.info(`OTP sent to ${email} for registration`);
        res.status(200).json({ success: true, msg: 'OTP sent to email. Please verify.' });
    } catch (error) {
        logger.error('Registration error:', { error: error.message, stack: error.stack, email });
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

        logger.info(`User ${email} verified successfully`);
        res.status(200).json({ success: true, msg: 'Email verified successfully.', token, user: payload });
    } catch (error) {
        logger.error('OTP verification error:', { error: error.message, stack: error.stack, email });
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
        
        logger.info(`User ${email} logged in successfully`);
        res.json({ token, user: payload });
    } catch (err) {
        logger.error('Login error:', { error: err.message, stack: err.stack, email });
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

            logger.info(`Password reset email sent to ${user.email}`);
            res.status(200).json({ success: true, data: 'Email sent' });
        } catch (err) {
            logger.error('Password reset email error:', { error: err.message, stack: err.stack, email: user.email });
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
        logger.error('Get user profile error:', { error: error.message, stack: error.stack, userId: req.user.id });
        res.status(500).json({ success: false, msg: 'Server error' });
    }
};

// @desc    Update user profile (contact number)
// @route   PUT /api/auth/profile
// @access  Private
exports.updateProfile = async (req, res) => {
    try {
        const { contactNumber } = req.body;

        // Validate contact number format (10 digits)
        if (!contactNumber || !/^[0-9]{10}$/.test(contactNumber)) {
            return res.status(400).json({ 
                success: false, 
                msg: 'Contact number must be exactly 10 digits' 
            });
        }

        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ success: false, msg: 'User not found' });
        }

        user.contactNumber = contactNumber;
        await user.save();

        logger.info(`User ${req.user.id} updated contact number`);

        res.status(200).json({
            success: true,
            msg: 'Contact number updated successfully',
            data: {
                contactNumber: user.contactNumber
            }
        });
    } catch (error) {
        logger.error('Update profile error:', {
            error: error.message,
            stack: error.stack,
            userId: req.user?.id
        });
        res.status(500).json({ success: false, msg: 'Server error' });
    }
};

// @desc    Google OAuth authentication
// @route   POST /api/auth/google
// @access  Public
exports.googleAuth = async (req, res) => {
    try {
        const { idToken } = req.body;

        if (!idToken) {
            return res.status(400).json({ msg: 'Google ID token is required' });
        }

        // Verify Google ID token
        const { OAuth2Client } = require('google-auth-library');
        const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

        const ticket = await client.verifyIdToken({
            idToken: idToken,
            audience: process.env.GOOGLE_CLIENT_ID,
        });

        const payload = ticket.getPayload();
        const { sub: googleId, email, name, picture } = payload;

        // Check if user exists with this Google ID
        let user = await User.findOne({ googleId });

        if (user) {
            // User exists, log them in
            const tokenPayload = { 
                id: user._id, 
                name: user.name, 
                email: user.email, 
                role: user.role, 
                contactNumber: user.contactNumber, 
                createdAt: user.createdAt 
            };
            const token = jwt.sign(tokenPayload, process.env.JWT_SECRET, { expiresIn: '30d' });
            
            logger.info(`User ${email} logged in with Google`);
            return res.status(200).json({ 
                success: true, 
                token, 
                user: tokenPayload 
            });
        }

        // Check if user exists with this email (but signed up with email/password)
        user = await User.findOne({ email });

        if (user) {
            // User exists with email/password, link Google account
            user.googleId = googleId;
            if (picture) user.picture = picture;
            await user.save();

            const tokenPayload = { 
                id: user._id, 
                name: user.name, 
                email: user.email, 
                role: user.role, 
                contactNumber: user.contactNumber, 
                createdAt: user.createdAt 
            };
            const token = jwt.sign(tokenPayload, process.env.JWT_SECRET, { expiresIn: '30d' });
            
            logger.info(`User ${email} linked Google account`);
            return res.status(200).json({ 
                success: true, 
                token, 
                user: tokenPayload 
            });
        }

        // New user, create account
        // Use a clear placeholder for contact number (Google doesn't provide phone numbers)
        // User should update this in their profile
        const placeholderContact = '0000000000'; // Clear placeholder, not a real number
        
        user = await User.create({
            name,
            email,
            googleId,
            contactNumber: placeholderContact, // Placeholder - user should update in profile
            isVerified: true, // Google users are automatically verified
            picture: picture || null,
        });

        const tokenPayload = { 
            id: user._id, 
            name: user.name, 
            email: user.email, 
            role: user.role, 
            contactNumber: user.contactNumber, 
            createdAt: user.createdAt 
        };
        const token = jwt.sign(tokenPayload, process.env.JWT_SECRET, { expiresIn: '30d' });
        
        logger.info(`New user ${email} registered with Google`);
        res.status(201).json({ 
            success: true, 
            token, 
            user: tokenPayload,
            isNewUser: true 
        });
    } catch (error) {
        logger.error('Google auth error:', { 
            error: error.message, 
            stack: error.stack 
        });
        
        if (error.message.includes('Invalid token')) {
            return res.status(400).json({ msg: 'Invalid Google token' });
        }
        
        res.status(500).json({ msg: 'Server error during Google authentication' });
    }
};
