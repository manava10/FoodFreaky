const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const UserSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please add a name'],
    },
    email: {
        type: String,
        required: [true, 'Please add an email'],
        unique: true,
        match: [
            /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
            'Please add a valid email',
        ],
    },
    contactNumber: {
        type: String,
        required: function() {
            // Contact number is required only if user is not signing up with Google
            return !this.googleId;
        },
    },
    password: {
        type: String,
        required: function() {
            // Password is required only if user is not signing up with Google
            return !this.googleId;
        },
        minlength: 6,
        select: false, // Do not return password by default
    },
    googleId: {
        type: String,
        sparse: true, // Allows multiple null values but enforces uniqueness for non-null values
        unique: true,
    },
    otp: {
        type: String,
    },
    otpExpires: {
        type: Date,
    },
    isVerified: {
        type: Boolean,
        default: function() {
            // Google OAuth users are automatically verified
            return !!this.googleId;
        },
    },
    role: {
        type: String,
        enum: ['user', 'deliveryadmin', 'admin'],
        default: 'user',
    },
    resetPasswordToken: String,
    resetPasswordExpire: Date,
    favorites: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Restaurant'
    }],
    credits: {
        type: Number,
        default: 0,
        min: 0,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

// Indexes for better query performance
// Note: 'email' field already has an index from 'unique: true'
UserSchema.index({ resetPasswordToken: 1, resetPasswordExpire: 1 }); // For password reset lookup
UserSchema.index({ email: 1, otp: 1, otpExpires: 1 }); // For OTP verification
UserSchema.index({ role: 1 }); // For admin queries

// Encrypt password using bcrypt (only if password is provided and modified)
UserSchema.pre('save', async function (next) {
    // Skip password hashing if user is signing up with Google (no password) or password not modified
    if (!this.password || !this.isModified('password')) {
        return next();
    }

    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

// Match user entered password to hashed password in database
UserSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

// Method to generate and hash password reset token
UserSchema.methods.getResetPasswordToken = function () {
    // Generate token
    const resetToken = crypto.randomBytes(20).toString('hex');

    // Hash token and set to resetPasswordToken field
    this.resetPasswordToken = crypto
        .createHash('sha256')
        .update(resetToken)
        .digest('hex');

    // Set expire time (e.g., 5 minutes)
    this.resetPasswordExpire = Date.now() + 5 * 60 * 1000;

    return resetToken;
};


module.exports = mongoose.model('User', UserSchema);
