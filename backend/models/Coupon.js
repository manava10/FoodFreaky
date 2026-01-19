const mongoose = require('mongoose');

const CouponSchema = new mongoose.Schema({
    code: {
        type: String,
        required: [true, 'Please add a coupon code'],
        unique: true,
        trim: true,
        uppercase: true
    },
    discountType: {
        type: String,
        required: true,
        enum: ['percentage', 'fixed']
    },
    value: {
        type: Number,
        required: [true, 'Please add a discount value']
    },
    expiresAt: {
        type: Date
    },
    isActive: {
        type: Boolean,
        default: true
    },
    usageLimit: {
        type: Number,
        default: null // null means unlimited uses
    },
    timesUsed: {
        type: Number,
        default: 0
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Indexes for better query performance
// Note: 'code' field already has an index from 'unique: true'
CouponSchema.index({ isActive: 1, expiresAt: 1 }); // For finding valid coupons
CouponSchema.index({ createdAt: -1 }); // For listing coupons in admin panel

module.exports = mongoose.model('Coupon', CouponSchema);

